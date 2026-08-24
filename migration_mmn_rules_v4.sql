-- 1. Atualizar a trigger de pagamento de comissão para as regras finais de MMN v4
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
        -- Cada nível (G0, G1, G2) recebe exatamente: 2% semanal + 2% mensal + 2% anual
        v_current_id := NEW.customer_id;
        SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
        v_level := 1;

        WHILE v_upline_id IS NOT NULL AND v_level <= 3 LOOP
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_upline_id, 'commission', 'Comissão Semanal G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Mensal G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_upline_id, 'commission', 'Comissão Anual G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id);

            v_current_id := v_upline_id;
            SELECT referred_by INTO v_upline_id FROM public.profiles WHERE id = v_current_id;
            v_level := v_level + 1;
        END LOOP;

        -- 3. DISTRIBUIR COMISSÕES DE REVENDEDOR REGIONAL
        -- Se encontramos um regional_reseller na rede, ele ganha a comissão do regional de rede de 6% (2% semanal + 2% mensal + 2% anual)
        IF v_regional_id IS NOT NULL THEN
            INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
            VALUES 
            (v_regional_id, 'commission', 'Comissão Regional Semanal (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Mensal (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id),
            (v_regional_id, 'commission', 'Comissão Regional Anual (2%) - Pedido #' || NEW.id, ROUND(v_amount * 0.02, 2), 'pending', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
