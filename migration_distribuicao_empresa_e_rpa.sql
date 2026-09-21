-- =========================================================================
-- MIGRATION: DISTRIBUIÇÃO MMN COM DESTINO EMPRESA PARA INDICAÇÕES DIRETAS
-- E TRATAMENTO DE REPASSES G0, G1, G2 E REVENDEDOR REGIONAL
-- Projeto: Serviços Urbanos (ioslywxfppswfuzxzwkn)
-- =========================================================================

BEGIN;

-- 1. IDENTIFICAR OU GARANTIR O PERFIL DA EMPRESA (MATRIZ)
-- ID Padrão da Empresa: 194e5265-cdb6-431f-9f77-8888b1ee74ae
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '194e5265-cdb6-431f-9f77-8888b1ee74ae') THEN
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            role,
            cpf,
            cnpj,
            pix_key,
            pix_type,
            status,
            created_at,
            updated_at
        ) VALUES (
            '194e5265-cdb6-431f-9f77-8888b1ee74ae',
            'Serviços Urbanos Tecnologia Ltda.',
            'xipsdapraia23@gmail.com',
            'regional_reseller',
            '54795377000103',
            '54795377000103',
            '71992102042',
            'PHONE',
            'active',
            now(),
            now()
        );
    END IF;
END $$;

-- 2. FUNÇÃO E TRIGGER DINÂMICA DE DISTRIBUIÇÃO DE COMISSÕES (handle_order_payment)
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
        -- SE O CLIENTE FOR INDICADO DIRETO DA SERVIÇOS URBANOS OU NÃO HOUVER UPLINE,
        -- A COMISSÃO É CREDITADA PARA A EMPRESA (v_empresa_id)
        -- ==========================================
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_current_level := 1; -- Começa no G1

        WHILE v_current_level < v_depth LOOP
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

            -- Se houver upline e não for a própria empresa, credita ao upline; caso contrário, credita à Empresa
            DECLARE
                v_target_profile UUID := COALESCE(v_upline_id, v_empresa_id);
                v_target_label TEXT := CASE WHEN v_upline_id IS NULL OR v_upline_id = v_empresa_id THEN ' (Empresa)' ELSE '' END;
            BEGIN
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_target_profile, 'commission', 'Comissão Mensal G' || v_current_level || v_target_label || ' - Pedido #' || NEW.id, v_level_mensal, 'pending', NEW.id),
                (v_target_profile, 'commission', 'Comissão Anual G' || v_current_level || v_target_label || ' - Pedido #' || NEW.id, v_level_anual, 'pending', NEW.id);
            END;

            IF v_upline_id IS NOT NULL THEN
                v_current_id := v_upline_id;
                SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            ELSE
                v_upline_id := NULL;
            END IF;

            v_current_level := v_current_level + 1;
        END LOOP;

        -- ==========================================
        -- 5. IDENTIFICAR E DISTRIBUIR COMISSÃO DE REVENDEDOR REGIONAL
        -- SE NÃO HOUVER REVENDEDOR REGIONAL VINCULADO, DESTINA PARA A EMPRESA
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

        -- Se não tiver revendedor regional encontrado, destina para a Empresa
        IF v_reseller_id IS NULL THEN
            v_reseller_id := v_empresa_id;
        END IF;

        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (v_reseller_id, 'commission', 'Comissão Revendedor Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_mensal / 100.0), 2), 'pending', NEW.id),
        (v_reseller_id, 'commission', 'Comissão Revendedor Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, ROUND(v_amount * (v_reg_anual / 100.0), 2), 'pending', NEW.id);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REANEXAR TRIGGER
DROP TRIGGER IF EXISTS trg_handle_order_payment ON public.orders;
CREATE TRIGGER trg_handle_order_payment
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_payment();

NOTIFY pgrst, 'reload schema';

COMMIT;
