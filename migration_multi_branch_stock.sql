-- 1. Create product_stocks table
CREATE TABLE IF NOT EXISTS public.product_stocks (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, branch_id)
);

-- 2. Enable RLS
ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Permitir leitura pública de estoques" ON public.product_stocks;
DROP POLICY IF EXISTS "Lojistas gerenciam estoques" ON public.product_stocks;

-- 4. Create policies
CREATE POLICY "Permitir leitura pública de estoques" ON public.product_stocks FOR SELECT USING (true);
CREATE POLICY "Lojistas gerenciam estoques" ON public.product_stocks FOR ALL USING (
    public.get_auth_role() IN ('owner', 'manager')
);

-- 5. Backfill existing stock into product_stocks
-- For each product, if it has a branch_id and stock > 0, insert it into product_stocks
INSERT INTO public.product_stocks (product_id, branch_id, stock)
SELECT id, branch_id, stock
FROM public.products
WHERE branch_id IS NOT NULL AND stock IS NOT NULL
ON CONFLICT (product_id, branch_id) DO UPDATE 
SET stock = EXCLUDED.stock;

-- 6. Restrict orders visibility for managers to their branch only
DROP POLICY IF EXISTS "orders_user_policy" ON public.orders;

CREATE POLICY "orders_user_policy" ON public.orders FOR SELECT 
TO authenticated 
USING (
    customer_id = auth.uid() 
    OR public.get_auth_role() = 'owner'
    OR (
        public.get_auth_role() = 'manager' 
        AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
    )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
