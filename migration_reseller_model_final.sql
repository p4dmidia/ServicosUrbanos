-- =========================================================================
-- MIGRATION: NOVO MODELO DE REVENDEDOR E FECHAMENTO DIRETO
-- OBJETIVO: 
--   1. Adiciona a coluna 'reseller_id' em profiles e orders.
--   2. Realiza o backfill de todos os cadastros existentes, associando-os
--      ao Revendedor Regional responsável da sua linha.
--   3. Atualiza o trigger 'handle_order_payment' para creditar a comissão de 
--      Revendedor (2% Semanal, 2% Mensal, 2% Anual) DIRETO ao revendedor_id do fechamento.
--
-- COMO EXECUTAR:
--   Abra o Supabase Dashboard > SQL Editor > Cole e execute este script completo.
-- =========================================================================

-- 1. ADICIONAR AS COLUNAS reseller_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.profiles(id);

-- 2. BACKFILL DE CADASTROS ATUAIS (Associar ao Revendedor da Linha Ascendente)
-- Para cada perfil, busca o primeiro regional_reseller subindo a árvore de indicação
WITH RECURSIVE referral_tree AS (
    -- Base: todos os perfis
    SELECT 
        id AS profile_id, 
        referred_by, 
        role,
        CASE WHEN role = 'regional_reseller' THEN id ELSE NULL END AS found_reseller,
        1 AS depth
    FROM public.profiles
    
    UNION ALL
    
    -- Recursão: sobe a árvore
    SELECT 
        t.profile_id,
        p.referred_by,
        p.role,
        CASE 
            WHEN t.found_reseller IS NOT NULL THEN t.found_reseller
            WHEN p.role = 'regional_reseller' THEN p.id 
            ELSE NULL 
        END AS found_reseller,
        t.depth + 1
    FROM referral_tree t
    JOIN public.profiles p ON t.referred_by = p.id
    WHERE t.found_reseller IS NULL AND t.depth < 10
)
UPDATE public.profiles p
SET reseller_id = sub.found_reseller
FROM (
    SELECT DISTINCT ON (profile_id) profile_id, found_reseller
    FROM referral_tree
    WHERE found_reseller IS NOT NULL
    ORDER BY profile_id, depth ASC
) sub
WHERE p.id = sub.profile_id AND p.reseller_id IS NULL;

-- Atualizar orders existentes com o reseller_id do comprador
UPDATE public.orders o
SET reseller_id = p.reseller_id
FROM public.profiles p
WHERE o.customer_id = p.id AND o.reseller_id IS NULL;

-- 3. TRIGGER ATUALIZADO: handle_order_payment
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
    -- Processa quando o status for alterado para 'Pago', 'Pago, Aguardando Retirada' ou 'Concluído'
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
        -- 1. IDENTIFICAR O REVENDEDOR RESPONSÁVEL PELO FECHAMENTO
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
        -- G1 = Indicador Direto (referred_by de NEW.customer_id) -> Ganha 2% Semanal, 2% Mensal, 2% Anual
        -- G2 = Indicador Indireto (referred_by de G1) -> Ganha 2% Semanal, 2% Mensal, 2% Anual
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
        -- Ganha 2% Semanal + 2% Mensal + 2% Anual sobre cada fechamento que realizar
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

-- Reanexar o trigger caso necessário
DROP TRIGGER IF EXISTS trg_handle_order_payment ON public.orders;
CREATE TRIGGER trg_handle_order_payment
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_payment();
