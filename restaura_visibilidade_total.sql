-- Script de Restauração de Visibilidade Total (UrbaShop)
-- Execute no SQL Editor do Supabase (ioslywxfppswfuzxzwkn)

-- REMOÇÃO DE POLÍTICAS ANTIGAS (Limpeza)
DROP POLICY IF EXISTS "Lojistas podem ver perfis sem filial" ON public.profiles;
DROP POLICY IF EXISTS "Lojistas podem gerenciar seus gerentes" ON public.profiles;
DROP POLICY IF EXISTS "Donos veem seu proprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Donos veem outros perfis para equipe" ON public.profiles;
DROP POLICY IF EXISTS "Donos editam seu perfil e equipe" ON public.profiles;

-- PERMISSÕES Tabela: PROFILES
-- Ver o próprio perfil (Essencial)
CREATE POLICY "Donos veem seu proprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Ver potenciais gerentes
CREATE POLICY "Donos veem outros perfis para equipe" 
ON public.profiles FOR SELECT 
USING (branch_id IS NULL OR role = 'manager');

-- Editar próprio perfil e gerentes vinculados
CREATE POLICY "Donos editam seu perfil e equipe" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR (role = 'manager' AND branch_id IN (SELECT id FROM public.branches WHERE merchant_id = auth.uid())));

-- PERMISSÕES Tabela: BRANCHES (Garantindo que você veja suas lojas)
DROP POLICY IF EXISTS "Donos veem suas proprias filiais" ON public.branches;
CREATE POLICY "Donos veem suas proprias filiais" 
ON public.branches FOR SELECT 
USING (merchant_id = auth.uid());

-- REFRESH DA API
NOTIFY pgrst, 'reload schema';
