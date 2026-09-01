-- =========================================================================
-- MIGRATION: TRIGGER handle_order_payment (COMBINANDO PLANOS E COMISSÕES MMN v4)
-- OBJETIVO: Garante que ao atualizar o status do pedido para 'Pago, Aguardando Retirada':
--           1. A assinatura (Plano Mensal/Trimestral/Semestral/Anual) é ativada.
--           2. As comissões de rede MMN de 3 níveis (G0, G1, G2) são distribuídas.
--           3. A comissão regional de liderança (2% a mais) é enviada ao primeiro regional_reseller da linha.
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   Cole e execute este script completo
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_upline_id UUID;
    v_upline_role TEXT;
    v_amount NUMERIC := NEW.amount;
    v_regional_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
    -- Variáveis para comissão regional dinâmica
    v_reg_semanal NUMERIC;
    v_reg_mensal NUMERIC;
    v_reg_anual NUMERIC;
BEGIN
    -- [CONDIÇÃO DE DISPARO]
    -- Só processa se o novo status for 'Pago, Aguardando Retirada' ou 'Concluído'
    -- E o status anterior NÃO era um desses (evita pagar 2x)
    IF (
        (NEW.status IN ('Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- [TRAVA DE SEGURANÇA]
        -- Evita duplicidade de comissão para o mesmo pedido
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
                        
                        -- Definir duração baseada no tipo de plano
                        v_days := 30;
                        IF v_plan_type = 'trimestral' THEN
                            v_days := 90;
                        ELSIF v_plan_type = 'semestral' THEN
                            v_days := 180;
                        ELSIF v_plan_type = 'anual' THEN
                            v_days := 365;
                        END IF;
                        v_end_date := v_start_date + (v_days || ' days')::interval;

                        -- Desativar assinaturas anteriores do mesmo usuário para evitar múltiplas ativas
                        UPDATE public.subscriptions 
                        SET status = 'inactive'
                        WHERE profile_id = NEW.customer_id;

                        -- Inserir nova assinatura ativa
                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', v_start_date, v_end_date);
                    END IF;
                END LOOP;
            END;
        END IF;

        -- ==========================================
        -- 1. IDENTIFICAR O LÍDER REGIONAL DA REDE (Primeiro regional_reseller subindo a árvore)
        -- ==========================================
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        WHILE v_upline_id IS NOT NULL LOOP
            SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;
            IF v_upline_role = 'regional_reseller' THEN
                v_regional_id := v_upline_id;
                EXIT; -- Encontrou o primeiro regional_reseller da linha, define como líder regional da rede e sai
            END IF;
            
            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        END LOOP;

        -- ==========================================
        -- 2. DISTRIBUIR COMISSÕES DE AFILIADO (NÍVEIS G1, G2)
        -- Cada nível (G1, G2) recebe exatamente: 2% semanal + 2% mensal + 2% anual
        -- G1 = Indicador Direto (1º nível acima do comprador)
        -- G2 = Indicador Indireto (2º nível acima do comprador)
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
        -- 3. DISTRIBUIR COMISSÕES DE REVENDEDOR REGIONAL
        -- Se encontramos um regional_reseller na rede, ele ganha a comissão configurada no banco (padrão 2% semanal + 2% mensal + 2% anual)
        -- ==========================================
        IF v_regional_id IS NOT NULL THEN
            SELECT COALESCE(commission_regional_semanal, 2.00),
                   COALESCE(commission_regional_mensal, 2.00),
                   COALESCE(commission_regional_anual, 2.00)
            INTO v_reg_semanal, v_reg_mensal, v_reg_anual
            FROM public.mmn_config
            WHERE id = 1;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_regional_id, 'commission', 'Comissão Regional Semanal (' || v_reg_semanal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_semanal / 100), 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_mensal / 100), 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_anual / 100), 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
