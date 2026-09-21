-- ==============================================================================
-- MIGRATION: 5 PLANOS OFICIAIS E PROMOÇÃO AUTOMÁTICA DE REVENDEDOR REGIONAL
-- ==============================================================================
-- Grade Oficial de Planos (100% Pagos, Sem Plano Gratuito):
-- 1. Afiliado Premium Mensal: R$ 10,00 (30 dias)
-- 2. Afiliado Premium Trimestral: R$ 25,00 (90 dias)
-- 3. Afiliado Premium Semestral: R$ 45,00 (180 dias)
-- 4. Afiliado Premium Anual: R$ 72,00 (365 dias)
-- 5. Revendedor Regional: R$ 85,00 (365 dias) -> Ativa automaticamente role = 'regional_reseller'
-- ==============================================================================

-- 0. ATUALIZAR AS CONSTRAINTS DE PLAN_TYPE (products e subscriptions)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_plan_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_plan_type_check CHECK (plan_type IS NULL OR plan_type IN ('mensal', 'trimestral', 'semestral', 'anual', 'revendedor'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK (plan_type IS NULL OR plan_type IN ('mensal', 'trimestral', 'semestral', 'anual', 'revendedor'));

-- 1. SINCRONIZAR PRODUTOS/PLANOS NA TABELA public.products
DO $$
BEGIN
    -- Desativar planos legados antigos se existirem com outros valores
    UPDATE public.products
    SET status = 'Inativo'
    WHERE is_subscription = true 
      AND plan_type NOT IN ('mensal', 'trimestral', 'semestral', 'anual', 'revendedor');

    -- Upsert Plano Mensal
    IF EXISTS (SELECT 1 FROM public.products WHERE is_subscription = true AND plan_type = 'mensal') THEN
        UPDATE public.products 
        SET name = 'Plano Mensal', price = 10.00, duration_days = 30, image = '📅', status = 'Ativo', category = 'Assinatura', stock = 999999, cashback = 0
        WHERE is_subscription = true AND plan_type = 'mensal';
    ELSE
        INSERT INTO public.products (name, price, duration_days, plan_type, image, status, category, is_subscription, stock, cashback)
        VALUES ('Plano Mensal', 10.00, 30, 'mensal', '📅', 'Ativo', 'Assinatura', true, 999999, 0);
    END IF;

    -- Upsert Plano Trimestral
    IF EXISTS (SELECT 1 FROM public.products WHERE is_subscription = true AND plan_type = 'trimestral') THEN
        UPDATE public.products 
        SET name = 'Plano Trimestral', price = 25.00, duration_days = 90, image = '🌟', status = 'Ativo', category = 'Assinatura', stock = 999999, cashback = 0
        WHERE is_subscription = true AND plan_type = 'trimestral';
    ELSE
        INSERT INTO public.products (name, price, duration_days, plan_type, image, status, category, is_subscription, stock, cashback)
        VALUES ('Plano Trimestral', 25.00, 90, 'trimestral', '🌟', 'Ativo', 'Assinatura', true, 999999, 0);
    END IF;

    -- Upsert Plano Semestral
    IF EXISTS (SELECT 1 FROM public.products WHERE is_subscription = true AND plan_type = 'semestral') THEN
        UPDATE public.products 
        SET name = 'Plano Semestral', price = 45.00, duration_days = 180, image = '💼', status = 'Ativo', category = 'Assinatura', stock = 999999, cashback = 0
        WHERE is_subscription = true AND plan_type = 'semestral';
    ELSE
        INSERT INTO public.products (name, price, duration_days, plan_type, image, status, category, is_subscription, stock, cashback)
        VALUES ('Plano Semestral', 45.00, 180, 'semestral', '💼', 'Ativo', 'Assinatura', true, 999999, 0);
    END IF;

    -- Upsert Plano Anual
    IF EXISTS (SELECT 1 FROM public.products WHERE is_subscription = true AND plan_type = 'anual') THEN
        UPDATE public.products 
        SET name = 'Plano Anual', price = 72.00, duration_days = 365, image = '🏆', status = 'Ativo', category = 'Assinatura', stock = 999999, cashback = 0
        WHERE is_subscription = true AND plan_type = 'anual';
    ELSE
        INSERT INTO public.products (name, price, duration_days, plan_type, image, status, category, is_subscription, stock, cashback)
        VALUES ('Plano Anual', 72.00, 365, 'anual', '🏆', 'Ativo', 'Assinatura', true, 999999, 0);
    END IF;

    -- Upsert Revendedor Regional
    IF EXISTS (SELECT 1 FROM public.products WHERE is_subscription = true AND plan_type = 'revendedor') THEN
        UPDATE public.products 
        SET name = 'Revendedor Regional', price = 85.00, duration_days = 365, image = '👑', status = 'Ativo', category = 'Assinatura', stock = 999999, cashback = 0
        WHERE is_subscription = true AND plan_type = 'revendedor';
    ELSE
        INSERT INTO public.products (name, price, duration_days, plan_type, image, status, category, is_subscription, stock, cashback)
        VALUES ('Revendedor Regional', 85.00, 365, 'revendedor', '👑', 'Ativo', 'Assinatura', true, 999999, 0);
    END IF;
END $$;

-- 2. FUNÇÃO E TRIGGER DINÂMICA DE DISTRIBUIÇÃO E ATIVAÇÃO (handle_order_payment)
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 3;
    v_payment_type TEXT := 'percent';
    v_cashback_mensal NUMERIC := 4.00;
    v_cashback_anual NUMERIC := 2.00;
    v_reg_mensal NUMERIC := 4.00;
    v_reg_anual NUMERIC := 2.00;
    
    v_level_val NUMERIC := 0;
    v_total_config NUMERIC := 0;
    v_level_mensal NUMERIC := 0;
    v_level_anual NUMERIC := 0;
    
    v_empresa_id UUID := '194e5265-cdb6-431f-9f77-8888b1ee74ae';
    v_current_level INTEGER := 1;
    v_upline_id UUID;
    v_amount NUMERIC := NEW.amount;
    v_reseller_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
BEGIN
    -- [CONDIÇÃO DE DISPARO: Pedido Pago, Pago Aguardando Retirada ou Concluído]
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
            COALESCE(cashback_mensal, 4.00),
            COALESCE(cashback_anual, 2.00),
            COALESCE(commission_regional_mensal, 4.00),
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

        v_total_config := v_cashback_mensal + v_cashback_anual;

        -- ==========================================
        -- 2. ATIVAR ASSINATURA E PROMOVER ROLE AUTOMATICAMENTE
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
                        ELSIF v_plan_type = 'anual' OR v_plan_type = 'revendedor' THEN
                            v_days := 365;
                        END IF;
                        v_end_date := v_start_date + (v_days || ' days')::interval;

                        UPDATE public.subscriptions 
                        SET status = 'inactive'
                        WHERE profile_id = NEW.customer_id;

                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', v_start_date, v_end_date);

                        -- Se o plano for Revendedor Regional, promove o perfil para 'regional_reseller'
                        IF v_plan_type = 'revendedor' THEN
                            UPDATE public.profiles
                            SET role = 'regional_reseller'
                            WHERE id = NEW.customer_id;
                        END IF;
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
            IF v_total_config > 0 AND v_level_val != v_total_config THEN
                v_level_mensal := ROUND(v_amount * (v_level_val * (v_cashback_mensal / v_total_config) / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_level_val * (v_cashback_anual / v_total_config) / 100.0), 2);
            ELSE
                v_level_mensal := ROUND(v_amount * (v_cashback_mensal / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_cashback_anual / 100.0), 2);
            END IF;
        ELSE
            IF v_total_config > 0 THEN
                v_level_mensal := ROUND(v_level_val * (v_cashback_mensal / v_total_config), 2);
                v_level_anual := ROUND(v_level_val * (v_cashback_anual / v_total_config), 2);
            ELSE
                v_level_mensal := ROUND(v_cashback_mensal, 2);
                v_level_anual := ROUND(v_cashback_anual, 2);
            END IF;
        END IF;

        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (NEW.customer_id, 'commission', 'Comissão Mensal G0 (Titular) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
        (NEW.customer_id, 'commission', 'Comissão Anual G0 (Titular) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);

        -- ==========================================
        -- 4. DISTRIBUIR COMISSÕES DE REDE PARA OS UPLINES (G1 e G2)
        -- SE O CLIENTE FOR INDICADO DIRETO DA EMPRESA OU NÃO HOUVER UPLINE,
        -- A COMISSÃO É CREDITADA PARA A EMPRESA (v_empresa_id)
        -- ==========================================
        v_current_id := NEW.customer_id;
        WHILE v_current_level <= (v_depth - 1) LOOP
            SELECT referred_by INTO v_upline_id 
            FROM public.profiles 
            WHERE id = v_current_id;

            SELECT COALESCE(value, v_total_config) INTO v_level_val 
            FROM public.mmn_levels 
            WHERE level = (v_current_level + 1);

            IF v_level_val IS NULL OR v_level_val = 0 THEN
                v_level_val := v_total_config;
            END IF;

            IF v_payment_type = 'percent' THEN
                IF v_total_config > 0 AND v_level_val != v_total_config THEN
                    v_level_mensal := ROUND(v_amount * (v_level_val * (v_cashback_mensal / v_total_config) / 100.0), 2);
                    v_level_anual := ROUND(v_amount * (v_level_val * (v_cashback_anual / v_total_config) / 100.0), 2);
                ELSE
                    v_level_mensal := ROUND(v_amount * (v_cashback_mensal / 100.0), 2);
                    v_level_anual := ROUND(v_amount * (v_cashback_anual / 100.0), 2);
                END IF;
            ELSE
                IF v_total_config > 0 THEN
                    v_level_mensal := ROUND(v_level_val * (v_cashback_mensal / v_total_config), 2);
                    v_level_anual := ROUND(v_level_val * (v_cashback_anual / v_total_config), 2);
                ELSE
                    v_level_mensal := ROUND(v_cashback_mensal, 2);
                    v_level_anual := ROUND(v_cashback_anual, 2);
                END IF;
            END IF;

            IF v_upline_id IS NOT NULL AND v_upline_id != v_empresa_id THEN
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_upline_id, 'commission', 'Comissão Mensal G' || v_current_level || ' (Rede) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
                (v_upline_id, 'commission', 'Comissão Anual G' || v_current_level || ' (Rede) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);
                
                v_current_id := v_upline_id;
            ELSE
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_empresa_id, 'commission', 'Comissão Mensal G' || v_current_level || ' (Direto da Empresa) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
                (v_empresa_id, 'commission', 'Comissão Anual G' || v_current_level || ' (Direto da Empresa) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);
                
                v_current_id := NULL;
            END IF;

            v_current_level := v_current_level + 1;
            IF v_current_id IS NULL THEN
                WHILE v_current_level <= (v_depth - 1) LOOP
                    SELECT COALESCE(value, v_total_config) INTO v_level_val 
                    FROM public.mmn_levels 
                    WHERE level = (v_current_level + 1);

                    IF v_level_val IS NULL OR v_level_val = 0 THEN
                        v_level_val := v_total_config;
                    END IF;

                    IF v_payment_type = 'percent' THEN
                        IF v_total_config > 0 AND v_level_val != v_total_config THEN
                            v_level_mensal := ROUND(v_amount * (v_level_val * (v_cashback_mensal / v_total_config) / 100.0), 2);
                            v_level_anual := ROUND(v_amount * (v_level_val * (v_cashback_anual / v_total_config) / 100.0), 2);
                        ELSE
                            v_level_mensal := ROUND(v_amount * (v_cashback_mensal / 100.0), 2);
                            v_level_anual := ROUND(v_amount * (v_cashback_anual / 100.0), 2);
                        END IF;
                    ELSE
                        IF v_total_config > 0 THEN
                            v_level_mensal := ROUND(v_level_val * (v_cashback_mensal / v_total_config), 2);
                            v_level_anual := ROUND(v_level_val * (v_cashback_anual / v_total_config), 2);
                        ELSE
                            v_level_mensal := ROUND(v_cashback_mensal, 2);
                            v_level_anual := ROUND(v_cashback_anual, 2);
                        END IF;
                    END IF;

                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES 
                    (v_empresa_id, 'commission', 'Comissão Mensal G' || v_current_level || ' (Direto da Empresa) - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
                    (v_empresa_id, 'commission', 'Comissão Anual G' || v_current_level || ' (Direto da Empresa) - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);
                    
                    v_current_level := v_current_level + 1;
                END LOOP;
                EXIT;
            END IF;
        END LOOP;

        -- ==========================================
        -- 5. DISTRIBUIR COMISSÃO DE REVENDEDOR REGIONAL
        -- SE NÃO HOUVER REVENDEDOR NA LINHAGEM, DESTINA-SE À EMPRESA
        -- ==========================================
        IF NEW.reseller_id IS NOT NULL THEN
            v_reseller_id := NEW.reseller_id;
        ELSE
            SELECT reseller_id INTO v_reseller_id 
            FROM public.profiles 
            WHERE id = NEW.customer_id;
        END IF;

        IF v_reseller_id IS NULL THEN
            v_current_id := NEW.customer_id;
            WHILE v_current_id IS NOT NULL LOOP
                SELECT referred_by, role INTO v_upline_id, v_level_val
                FROM public.profiles 
                WHERE id = v_current_id;

                IF v_upline_id IS NOT NULL THEN
                    DECLARE
                        v_upline_role TEXT;
                    BEGIN
                        SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;
                        IF v_upline_role = 'regional_reseller' THEN
                            v_reseller_id := v_upline_id;
                            EXIT;
                        END IF;
                    END;
                END IF;
                v_current_id := v_upline_id;
            END LOOP;
        END IF;

        DECLARE
            v_final_reseller_mensal NUMERIC := 0;
            v_final_reseller_anual NUMERIC := 0;
            v_beneficiary_id UUID := COALESCE(v_reseller_id, v_empresa_id);
            v_is_empresa BOOLEAN := (v_beneficiary_id = v_empresa_id);
        BEGIN
            IF v_payment_type = 'percent' THEN
                v_final_reseller_mensal := ROUND(v_amount * (v_reg_mensal / 100.0), 2);
                v_final_reseller_anual := ROUND(v_amount * (v_reg_anual / 100.0), 2);
            ELSE
                v_final_reseller_mensal := ROUND(v_reg_mensal, 2);
                v_final_reseller_anual := ROUND(v_reg_anual, 2);
            END IF;

            IF v_is_empresa THEN
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_beneficiary_id, 'commission', 'Comissão Mensal Revendedor Regional (Sem Revendedor Atribuído - Empresa) - Pedido #' || NEW.id, v_final_reseller_mensal, 'pending', NEW.id),
                (v_beneficiary_id, 'commission', 'Comissão Anual Revendedor Regional (Sem Revendedor Atribuído - Empresa) - Pedido #' || NEW.id, v_final_reseller_anual, 'pending', NEW.id);
            ELSE
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_beneficiary_id, 'commission', 'Comissão Mensal Revendedor Regional - Pedido #' || NEW.id, v_final_reseller_mensal, 'pending', NEW.id),
                (v_beneficiary_id, 'commission', 'Comissão Anual Revendedor Regional - Pedido #' || NEW.id, v_final_reseller_anual, 'pending', NEW.id);
            END IF;
        END;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RE-VINCULAR O TRIGGER NA TABELA ORDERS
DROP TRIGGER IF EXISTS trg_handle_order_payment ON public.orders;
CREATE TRIGGER trg_handle_order_payment
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_payment();
