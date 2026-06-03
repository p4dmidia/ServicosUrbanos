-- =========================================================================
-- MIGRATION: RESILIENT ORDER CANCELLATION TRIGGER & CLEANUP
-- OBJETIVO: Garantir que comissões de MMN de pedidos cancelados sejam sempre deletadas
--           independentemente do status de transição, e realizar limpeza única.
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   Cole e execute este script completo
-- =========================================================================

-- 1. LIMPEZA ÚNICA: Deletar transações de comissão antigas de pedidos que já estão cancelados
DELETE FROM public.transactions 
WHERE type = 'commission' 
  AND order_id IN (SELECT id FROM public.orders WHERE status = 'Cancelado')
  AND description NOT LIKE 'Estorno%';

-- 2. RECREAR A FUNÇÃO DE TRIGGER COM FLUXO DE CANCELAMENTO RESILIENTE
CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    item_prod_id uuid;
    item_qty integer;
    refund_exists boolean;
    wallet_used numeric;
BEGIN
    -- Só processa se o novo status for 'Cancelado' e o anterior não era 'Cancelado'
    IF NEW.status = 'Cancelado' AND (OLD.status IS NULL OR OLD.status <> 'Cancelado') THEN
        
        -- A. DEVOLVER PRODUTOS AO ESTOQUE (Restaurar estoque e reduzir contagem de vendas)
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

        -- B. REMOVER COMISSÕES MMN (Sempre executado no cancelamento para garantir integridade)
        DELETE FROM public.transactions 
        WHERE order_id = NEW.id 
        AND type = 'commission' 
        AND description NOT LIKE 'Estorno%';

        -- C. REVERSÃO FINANCEIRA PARA O COMPRADOR (Estorno)
        -- Apenas se o pedido já havia sido pago (status anterior era 'Pago, Aguardando Retirada' ou 'Concluído')
        IF OLD.status IN ('Pago, Aguardando Retirada', 'Concluído') THEN
            
            -- Verifica se já existe um estorno gerado para este pedido (evitar duplicidade)
            SELECT EXISTS (
                SELECT 1 FROM public.transactions 
                WHERE order_id = NEW.id 
                AND type = 'commission' 
                AND description = 'Estorno Digital - Pedido #' || NEW.id
            ) INTO refund_exists;

            -- Insere a transação de estorno (crédito) na carteira digital do comprador apenas do valor realmente usado
            IF NOT refund_exists THEN
                -- Calcula o valor total utilizado da carteira digital
                SELECT COALESCE(ABS(SUM(amount)), 0) INTO wallet_used
                FROM public.transactions
                WHERE order_id = NEW.id
                  AND type = 'withdrawal'
                  AND status = 'completed';

                IF wallet_used > 0 THEN
                    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                    VALUES (
                        NEW.customer_id,
                        'commission',
                        'Estorno Digital - Pedido #' || NEW.id,
                        wallet_used,
                        'completed',
                        NEW.id
                    );
                END IF;
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GARANTIR QUE A TRIGGER ESTÁ ASSOCIDADA À TABELA orders
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;

CREATE TRIGGER on_order_cancelled
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_cancellation();

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
