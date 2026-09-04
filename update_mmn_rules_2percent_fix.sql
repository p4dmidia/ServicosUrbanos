-- ==============================================================================
-- MIGRAÇÃO DE AJUSTE: REGRAS MMN 2% (R$ 20,00 POR CICLO PARA G0, G1, G2 E REVENDEDOR)
-- ==============================================================================

-- 1. ATUALIZAR MMN_CONFIG COM PERCENTUAIS DE 2%
UPDATE public.mmn_config
SET 
    depth = 3,
    payment_type = 'percent',
    cashback_digital = 2.00,
    cashback_mensal = 2.00,
    cashback_anual = 2.00,
    commission_regional_semanal = 2.00,
    commission_regional_mensal = 2.00,
    commission_regional_anual = 2.00,
    updated_at = now()
WHERE id = 1;

-- 2. ATUALIZAR MMN_LEVELS PARA 6.00% (6% / 3 = 2% POR CICLO: SEMANAL, MENSAL E ANUAL)
INSERT INTO public.mmn_levels (level, value, updated_at)
VALUES 
    (1, 6.00, now()),
    (2, 6.00, now()),
    (3, 6.00, now())
ON CONFLICT (level) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- 3. PERMISSÕES RLS PARA MMN_LEVELS E MMN_CONFIG
ALTER TABLE public.mmn_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura publica de mmn_levels" ON public.mmn_levels;
CREATE POLICY "Permitir leitura publica de mmn_levels" ON public.mmn_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir admin gerenciar mmn_levels" ON public.mmn_levels;
CREATE POLICY "Permitir admin gerenciar mmn_levels" ON public.mmn_levels 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'superadmin')
    )
);

ALTER TABLE public.mmn_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura publica de mmn_config" ON public.mmn_config;
CREATE POLICY "Permitir leitura publica de mmn_config" ON public.mmn_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir admin gerenciar mmn_config" ON public.mmn_config;
CREATE POLICY "Permitir admin gerenciar mmn_config" ON public.mmn_config 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'superadmin')
    )
);

-- 4. ATUALIZAR TRIGGER handle_order_payment COM FALLBACK EM 6.00% (2% POR CICLO)
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_amount NUMERIC := NEW.amount;
    v_depth INTEGER;
    v_payment_type TEXT;
    v_reg_semanal NUMERIC;
    v_reg_mensal NUMERIC;
    v_reg_anual NUMERIC;
    v_level_val NUMERIC;
    v_level_semanal NUMERIC;
    v_level_mensal NUMERIC;
    v_level_anual NUMERIC;
    v_upline_id UUID;
    v_current_id UUID;
    v_current_level INTEGER;
    v_reseller_id UUID := NULL;
    v_comm_semanal NUMERIC;
    v_comm_mensal NUMERIC;
    v_comm_anual NUMERIC;
BEGIN
    -- [CONDIÇÃO DE DISPARO] Apenas quando o pedido transitar para status pago/concluído
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

        -- ==========================================
        -- 2. ATIVAR ASSINATURA AUTOMATICAMENTE SE FOR ITEM DE ASSINATURA
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
                FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
                LOOP
                    IF (item->>'is_subscription')::boolean = true THEN
                        v_plan_type := item->>'plan_type';
                        v_price := (item->>'price')::numeric;
                        
                        IF v_plan_type = 'mensal' THEN v_days := 30;
                        ELSIF v_plan_type = 'trimestral' THEN v_days := 90;
                        ELSIF v_plan_type = 'semestral' THEN v_days := 180;
                        ELSE v_days := 365;
                        END IF;

                        v_end_date := v_start_date + (v_days || ' days')::interval;

                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', v_start_date, v_end_date);
                    END IF;
                END LOOP;
            END;
        END IF;

        -- ==========================================
        -- 3. DISTRIBUIR COMISSÃO G0 (TITULAR / PRÓPRIO COMPRADOR)
        -- Lê o valor configurado para level = 1 (G0) em mmn_levels (Padrão 6% = 2% Semanal + 2% Mensal + 2% Anual)
        -- ==========================================
        SELECT COALESCE(value, 6.00) INTO v_level_val 
        FROM public.mmn_levels 
        WHERE level = 1;

        IF v_level_val IS NULL OR v_level_val = 0 THEN
            v_level_val := 6.00;
        END IF;

        -- Calcula as 3 partes (Semanal, Mensal, Anual)
        IF v_payment_type = 'percent' THEN
            v_level_semanal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            v_level_mensal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            v_level_anual := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
        ELSE
            v_level_semanal := ROUND(v_level_val / 3.0, 2);
            v_level_mensal := ROUND(v_level_val / 3.0, 2);
            v_level_anual := ROUND(v_level_val / 3.0, 2);
        END IF;

        -- Credita para o Titular (NEW.customer_id)
        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
        VALUES 
        (NEW.customer_id, 'commission', 'Comissão Semanal G0 (Titular) - Pedido #' || NEW.id, v_level_semanal, 'pending', NEW.id),
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
                v_level_semanal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
                v_level_mensal := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
                v_level_anual := ROUND(v_amount * (v_level_val / 3.0 / 100.0), 2);
            ELSE
                v_level_semanal := ROUND(v_level_val / 3.0, 2);
                v_level_mensal := ROUND(v_level_val / 3.0, 2);
                v_level_anual := ROUND(v_level_val / 3.0, 2);
            END IF;

            -- Credita para o Upline G1, G2...
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Semanal G' || v_current_level || ' - Pedido #' || NEW.id, v_level_semanal, 'pending', NEW.id),
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

        IF v_reseller_id IS NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.customer_id AND role = 'regional_reseller') THEN
            v_reseller_id := NEW.customer_id;
        END IF;

        -- Se localizou o Revendedor Regional, lança os repasses (Semanal, Mensal, Anual)
        IF v_reseller_id IS NOT NULL THEN
            IF v_payment_type = 'percent' THEN
                v_comm_semanal := ROUND(v_amount * (v_reg_semanal / 100.0), 2);
                v_comm_mensal  := ROUND(v_amount * (v_reg_mensal / 100.0), 2);
                v_comm_anual   := ROUND(v_amount * (v_reg_anual / 100.0), 2);
            ELSE
                v_comm_semanal := ROUND(v_reg_semanal, 2);
                v_comm_mensal  := ROUND(v_reg_mensal, 2);
                v_comm_anual   := ROUND(v_reg_anual, 2);
            END IF;

            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_reseller_id, 'commission', 'Comissão Revendedor Semanal (' || v_reg_semanal || '%) - Pedido #' || NEW.id, v_comm_semanal, 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Mensal (' || v_reg_mensal || '%) - Pedido #' || NEW.id, v_comm_mensal, 'pending', NEW.id),
            (v_reseller_id, 'commission', 'Comissão Revendedor Anual (' || v_reg_anual || '%) - Pedido #' || NEW.id, v_comm_anual, 'pending', NEW.id);
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
