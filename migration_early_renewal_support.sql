-- ==============================================================================
-- MIGRAÇÃO: SUPORTE A RENOVAÇÃO ANTECIPADA (1 MÊS ANTES DO VENCIMENTO)
-- Permite que o usuário renove até 1 mês antes do vencimento sem perder
-- os dias restantes do plano anterior. O novo plano soma ao vencimento atual.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 3;
    v_payment_type TEXT := 'percent';
    v_cashback_mensal NUMERIC := 5.00;
    v_cashback_anual NUMERIC := 2.00;
    v_reg_mensal NUMERIC := 5.00;
    v_reg_anual NUMERIC := 2.00;
    v_total_config NUMERIC := 7.00;
    
    -- Valores calculados por nível
    v_level_val NUMERIC := 7.00;
    v_level_mensal NUMERIC := 0;
    v_level_anual NUMERIC := 0;
    
    v_current_level INTEGER := 1;
    v_upline_id UUID;
    v_upline_role TEXT;
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
        -- 1. CARREGAR PARÂMETROS DINÂMICOS DO PAINEL ADMIN (mmn_config)
        -- ==========================================
        SELECT 
            COALESCE(depth, 3),
            COALESCE(payment_type, 'percent'),
            COALESCE(cashback_mensal, 5.00),
            COALESCE(cashback_anual, 2.00),
            COALESCE(commission_regional_mensal, 5.00),
            COALESCE(commission_regional_anual, 2.00)
        INTO 
            v_depth,
            v_payment_type,
            v_cashback_mensal,
            v_cashback_anual,
            v_reg_mensal,
            v_reg_anual
        FROM public.mmn_config
        WHERE id = 1;

        -- Total das taxas configuradas no painel
        v_total_config := v_cashback_mensal + v_cashback_anual;
        IF v_total_config <= 0 THEN
            v_total_config := 7.00;
        END IF;

        -- ==========================================
        -- 2. ATIVAR/RENOVAR ASSINATURA AUTOMATICAMENTE
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

                        -- Se o usuário já possui assinatura ativa e renovou antecipadamente (ex: 1 mês antes),
                        -- o novo plano soma a partir da data final do plano atual (sem perder os dias restantes)
                        SELECT COALESCE(MAX(end_date), now()) INTO v_start_date
                        FROM public.subscriptions
                        WHERE profile_id = NEW.customer_id
                          AND status = 'active'
                          AND end_date > now();

                        IF v_start_date < now() THEN
                            v_start_date := now();
                        END IF;

                        v_end_date := v_start_date + (v_days || ' days')::interval;

                        UPDATE public.subscriptions 
                        SET status = 'inactive'
                        WHERE profile_id = NEW.customer_id;

                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', now(), v_end_date);
                    END IF;
                END LOOP;
            END;
        END IF;

        -- ==========================================
        -- 3. DISTRIBUIR COMISSÃO G0 (TITULAR / PRÓPRIO COMPRADOR)
        -- ==========================================
        SELECT COALESCE(value, v_total_config) INTO v_level_val 
        FROM public.mmn_levels 
        WHERE level = 1;

        IF v_level_val IS NULL OR v_level_val = 0 THEN
            v_level_val := v_total_config;
        END IF;

        IF v_payment_type = 'percent' THEN
            v_level_mensal := ROUND(v_amount * (v_level_val * (v_cashback_mensal / v_total_config) / 100.0), 2);
            v_level_anual := ROUND(v_amount * (v_level_val * (v_cashback_anual / v_total_config) / 100.0), 2);
        ELSE
            v_level_mensal := ROUND(v_level_val * (v_cashback_mensal / v_total_config), 2);
            v_level_anual := ROUND(v_level_val * (v_cashback_anual / v_total_config), 2);
        END IF;

        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (NEW.customer_id, 'commission', 'Comissão Mensal G0 (Titular) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
        (NEW.customer_id, 'commission', 'Comissão Anual G0 (Titular) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

        -- ==========================================
        -- 4. DISTRIBUIR COMISSÕES DE REDE PARA OS UPLINES (G1, G2... até v_depth)
        -- ==========================================
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_current_level := 1;

        WHILE v_upline_id IS NOT NULL AND v_current_level < v_depth LOOP
            SELECT COALESCE(value, v_total_config) INTO v_level_val 
            FROM public.mmn_levels 
            WHERE level = (v_current_level + 1);

            IF v_level_val IS NULL OR v_level_val = 0 THEN
                v_level_val := v_total_config;
            END IF;

            IF v_payment_type = 'percent' THEN
                v_level_mensal := ROUND(v_amount * (v_level_val * (v_cashback_mensal / v_total_config) / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_level_val * (v_cashback_anual / v_total_config) / 100.0), 2);
            ELSE
                v_level_mensal := ROUND(v_level_val * (v_cashback_mensal / v_total_config), 2);
                v_level_anual := ROUND(v_level_val * (v_cashback_anual / v_total_config), 2);
            END IF;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Mensal G' || v_current_level || ' - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Anual G' || v_current_level || ' - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

            -- Sobe para o próximo upline
            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_current_level := v_current_level + 1;
        END LOOP;

        -- ==========================================
        -- 5. DISTRIBUIR COMISSÃO DO REVENDEDOR REGIONAL
        -- ==========================================
        v_reseller_id := NEW.reseller_id;
        
        IF v_reseller_id IS NULL THEN
            SELECT reseller_id INTO v_reseller_id FROM public.profiles WHERE id = NEW.customer_id;
        END IF;

        IF v_reseller_id IS NULL THEN
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = NEW.customer_id;
            IF v_upline_id IS NOT NULL THEN
                SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;
                IF v_upline_role = 'regional_reseller' THEN
                    v_reseller_id := v_upline_id;
                ELSE
                    SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_upline_id;
                    IF v_upline_id IS NOT NULL THEN
                        SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;
                        IF v_upline_role = 'regional_reseller' THEN
                            v_reseller_id := v_upline_id;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;

        IF v_reseller_id IS NOT NULL THEN
            IF v_payment_type = 'percent' THEN
                v_level_mensal := ROUND(v_amount * (v_reg_mensal / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_reg_anual / 100.0), 2);
            ELSE
                v_level_mensal := ROUND(v_reg_mensal, 2);
                v_level_anual := ROUND(v_reg_anual, 2);
            END IF;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_reseller_id, 'commission', 'Comissão Mensal Revendedor Regional - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Anual Revendedor Regional - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
