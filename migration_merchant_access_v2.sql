-- MIGRATION: Fix Merchant Access (v2 - Anti-Recursion)
-- Execute este script no SQL Editor do Supabase (Projeto: ioslywxfppswfuzxzwkn)

-- 1. Limpar políticas antigas problemáticas
DROP POLICY IF EXISTS "Lojistas e Gerentes veem filiais da organizacao" ON public.branches;
DROP POLICY IF EXISTS "Acesso aos perfis da organizacao" ON public.profiles;
DROP POLICY IF EXISTS "Gestao de equipe (Lojistas e Gerentes)" ON public.profiles;
DROP POLICY IF EXISTS "Lojistas podem gerenciar seus gerentes" ON public.profiles;
DROP POLICY IF EXISTS "Lojistas podem ver perfis sem filial" ON public.profiles;

-- 2. Função SECURITY DEFINER para buscar o ID do Lojista (Dono) sem causar recursão RLS
-- Esta função roda com privilégios de superusuário internamente, ignorando RLS em suas próprias queries.
CREATE OR REPLACE FUNCTION public.get_auth_merchant_owner_id()
RETURNS UUID AS $$
DECLARE
    found_id UUID;
BEGIN
    -- Busca direta: Se o usuário logado for dono, o ID é ele mesmo
    SELECT id INTO found_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner';
    
    IF found_id IS NOT NULL THEN
        RETURN found_id;
    END IF;

    -- Busca indireta: Se for gerente, retorna o ID do lojista da sua filial
    SELECT b.merchant_id INTO found_id 
    FROM public.branches b
    JOIN public.profiles p ON p.branch_id = b.id
    WHERE p.id = auth.uid() AND p.role = 'manager'
    LIMIT 1;

    RETURN found_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Restaurar política básica de Profiles (Login Seguro)
CREATE POLICY "Profiles - Ver proprio perfil" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 4. Política para Gerentes/Lojistas verem sua Equipe
CREATE POLICY "Profiles - Ver equipe da organizacao" ON public.profiles
FOR SELECT USING (
    branch_id IS NULL OR -- Perfis aguardando vínculo
    role = 'manager' OR -- Visibilidade mútua de gerentes
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE id = public.profiles.branch_id 
        AND merchant_id = public.get_auth_merchant_owner_id()
    )
);

-- 5. Atualizar política de Gestão (UPDATE)
CREATE POLICY "Profiles - Gestao de equipe" ON public.profiles
FOR UPDATE USING (
    id = auth.uid() OR -- Pode editar o próprio perfil
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE id = public.profiles.branch_id 
        AND merchant_id = public.get_auth_merchant_owner_id()
    )
)
WITH CHECK (true);

-- 6. Atualizar política de Branches (SELECT)
CREATE POLICY "Branches - Ver filiais da organizacao" ON public.branches
FOR SELECT USING (
    merchant_id = auth.uid() OR -- É o dono
    merchant_id = public.get_auth_merchant_owner_id() -- É gerente vinculado a uma filial desse dono
);

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
