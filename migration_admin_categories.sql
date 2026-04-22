-- =========================================================
-- MIGRATION: RLS para Administradores (Categorias)
-- =========================================================

-- Função auxiliar para verificar se o usuário é admin (caso não exista)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas da tabela categories para permitir acesso total ao admin
DROP POLICY IF EXISTS "categories_admin_all_policy" ON public.categories;
CREATE POLICY "categories_admin_all_policy" ON public.categories 
FOR ALL TO authenticated 
USING (
    public.is_admin() OR 
    merchant_id = public.get_auth_merchant_owner_id()
)
WITH CHECK (
    public.is_admin() OR 
    merchant_id = public.get_auth_merchant_owner_id()
);

-- Garantir que categorias sem merchant_id (globais) sejam visíveis para todos
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy" ON public.categories 
FOR SELECT TO authenticated 
USING (true);

NOTIFY pgrst, 'reload schema';
