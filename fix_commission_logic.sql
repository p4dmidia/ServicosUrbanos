-- MIGRATION: CORREÇÃO DA LÓGICA DE COMISSIONAMENTO (EVITAR DUPLICIDADE)
-- OBJETIVO: Pagar comissão apenas UMA VEZ quando o pedido for marcado como pago.

-- 1. Atualizar a função principal com trava de segurança (Idempotência)
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
                'Comissão MMN (Mensal) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                part_val, 
                'completed'
            );

            -- 2. Bônus Anual (33.33%)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN (Anual) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                part_val, 
                'completed'
            );

            -- 3. Bônus Carteira Digital (CD) (Resíduo para fechar o total)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN (CD) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                commission_val - (2 * part_val), 
                'completed'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpar gatilhos antigos para garantir que não haja conflitos
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;

-- 3. Criar o novo gatilho único
CREATE TRIGGER on_order_commission_payment
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();

-- Comentário: Script finalizado. Execute no SQL Editor do Supabase.
