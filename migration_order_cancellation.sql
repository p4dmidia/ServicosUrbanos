-- =========================================================================
-- MIGRATION: TRIGGER handle_order_cancellation
-- OBJETIVO: Ao cancelar um pedido (status = 'Cancelado'), devolver os produtos ao estoque
--           e realizar o estorno automático dos valores para a carteira digital do comprador,
--           além de remover/reverter as comissões distribuídas para a rede de afiliados.
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   Cole e execute este script completo
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    item_prod_id uuid;
    item_qty integer;
    refund_exists boolean;
BEGIN
    -- Só processa se o novo status for 'Cancelado' e o anterior não era 'Cancelado'
    IF NEW.status = 'Cancelado' AND (OLD.status IS NULL OR OLD.status <> 'Cancelado') THEN
        
        -- 1. DEVOLVER PRODUTOS AO ESTOQUE (Restaurar estoque e reduzir contagem de vendas)
        IF NEW.items IS NOT NULL THEN
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
                item_prod_id := (item->>'id')::uuid;
                item_qty := (item->>'quantity')::integer;
                
                -- Devolve o estoque na tabela global de produtos e reduz as vendas
                UPDATE public.products
                SET stock = COALESCE(stock, 0) + item_qty,
                    sales = GREATEST(0, COALESCE(sales, 0) - item_qty)
                WHERE id = item_prod_id;
                
                -- Devolve o estoque na tabela de estoques da filial correspondente se houver branch_id
                IF NEW.branch_id IS NOT NULL THEN
                    INSERT INTO public.product_stocks (product_id, branch_id, stock)
                    VALUES (item_prod_id, NEW.branch_id, item_qty)
                    ON CONFLICT (product_id, branch_id) 
                    DO UPDATE SET stock = public.product_stocks.stock + item_qty;
                END IF;
            END LOOP;
        END IF;

        -- 2. REVERSÃO FINANCEIRA (Estorno e remoção de comissões)
        -- Apenas se o pedido já havia sido pago (status anterior era 'Pago, Aguardando Retirada' ou 'Concluído')
        IF OLD.status IN ('Pago, Aguardando Retirada', 'Concluído') THEN
            
            -- A. Deleta as comissões geradas para a rede MMN para que a carteira não seja distribuída
            DELETE FROM public.transactions 
            WHERE order_id = NEW.id 
            AND type = 'commission' 
            AND description NOT LIKE 'Estorno%';

            -- B. Verifica se já existe um estorno gerado para este pedido (evitar duplicidade)
            SELECT EXISTS (
                SELECT 1 FROM public.transactions 
                WHERE order_id = NEW.id 
                AND type = 'commission' 
                AND description = 'Estorno Digital - Pedido #' || NEW.id
            ) INTO refund_exists;

            -- C. Insere a transação de estorno (crédito) na carteira digital do comprador
            IF NOT refund_exists THEN
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES (
                    NEW.customer_id,
                    'commission',
                    'Estorno Digital - Pedido #' || NEW.id,
                    NEW.amount,
                    'completed',
                    NEW.id
                );
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar trigger antiga se existir
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;

-- Criar a nova trigger
CREATE TRIGGER on_order_cancelled
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_cancellation();

-- Recarregar o schema do PostgREST para refletir alterações se necessário
NOTIFY pgrst, 'reload schema';
