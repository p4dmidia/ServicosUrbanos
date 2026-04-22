-- 1. Função SECURITY DEFINER para buscar o ID do Lojista (Dono) sem causar recursão RLS
-- Esta função é essencial para que as políticas de RLS funcionem corretamente.
CREATE OR REPLACE FUNCTION public.get_auth_merchant_owner_id()
RETURNS UUID AS $$
DECLARE
    found_id UUID;
BEGIN
    -- Se o usuário logado for dono, o ID é ele mesmo
    SELECT id INTO found_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner';
    
    IF found_id IS NOT NULL THEN
        RETURN found_id;
    END IF;

    -- Se for gerente, retorna o ID do lojista da sua filial
    SELECT b.merchant_id INTO found_id 
    FROM public.branches b
    JOIN public.profiles p ON p.branch_id = b.id
    WHERE p.id = auth.uid() AND p.role = 'manager'
    LIMIT 1;

    RETURN found_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Certificar colunas essenciais no perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Índices para busca ultra-rápida
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Limpar políticas de RLS legadas e inseguras
DROP POLICY IF EXISTS "Lojistas podem ver perfis sem filial" ON public.profiles;
DROP POLICY IF EXISTS "Lojistas podem gerenciar seus gerentes" ON public.profiles;

-- 5. Nova política de leitura segura:
DROP POLICY IF EXISTS "profiles_safe_select_v2" ON public.profiles;
CREATE POLICY "profiles_safe_select_v2" ON public.profiles FOR SELECT
USING (
  id = auth.uid() 
  OR (
    branch_id IS NOT NULL 
    AND branch_id IN (
      SELECT b.id FROM public.branches b 
      WHERE b.merchant_id = public.get_auth_merchant_owner_id()
    )
  )
);

-- 6. Função de busca segura (ignora RLS via Security Definer)
CREATE OR REPLACE FUNCTION public.search_profile_by_cpf(search_cpf TEXT)
RETURNS TABLE (profile_id UUID, profile_name TEXT, is_already_manager BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as profile_id, 
        full_name as profile_name,
        (role = 'manager' OR role = 'owner') as is_already_manager
    FROM public.profiles
    WHERE cpf = search_cpf
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.search_profile_by_cpf(TEXT) TO authenticated;

-- Recarregar o schema
NOTIFY pgrst, 'reload schema';
