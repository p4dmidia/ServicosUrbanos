-- 1. Atualizar a trigger de pagamento de comissão para o novo formato MMN (com lançamentos em 'pending' para liberação periódica)
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_upline_id UUID;
    v_upline_role TEXT;
    v_amount NUMERIC := NEW.amount;
    v_regional_found BOOLEAN := FALSE;
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

        -- Percorrer os uplines (G0, G1, G2)
        -- Começamos buscando o referred_by do comprador (NEW.customer_id)
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;

        WHILE v_upline_id IS NOT NULL AND v_level <= 3 LOOP
            -- Pegar papel do upline atual
            SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;

            IF v_level = 1 THEN
                -- G0 (Vendedor direto)
                IF v_upline_role = 'regional_reseller' THEN
                    -- G0 é Revendedor Regional: Ganha 6% de rede/direto + 2% semanal + 2% mensal + 2% anual
                    -- Lançados como 'pending' para liberação contábil nos fechamentos correspondentes
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES 
                    (v_upline_id, 'commission', 'Comissão Regional Direta (6%) - Pedido #' || NEW.id, ROUND(v_amount * 0.06, 2), 'pending', NEW.id),
                    (v_upline_id, 'commission', 'Cashback Regional Semanal (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
                    (v_upline_id, 'commission', 'Cashback Regional Mensal (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
                    (v_upline_id, 'commission', 'Cashback Regional Anual (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id);
                    
                    v_regional_found := TRUE;
                ELSE
                    -- G0 é Afiliado/Consumidor normal: Ganha 20% semanal direto (lançado como 'pending')
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES (v_upline_id, 'commission', 'Comissão Semanal G0 (20%) - Pedido #' || NEW.id, ROUND(v_amount * 0.20, 2), 'pending', NEW.id);
                END IF;

            ELSIF v_level = 2 THEN
                -- G1 (Indicação nível 1)
                IF v_upline_role = 'regional_reseller' THEN
                    -- G1 é Revendedor Regional: Ganha 6% da rede (lançado como 'pending')
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES (v_upline_id, 'commission', 'Comissão Regional de Rede G1 (6%) - Pedido #' || NEW.id, ROUND(v_amount * 0.06, 2), 'pending', NEW.id);
                    v_regional_found := TRUE;
                ELSE
                    -- G1 é Afiliado/Consumidor normal: Ganha 1% mensal + 1% anual (lançados como 'pending')
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES 
                    (v_upline_id, 'commission', 'Comissão Mensal G1 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
                    (v_upline_id, 'commission', 'Comissão Anual G1 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);
                END IF;

            ELSIF v_level = 3 THEN
                -- G2 (Indicação nível 2)
                IF v_upline_role = 'regional_reseller' THEN
                    -- G2 é Revendedor Regional: Ganha 6% da rede (lançado como 'pending')
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES (v_upline_id, 'commission', 'Comissão Regional de Rede G2 (6%) - Pedido #' || NEW.id, ROUND(v_amount * 0.06, 2), 'pending', NEW.id);
                    v_regional_found := TRUE;
                ELSE
                    -- G2 é Afiliado/Consumidor normal: Ganha 1% mensal + 1% anual (lançados como 'pending')
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES 
                    (v_upline_id, 'commission', 'Comissão Mensal G2 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id),
                    (v_upline_id, 'commission', 'Comissão Anual G2 (1%) - Pedido #' || NEW.id, ROUND(v_amount * 0.01, 2), 'pending', NEW.id);
                END IF;
            END IF;

            -- Avançar para o próximo patrocinador
            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_level := v_level + 1;
        END LOOP;

        -- Se nenhum dos uplines diretos (G0, G1, G2) for um regional_reseller,
        -- subimos a árvore até encontrar o primeiro regional_reseller daquela linhagem (lançado como 'pending')
        IF NOT v_regional_found THEN
            WHILE v_upline_id IS NOT NULL LOOP
                SELECT role INTO v_upline_role FROM public.profiles WHERE id = v_upline_id;
                
                IF v_upline_role = 'regional_reseller' THEN
                    -- Encontrou o líder regional: Paga os 6% de rede
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES (v_upline_id, 'commission', 'Comissão Regional de Rede (6%) - Pedido #' || NEW.id, ROUND(v_amount * 0.06, 2), 'pending', NEW.id);
                    
                    v_regional_found := TRUE;
                    EXIT; -- Encontrou e pagou, encerra a busca
                END IF;

                -- Avançar
                v_current_id := v_upline_id;
                SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            END LOOP;
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
        created_at = now() -- Atualiza a data de efetivação da carteira
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


-- 3. Função para processar fechamento e pagamento de comissões MENSAL e de REDE (6%)
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
