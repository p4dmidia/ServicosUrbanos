-- =========================================================
-- MIGRATION: RLS para Administradores no gerenciamento de Produtos e Planos
-- Projeto: Serviços Urbanos (ioslywxfppswfuzxzwkn)
-- =========================================================

-- 1. Garantir que a função is_admin() reconheça 'admin' e 'owner'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que get_auth_role() exista
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Limpeza de políticas antigas da tabela products
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_all_policy" ON public.products;
DROP POLICY IF EXISTS "products_admin_all_policy" ON public.products;
DROP POLICY IF EXISTS "products_merchant_all_policy" ON public.products;

-- 4. Política de Leitura (SELECT)
CREATE POLICY "products_select_policy" ON public.products 
FOR SELECT 
USING (
    -- Clientes / Público: produtos ativos ou planos de assinatura
    status = 'Ativo'
    OR is_subscription = true
    -- Administradores: veem todos
    OR public.is_admin()
    OR public.get_auth_role() IN ('admin', 'owner')
    -- Lojista Dono: vê todos os seus produtos (inclusive inativos)
    OR (auth.uid() IS NOT NULL AND auth.uid() = merchant_id)
    -- Gerente da Filial: vê produtos da sua filial
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.branch_id = products.branch_id
    )
);

-- 5. Política de Gerenciamento Total para Administradores (INSERT, UPDATE, DELETE)
CREATE POLICY "products_admin_all_policy" ON public.products 
FOR ALL TO authenticated 
USING (
    public.is_admin() OR public.get_auth_role() IN ('admin', 'owner')
)
WITH CHECK (
    public.is_admin() OR public.get_auth_role() IN ('admin', 'owner')
);

-- 6. Política de Gerenciamento para Lojistas (INSERT, UPDATE, DELETE)
CREATE POLICY "products_merchant_all_policy" ON public.products 
FOR ALL TO authenticated 
USING (
    merchant_id IS NOT NULL AND merchant_id = public.get_auth_merchant_owner_id()
)
WITH CHECK (
    merchant_id IS NOT NULL AND merchant_id = public.get_auth_merchant_owner_id()
);

NOTIFY pgrst, 'reload schema';
