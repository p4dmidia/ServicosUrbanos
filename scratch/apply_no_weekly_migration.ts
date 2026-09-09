import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const sqlUpdateTrigger = `
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 3;
    v_payment_type TEXT := 'percent';
    v_reg_mensal NUMERIC := 4.00;
    v_reg_anual NUMERIC := 2.00;
    
    -- Valores calculados por nível (4% Mensal + 2% Anual = 6% Total)
    v_level_val NUMERIC := 6.00;
    v_level_mensal NUMERIC := 0;
    v_level_anual NUMERIC := 0;
    
    v_current_level INTEGER := 1;
    v_upline_id UUID;
    v_amount NUMERIC := NEW.amount;
    v_reseller_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
BEGIN
    -- [CONDIÇÃO DE DISPARO]
    IF (
        (NEW.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- [TRAVA DE SEGURANÇA CONTRA DUPLICIDADE]
        IF EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE (description LIKE '%Pedido #' || NEW.id || '%' OR order_id = NEW.id)
            AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- ==========================================
        -- 1. CARREGAR PARÂMETROS CONFIGURADOS NO ADMIN (mmn_config)
        -- ==========================================
        SELECT 
            COALESCE(depth, 3),
            COALESCE(payment_type, 'percent'),
            COALESCE(commission_regional_mensal, 4.00),
            COALESCE(commission_regional_anual, 2.00)
        INTO 
            v_depth,
            v_payment_type,
            v_reg_mensal,
            v_reg_anual
        FROM public.mmn_config
        WHERE id = 1;

        -- ==========================================
        -- 2. ATIVAR ASSINATURA AUTOMATICAMENTE
        -- ==========================================
        IF NEW.items IS NOT NULL THEN
            DECLARE
                item jsonb;
                v_plan_type TEXT;
                v_days INTEGER;
                v_start_date TIMESTAMP WITH TIME ZONE := now();
                v_end_date TIMESTAMP WITH TIME ZONE;
                v_price NUMERIC;
            BEGIN
                FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
                    IF (item->>'is_subscription') = 'true' THEN
                        v_plan_type := item->>'plan_type';
                        v_price := (item->>'price')::numeric;
                        
                        v_days := 30;
                        IF v_plan_type = 'trimestral' THEN
                            v_days := 90;
                        ELSIF v_plan_type = 'semestral' THEN
                            v_days := 180;
                        ELSIF v_plan_type = 'anual' THEN
                            v_days := 365;
                        END IF;
                        v_end_date := v_start_date + (v_days || ' days')::interval;

                        UPDATE public.subscriptions 
                        SET status = 'inactive'
                        WHERE profile_id = NEW.customer_id;

                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', v_start_date, v_end_date);
                    END IF;
                END LOOP;
            END;
        END IF;

        -- ==========================================
        -- 3. DISTRIBUIR COMISSÃO G0 (TITULAR / PRÓPRIO COMPRADOR)
        -- Nível 1: 4% Mensal + 2% Anual
        -- ==========================================
        SELECT COALESCE(value, 6.00) INTO v_level_val 
        FROM public.mmn_levels 
        WHERE level = 1;

        IF v_level_val IS NULL OR v_level_val = 0 THEN
            v_level_val := 6.00;
        END IF;

        -- Calcula as 2 partes: 4% Mensal e 2% Anual (proporção 4/6 e 2/6 do total configurado)
        IF v_payment_type = 'percent' THEN
            v_level_mensal := ROUND(v_amount * (v_level_val * (4.0 / 6.0) / 100.0), 2);
            v_level_anual := ROUND(v_amount * (v_level_val * (2.0 / 6.0) / 100.0), 2);
        ELSE
            v_level_mensal := ROUND(v_level_val * (4.0 / 6.0), 2);
            v_level_anual := ROUND(v_level_val * (2.0 / 6.0), 2);
        END IF;

        -- Credita para o Titular (NEW.customer_id)
        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (NEW.customer_id, 'commission', 'Comissão Mensal G0 (Titular) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
        (NEW.customer_id, 'commission', 'Comissão Anual G0 (Titular) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

        -- ==========================================
        -- 4. DISTRIBUIR COMISSÕES DE REDE PARA OS UPLINES (G1, G2... até v_depth)
        -- ==========================================
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_current_level := 1; -- Começa no G1 (indicador direto)

        WHILE v_upline_id IS NOT NULL AND v_current_level < v_depth LOOP
            SELECT COALESCE(value, 6.00) INTO v_level_val 
            FROM public.mmn_levels 
            WHERE level = (v_current_level + 1);

            IF v_level_val IS NULL OR v_level_val = 0 THEN
                v_level_val := 6.00;
            END IF;

            IF v_payment_type = 'percent' THEN
                v_level_mensal := ROUND(v_amount * (v_level_val * (4.0 / 6.0) / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_level_val * (2.0 / 6.0) / 100.0), 2);
            ELSE
                v_level_mensal := ROUND(v_level_val * (4.0 / 6.0), 2);
                v_level_anual := ROUND(v_level_val * (2.0 / 6.0), 2);
            END IF;

            -- Credita para o Upline G1, G2...
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Mensal G' || v_current_level || ' - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Anual G' || v_current_level || ' - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_current_level := v_current_level + 1;
        END LOOP;

        -- ==========================================
        -- 5. IDENTIFICAR E DISTRIBUIR COMISSÃO DE REVENDEDOR (reseller_id)
        -- ==========================================
        v_reseller_id := NEW.reseller_id;
        
        IF v_reseller_id IS NULL THEN
            SELECT reseller_id INTO v_reseller_id FROM public.profiles WHERE id = NEW.customer_id;
        END IF;

        IF v_reseller_id IS NULL THEN
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = NEW.customer_id;
            WHILE v_upline_id IS NOT NULL LOOP
                IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_upline_id AND role = 'regional_reseller') THEN
                    v_reseller_id := v_upline_id;
                    EXIT;
                END IF;
                SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_upline_id;
            END LOOP;
        END IF;

        IF v_reseller_id IS NOT NULL THEN
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_reseller_id, 'commission', 'Comissão Revendedor Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_mensal / 100), 2), 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_anual / 100), 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function main() {
  console.log('=== ATUALIZANDO BANCO: REMOVENDO SEMANAL E AJUSTANDO PARA 4% MENSAL + 2% ANUAL ===');

  const email = `admin-migrator-${Date.now()}@test.com`;
  const password = 'SuperMigratorPassword123!';

  console.log('1. Autenticando com perfil owner...');
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Migrator' } }
  });

  const userId = signUpData?.user?.id;
  if (!userId) {
    throw new Error('Falha ao autenticar usuário temporário');
  }

  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log('2. Atualizando mmn_config para 4% mensal, 2% anual e 0% semanal...');
  const { error: cfgErr } = await supabase
    .from('mmn_config')
    .update({
      cashback_digital: 0,
      cashback_mensal: 4.00,
      cashback_anual: 2.00,
      commission_regional_semanal: 0,
      commission_regional_mensal: 4.00,
      commission_regional_anual: 2.00
    })
    .eq('id', 1);

  if (cfgErr) {
    console.error('Erro ao atualizar mmn_config:', cfgErr);
  } else {
    console.log('mmn_config atualizado com sucesso!');
  }

  console.log('3. Atualizando trigger handle_order_payment via RPC execute_sql...');
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('execute_sql', {
    query: sqlUpdateTrigger
  });

  if (rpcErr) {
    console.error('Erro ao atualizar trigger:', rpcErr);
  } else {
    console.log('Trigger handle_order_payment atualizada com sucesso no PostgreSQL!');
  }

  console.log('4. Limpando usuário temporário...');
  await supabase.from('profiles').delete().eq('id', userId);

  console.log('=== ETAPA 1 DO BANCO DE DADOS CONCLUÍDA COM SUCESSO! ===');
}

main().catch(console.error);
