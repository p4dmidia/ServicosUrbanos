import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const migrationSql = `
-- 1. ADICIONAR COLUNA reseller_id EM PROFILES E ORDERS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.profiles(id);

-- 2. FUNÇÃO E TRIGGER ATUALIZADOS: handle_order_payment
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_upline_id UUID;
    v_amount NUMERIC := NEW.amount;
    v_reseller_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
    -- Variáveis para comissão de revendedor
    v_reg_semanal NUMERIC;
    v_reg_mensal NUMERIC;
    v_reg_anual NUMERIC;
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
        -- ATIVAR ASSINATURA AUTOMATICAMENTE SE HOUVER ITENS DE PLANO
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
        -- 1. IDENTIFICAR O REVENDEDOR DO FECHAMENTO
        -- Prioridade 1: NEW.reseller_id do pedido
        -- Prioridade 2: profiles.reseller_id do comprador
        -- Prioridade 3: Primeiro regional_reseller subindo a árvore de indicação (legado)
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

        -- ==========================================
        -- 2. DISTRIBUIR COMISSÕES DE AFILIADO (NÍVEIS G1 e G2)
        -- G1 = Indicador Direto (referred_by de NEW.customer_id)
        -- G2 = Indicador Indireto (referred_by de G1)
        -- ==========================================
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_level := 1;

        WHILE v_upline_id IS NOT NULL AND v_level <= 2 LOOP
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Semanal G' || v_level || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Mensal G' || v_level || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Anual G' || v_level || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id);

            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_level := v_level + 1;
        END LOOP;

        -- ==========================================
        -- 3. DISTRIBUIR COMISSÃO DE REVENDEDOR (6% DIRETO PARA O REVENDEDOR DO FECHAMENTO)
        -- ==========================================
        IF v_reseller_id IS NOT NULL THEN
            SELECT COALESCE(commission_regional_semanal, 2.00),
                   COALESCE(commission_regional_mensal, 2.00),
                   COALESCE(commission_regional_anual, 2.00)
            INTO v_reg_semanal, v_reg_mensal, v_reg_anual
            FROM public.mmn_config
            WHERE id = 1;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_reseller_id, 'commission', 'Comissão Revendedor Semanal (' || v_reg_semanal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_semanal / 100), 2), 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_mensal / 100), 2), 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_anual / 100), 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function run() {
  const email = `debugger-reseller-migration-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  console.log("Signing up debug owner...");
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  console.log("Running SQL migration...");
  const { data, error } = await supabase.rpc('execute_sql', { query: migrationSql });
  if (error) {
    console.error("Migration Error:", error.message);
  } else {
    console.log("Migration executed successfully:", data);
  }

  // 4. BACKFILL: Ajustar todos os cadastros atuais
  console.log("\n--- BACKFILL DOS CADASTROS ATUAIS ---");
  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, role, referred_by, reseller_id');
  const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));

  let updatedCount = 0;
  for (const prof of (allProfiles || [])) {
    if (!prof.reseller_id) {
      // Subir a árvore de referred_by até achar um regional_reseller
      let curr = prof.referred_by;
      let foundResellerId: string | null = null;
      while (curr) {
        const parent = profilesMap.get(curr);
        if (!parent) break;
        if (parent.role === 'regional_reseller') {
          foundResellerId = parent.id;
          break;
        }
        curr = parent.referred_by;
      }

      // Se o próprio usuário for regional_reseller
      if (!foundResellerId && prof.role === 'regional_reseller') {
        foundResellerId = prof.id;
      }

      if (foundResellerId) {
        console.log(`Setting reseller_id for ${prof.full_name} -> ${(profilesMap.get(foundResellerId))?.full_name}`);
        await supabase.from('profiles').update({ reseller_id: foundResellerId }).eq('id', prof.id);
        updatedCount++;
      }
    }
  }

  console.log(`Backfill concluído! ${updatedCount} perfis atualizados com reseller_id.`);

  // Atualizar orders com reseller_id correspondente
  const { data: orders } = await supabase.from('orders').select('id, customer_id, reseller_id');
  for (const order of (orders || [])) {
    if (!order.reseller_id && order.customer_id) {
      const cust = profilesMap.get(order.customer_id);
      if (cust?.reseller_id) {
        await supabase.from('orders').update({ reseller_id: cust.reseller_id }).eq('id', order.id);
      }
    }
  }
  console.log("Orders atualizados com reseller_id!");
}

run().catch(console.error);
