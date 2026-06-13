-- =========================================================================
-- MIGRATION: RPC DE BAIXA DE ESTOQUE SEGURA (SECURITY DEFINER)
-- OBJETIVO: Permitir que clientes/afiliados realizem a baixa de estoque 
--           durante o checkout, contornando a restrição de escrita de RLS
--           sem expor privilégios de escrita direta nas tabelas.
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   Cole e execute este script completo
-- =========================================================================

CREATE OR REPLACE FUNCTION public.decrement_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_branch_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_stock RECORD;
    v_product RECORD;
    new_branch_stock INTEGER;
    new_product_stock INTEGER;
BEGIN
    -- 1. Se p_branch_id for fornecido (não nulo), atualiza o estoque da filial em product_stocks
    IF p_branch_id IS NOT NULL THEN
        SELECT stock INTO v_stock
        FROM public.product_stocks
        WHERE product_id = p_product_id AND branch_id = p_branch_id
        FOR UPDATE; -- Previne race conditions

        IF FOUND THEN
            new_branch_stock := GREATEST(0, COALESCE(v_stock.stock, 0) - p_quantity);
            UPDATE public.product_stocks
            SET stock = new_branch_stock
            WHERE product_id = p_product_id AND branch_id = p_branch_id;
        END IF;
    END IF;

    -- 2. Busca estoque atual do anúncio principal e atualiza o estoque global e vendas
    SELECT stock, sales INTO v_product
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE; -- Previne race conditions

    IF FOUND THEN
        new_product_stock := GREATEST(0, COALESCE(v_product.stock, 0) - p_quantity);
        UPDATE public.products
        SET stock = new_product_stock,
            sales = COALESCE(v_product.sales, 0) + p_quantity
        WHERE id = p_product_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
