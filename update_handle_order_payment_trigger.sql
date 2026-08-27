-- Execute este SQL no Editor SQL do seu painel do Supabase para atualizar a trigger de pagamento
-- de pedidos para ativar assinaturas automaticamente quando o pedido é pago.

CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    mmn_depth INTEGER;
    mmn_pay_type TEXT;
    commission_record RECORD;
    commission_val NUMERIC;
    p_mensal NUMERIC;
    p_digital NUMERIC;
    p_anual NUMERIC;
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
        
        -- Verifica se já existem transações de cashback para este pedido
        IF EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE (description LIKE 'Cashback%' OR description LIKE 'Comissão MMN%') 
            AND description LIKE '%Pedido #' || NEW.id || '%' 
            AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- Ativar assinatura se o pedido contiver itens de assinatura
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

                        -- Desativar assinaturas anteriores do mesmo usuário para evitar múltiplas ativas
                        UPDATE public.subscriptions 
                        SET status = 'inactive'
                        WHERE profile_id = NEW.customer_id;

                        -- Inserir nova assinatura ativa
                        INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
                        VALUES (NEW.customer_id, v_plan_type, v_price, 'active', v_start_date, v_end_date);
                    END IF;
                END LOOP;
            END;
        END IF;

        -- Pegar configurações de MMN
        SELECT depth, payment_type INTO mmn_depth, mmn_pay_type FROM public.mmn_config WHERE id = 1;
        
        -- Percorrer a cadeia de patrocinadores e gerar comissões
        FOR commission_record IN 
            SELECT u.upline_id, u.level, l.value
            FROM public.get_upline_chain(NEW.customer_id, mmn_depth) u
            JOIN public.mmn_levels l ON u.level = l.level
        LOOP
            -- Pegar as proporções configuradas
            SELECT cashback_mensal, cashback_digital, cashback_anual 
            INTO p_mensal, p_digital, p_anual 
            FROM public.mmn_config WHERE id = 1;

            -- Calcular o valor TOTAL da comissão para este nível
            IF mmn_pay_type = 'percent' THEN
                commission_val := (NEW.amount * (commission_record.value / 100));
            ELSE
                commission_val := commission_record.value;
            END IF;
            
            -- Calcular as partes baseadas nos percentuais reais (Normalizando para o total da comissão se necessário)
            -- Mas aqui vamos usar os percentuais diretos se o total bater com o nível
            -- Para manter a flexibilidade:
            v_mensal := ROUND(commission_val * (p_mensal / (p_mensal + p_digital + p_anual)), 2);
            v_digital := ROUND(commission_val * (p_digital / (p_mensal + p_digital + p_anual)), 2);
            v_anual := commission_val - (v_mensal + v_digital); -- Resíduo no anual
            
            -- 1. Cashback Mensal
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Mensal - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                v_mensal, 
                'completed'
            );

            -- 2. Cashback Anual
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Anual - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                v_anual, 
                'completed'
            );

            -- 3. Cashback Digital
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Cashback Digital - Pedido #' || NEW.id || ' (Nível ' || (commission_record.level - 1) || ')', 
                v_digital, 
                'completed'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
