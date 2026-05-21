-- Função principal para distribuir comissões ao pagar pedido com Divisão Tripla (Tri-Split)
-- Conforme PRD: Cada nível de comissão é dividido em 3 partes: Mensal (33.33%), Anual (33.33%) e CD (33.34%)

CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    mmn_depth INTEGER;
    mmn_pay_type TEXT;
    commission_record RECORD;
    commission_val NUMERIC;
    part_val NUMERIC;
BEGIN
    -- [CONDIÇÃO DE DISPARO]
    -- Só processa se o novo status for 'Pago, Aguardando Retirada' ou 'Concluído'
    -- E o status anterior NÃO era um desses (evita pagar 2x se mudar de 'Pago' para 'Concluído')
    IF (
        (NEW.status IN ('Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- [TRAVA DE SEGURANÇA]
        -- Verifica se já existem transações de comissão para este pedido
        IF EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE description LIKE '%Pedido #' || NEW.id || '%' 
            AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- Pegar configurações de MMN
        SELECT depth, payment_type INTO mmn_depth, mmn_pay_type FROM public.mmn_config WHERE id = 1;
        
        -- Percorrer a cadeia de patrocinadores e gerar comissões
        FOR commission_record IN 
            SELECT u.upline_id, u.level, l.value
            FROM public.get_upline_chain(NEW.customer_id, mmn_depth) u
            JOIN public.mmn_levels l ON u.level = l.level
        LOOP
            -- Calcular o valor TOTAL da comissão para este nível
            IF mmn_pay_type = 'percent' THEN
                commission_val := (NEW.amount * (commission_record.value / 100));
            ELSE
                commission_val := commission_record.value;
            END IF;
            
            -- Dividir em 3 partes conforme PRD (Tri-Split)
            part_val := ROUND(commission_val / 3, 2);
            
             -- 1. Bônus Mensal (33.33%)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Mensal - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                part_val, 
                'completed'
            );

            -- 2. Bônus Anual (33.33%)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Anual - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                part_val, 
                'completed'
            );

            -- 3. Bônus Carteira Digital (CD) (Resíduo para fechar o total)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Digital - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                commission_val - (2 * part_val), 
                'completed'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
