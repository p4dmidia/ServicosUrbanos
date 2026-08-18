-- 1. Atualizar a trigger de pagamento de comissão para as regras finais de MMN do Emerson
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_upline_id UUID;
    v_upline_role TEXT;
    v_amount NUMERIC := NEW.amount;
    v_regional_id UUID := NULL;
    v_current_id UUID := NEW.customer_id;
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

        -- 1. IDENTIFICAR O LÍDER REGIONAL DA REDE (Primeiro regional_reseller subindo a árvore)
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

        -- 2. DISTRIBUIR COMISSÕES DE AFILIADO (NÍVEIS G0, G1, G2)
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_level := 1;

        WHILE v_upline_id IS NOT NULL AND v_level <= 3 LOOP
            IF v_level = 1 THEN
                -- G0 (Vendedor direto): 20% semanal + 1% mensal + 1% anual
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_upline_id, 'commission', 'Comissão Semanal G0 (20%) - Pedido #' || NEW.id, ROUND(v_amount * 0.20, 2), 'pending', NEW.id),
                (v_upline_id, 'commission', 'Comissão Mensal G0 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
                (v_upline_id, 'commission', 'Comissão Anual G0 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);

            ELSIF v_level = 2 THEN
                -- G1 (Nível 1 de rede): 1% mensal + 1% anual
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_upline_id, 'commission', 'Comissão Mensal G1 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
                (v_upline_id, 'commission', 'Comissão Anual G1 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);

            ELSIF v_level = 3 THEN
                -- G2 (Nível 2 de rede): 1% mensal + 1% anual
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_upline_id, 'commission', 'Comissão Mensal G2 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
                (v_upline_id, 'commission', 'Comissão Anual G2 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);
            END IF;

            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_level := v_level + 1;
        END LOOP;

        -- 3. DISTRIBUIR COMISSÕES DE REVENDEDOR REGIONAL
        -- Se encontramos um regional_reseller na rede, ele ganha a comissão do regional de rede de 6% (4% semanal + 1% mensal + 1% anual)
        IF v_regional_id IS NOT NULL THEN
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_regional_id, 'commission', 'Comissão Regional Semanal (4%) - Pedido #' || NEW.id, ROUND(v_amount * 0.04, 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Mensal (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Anual (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Função para processar fechamento e pagamento de comissões SEMANAIS
-- Libera ganhos de segunda a domingo da semana anterior na sexta-feira atual
CREATE OR REPLACE FUNCTION public.process_weekly_payouts()
RETURNS jsonb AS $$
DECLARE
    v_count INTEGER;
    v_start DATE := date_trunc('week', now() - interval '1 week');
    v_end DATE := date_trunc('week', now()) - interval '1 second';
BEGIN
    UPDATE public.transactions
    SET status = 'completed',
        created_at = now()
    WHERE type = 'commission'
      AND status = 'pending'
      AND (description LIKE '%Semanal%')
      AND created_at >= v_start
      AND created_at <= v_end;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fechamento semanal executado com sucesso.',
        'processed_rows', v_count,
        'period_start', v_start,
        'period_end', v_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Função para processar fechamento e pagamento de comissões MENSAL e de REDE
-- Libera ganhos do mês anterior no dia 10
CREATE OR REPLACE FUNCTION public.process_monthly_payouts()
RETURNS jsonb AS $$
DECLARE
    v_count INTEGER;
    v_start DATE := date_trunc('month', now() - interval '1 month');
    v_end DATE := date_trunc('month', now()) - interval '1 second';
BEGIN
    UPDATE public.transactions
    SET status = 'completed',
        created_at = now()
    WHERE type = 'commission'
      AND status = 'pending'
      AND (description LIKE '%Mensal%' OR description LIKE '%Rede%')
      AND created_at >= v_start
      AND created_at <= v_end;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fechamento mensal executado com sucesso.',
        'processed_rows', v_count,
        'period_start', v_start,
        'period_end', v_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Função para processar fechamento e pagamento de comissões ANUAIS
-- Libera ganhos acumulados no dia 10 de dezembro
CREATE OR REPLACE FUNCTION public.process_yearly_payouts()
RETURNS jsonb AS $$
DECLARE
    v_count INTEGER;
    v_end DATE := now();
BEGIN
    UPDATE public.transactions
    SET status = 'completed',
        created_at = now()
    WHERE type = 'commission'
      AND status = 'pending'
      AND (description LIKE '%Anual%')
      AND created_at <= v_end;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fechamento anual executado com sucesso.',
        'processed_rows', v_count,
        'period_end', v_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
