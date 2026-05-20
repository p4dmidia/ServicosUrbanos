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
    
    -- Pesos globais
    w_mensal NUMERIC;
    w_digital NUMERIC;
    w_anual NUMERIC;
    w_total NUMERIC;
    
    -- Valores calculados das partes
    v_mensal NUMERIC;
    v_digital NUMERIC;
    v_anual NUMERIC;
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

        -- Pegar configurações de MMN incluindo os pesos de cashback
        SELECT depth, payment_type, cashback_mensal, cashback_digital, cashback_anual 
        INTO mmn_depth, mmn_pay_type, w_mensal, w_digital, w_anual 
        FROM public.mmn_config 
        WHERE id = 1;
        
        -- Garante fallbacks para evitar nulos ou divisão por zero
        w_mensal := COALESCE(w_mensal, 2.75);
        w_digital := COALESCE(w_digital, 1.00);
        w_anual := COALESCE(w_anual, 0.75);
        
        w_total := w_mensal + w_digital + w_anual;
        IF w_total = 0 THEN
            w_total := 4.5;
        END IF;
        
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
            
            -- Dividir proporcionalmente baseado nos pesos configurados
            v_mensal := ROUND((commission_val * w_mensal / w_total), 2);
            v_digital := ROUND((commission_val * w_digital / w_total), 2);
            -- O residual fica no Anual para garantir o fechamento exato dos centavos
            v_anual := commission_val - (v_mensal + v_digital);
            
            -- 1. Bônus Mensal
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Mensal - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_mensal, 
                'completed'
            );

            -- 2. Bônus Anual
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Anual - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_anual, 
                'completed'
            );

            -- 3. Bônus Carteira Digital (CD)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Digital - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_digital, 
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
DROP TRIGGER IF EXISTS on_order_commission_payment ON public.orders;

-- 3. Criar o novo gatilho único
CREATE TRIGGER on_order_commission_payment
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();

-- Comentário: Script finalizado. Execute no SQL Editor do Supabase.
