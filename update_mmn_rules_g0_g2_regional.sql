-- =========================================================================
-- CONFIGURAÇÃO DE REGRAS MMN: G0 AO G2 + REGIONAL (DIVISÃO TRIPLA 2% + 2% + 2%)
-- 
-- DEFINIÇÃO DAS REGRAS:
--   - G0 (Titular / Comprador): 2% Semanal + 2% Mensal + 2% Anual (6% Total)
--   - G1 (Indicador Direto):   2% Semanal + 2% Mensal + 2% Anual (6% Total)
--   - G2 (Segundo Nível):      2% Semanal + 2% Mensal + 2% Anual (6% Total)
--   - REGIONAL (Revendedor):   2% Semanal + 2% Mensal + 2% Anual (6% Total)
--
-- COMO EXECUTAR: Supabase Dashboard > SQL Editor > Run
-- =========================================================================

BEGIN;

-- 1. Atualizar Parâmetros Globais de MMN e Revendedor Regional
UPDATE public.mmn_config
SET 
    depth = 3,
    payment_type = 'percent',
    cashback_digital = 2.00, -- Semanal (Carteira Digital)
    cashback_mensal = 2.00,  -- Mensal (PIX)
    cashback_anual = 2.00,   -- Anual (10/Dez)
    commission_regional_semanal = 2.00,
    commission_regional_mensal = 2.00,
    commission_regional_anual = 2.00
WHERE id = 1;

-- 2. Atualizar Níveis de Comissionamento MMN (G0, G1, G2 a 6.00% cada)
INSERT INTO public.mmn_levels (level, value)
VALUES 
    (1, 6.00), -- Nível 1 = G0 (Titular): 6% Total (2% Semanal + 2% Mensal + 2% Anual)
    (2, 6.00), -- Nível 2 = G1 (Upline 1): 6% Total (2% Semanal + 2% Mensal + 2% Anual)
    (3, 6.00)  -- Nível 3 = G2 (Upline 2): 6% Total (2% Semanal + 2% Mensal + 2% Anual)
ON CONFLICT (level) 
DO UPDATE SET value = EXCLUDED.value;

-- 3. Atualizar a Função de Distribuição de Comissões (handle_order_payment)
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 3;
    v_payment_type TEXT := 'percent';
    v_reg_semanal NUMERIC := 2.00;
    v_reg_mensal NUMERIC := 2.00;
    v_reg_anual NUMERIC := 2.00;
    
    v_level_val NUMERIC := 0;
    v_level_semanal NUMERIC := 0;
    v_level_mensal NUMERIC := 0;
    v_level_anual NUMERIC := 0;
    
    v_current_level INTEGER := 1;
    v_upline_id UUID;
    v_amount NUMERIC := NEW.amount;
    v_reseller_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
BEGIN
    -- [CONDIÇÃO DE DISPARO: Pedido Pago ou Concluído]
    IF (
        (NEW.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- Evita duplicidade de comissões
        IF EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE (description LIKE '%Pedido #' || NEW.id || '%' OR order_id = NEW.id)
            AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- Carregar parâmetros de mmn_config
        SELECT 
            COALESCE(depth, 3),
            COALESCE(payment_type, 'percent'),
            COALESCE(commission_regional_semanal, 2.00),
            COALESCE(commission_regional_mensal, 2.00),
            COALESCE(commission_regional_anual, 2.00)
        INTO 
            v_depth,
            v_payment_type,
            v_reg_semanal,
            v_reg_mensal,
            v_reg_anual
        FROM public.mmn_config
        WHERE id = 1;

        -- Ativação de Assinatura se contiver item de plano
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

        -- ----------------------------------------------------
        -- A. COMISSÃO G0 (TITULAR / PRÓPRIO COMPRADOR)
        -- 2% Semanal + 2% Mensal + 2% Anual (6% Total)
        -- ----------------------------------------------------
        SELECT COALESCE(value, 6.00) INTO v_level_val 
        FROM public.mmn_levels 
        WHERE level = 1;

        IF v_level_val IS NULL OR v_level_val = 0 THEN
            v_level_val := 6.00;
        END IF;

        IF v_payment_type = 'percent' THEN
            v_level_semanal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            v_level_mensal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            v_level_anual := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
        ELSE
            v_level_semanal := ROUND(v_level_val / 3.0, 2);
            v_level_mensal := ROUND(v_level_val / 3.0, 2);
            v_level_anual := ROUND(v_level_val / 3.0, 2);
        END IF;

        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (NEW.customer_id, 'commission', 'Comissão Semanal G0 (Titular) - Pedido #' || NEW.id, v_level_semanal, 'pending', NEW.id),
        (NEW.customer_id, 'commission', 'Comissão Mensal G0 (Titular) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
        (NEW.customer_id, 'commission', 'Comissão Anual G0 (Titular) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

        -- ----------------------------------------------------
        -- B. COMISSÕES DE REDE PARA OS UPLINES (G1 e G2)
        -- 2% Semanal + 2% Mensal + 2% Anual (6% Total por nível)
        -- ----------------------------------------------------
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_current_level := 1; -- G1

        WHILE v_upline_id IS NOT NULL AND v_current_level < v_depth LOOP
            SELECT COALESCE(value, 6.00) INTO v_level_val 
            FROM public.mmn_levels 
            WHERE level = (v_current_level + 1);

            IF v_level_val IS NULL OR v_level_val = 0 THEN
                v_level_val := 6.00;
            END IF;

            IF v_payment_type = 'percent' THEN
                v_level_semanal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
                v_level_mensal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            ELSE
                v_level_semanal := ROUND(v_level_val / 3.0, 2);
                v_level_mensal := ROUND(v_level_val / 3.0, 2);
                v_level_anual := ROUND(v_level_val / 3.0, 2);
            END IF;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Semanal G' || v_current_level || ' - Pedido #' || NEW.id, v_level_semanal, 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Mensal G' || v_current_level || ' - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Anual G' || v_current_level || ' - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_current_level := v_current_level + 1;
        END LOOP;

        -- ----------------------------------------------------
        -- C. COMISSÃO DE REVENDEDOR REGIONAL (reseller_id)
        -- 2% Semanal + 2% Mensal + 2% Anual (6% Total)
        -- ----------------------------------------------------
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
            (v_reseller_id, 'commission', 'Comissão Revendedor Semanal (' || v_reg_semanal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_semanal / 100), 2), 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_mensal / 100), 2), 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_anual / 100), 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reanexar trigger
DROP TRIGGER IF EXISTS trg_handle_order_payment ON public.orders;
CREATE TRIGGER trg_handle_order_payment
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_payment();

NOTIFY pgrst, 'reload schema';

COMMIT;
