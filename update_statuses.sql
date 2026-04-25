-- SCRIPT DE ATUALIZAÇÃO: NOVOS STATUS E RASTREIO
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna de rastreio
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- 2. Limpar pedidos com status de entrega antigos para evitar erro de constraint
UPDATE public.orders SET status = 'Pago, Aguardando Retirada' WHERE status = 'Preparando para entrega';
UPDATE public.orders SET status = 'Concluído' WHERE status = 'Enviado';

-- 3. Atualizar restrição de status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN (
        'Aguardando Pagamento', 
        'Pago, Aguardando Retirada', 
        'Concluído', 
        'Cancelado',
        'Pendente',
        'Processando'
    ));

-- 3. Atualizar a função de comissão para disparar no pagamento confirmado
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    mmn_depth INTEGER;
    mmn_pay_type TEXT;
    commission_record RECORD;
    commission_val NUMERIC;
BEGIN
    -- Só processa se o status mudar de um estado não-pago para um estado pago
    -- Estados que representam pagamento confirmado
    IF (
        (OLD.status IN ('Aguardando Pagamento', 'Pendente', 'Processando')) 
        AND 
        (NEW.status IN ('Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- Pegar configurações de MMN
        SELECT depth, payment_type INTO mmn_depth, mmn_pay_type FROM public.mmn_config WHERE id = 1;
        
        -- Percorrer a cadeia de patrocinadores e gerar comissões
        FOR commission_record IN 
            SELECT u.upline_id, u.level, l.value
            FROM public.get_upline_chain(NEW.customer_id, mmn_depth) u
            JOIN public.mmn_levels l ON u.level = l.level
        LOOP
            -- Calcular o valor
            IF mmn_pay_type = 'percent' THEN
                commission_val := (NEW.amount * (commission_record.value / 100));
            ELSE
                commission_val := commission_record.value;
            END IF;
            
            -- Registrar a transação
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN - Pedido #' || NEW.id || ' (Abaixo: ' || NEW.customer_name || ' - Nível ' || commission_record.level || ')', 
                commission_val, 
                'completed'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. (Opcional) Migrar pedidos antigos para os novos status
UPDATE public.orders SET status = 'Aguardando Pagamento' WHERE status = 'Pendente';
UPDATE public.orders SET status = 'Preparando para entrega' WHERE status = 'Processando';
