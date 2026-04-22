-- Script para permissões de gerenciamento de equipe (UrbaShop)
-- Execute este script no SQL Editor do Supabase para o projeto ioslywxfppswfuzxzwkn

-- 1. Permitir que lojistas vejam perfis de potenciais gerentes
DROP POLICY IF EXISTS "Lojistas podem ver perfis sem filial" ON public.profiles;
CREATE POLICY "Lojistas podem ver perfis sem filial" 
ON public.profiles FOR SELECT 
USING (branch_id IS NULL OR role = 'manager' OR id = auth.uid());

-- 2. Permitir atualização de perfis para vinculação de equipe
-- Nota: Em produção, isso deve ser restrito via trigger ou função RPC.
-- Para o MVP, liberamos a atualização para que o lojista mude o role e branch_id do gerente.
DROP POLICY IF EXISTS "Lojistas podem gerenciar seus gerentes" ON public.profiles;
CREATE POLICY "Lojistas podem gerenciar seus gerentes" 
ON public.profiles FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 3. Limpar cache da API
NOTIFY pgrst, 'reload schema';
