-- MIGRATION: Fix Merchant Access for Managers
-- Execute este script no SQL Editor do Supabase (Projeto: ioslywxfppswfuzxzwkn)

-- 1. Atualizar política de visualização de Filiais (Branches)
-- Permite que o Lojista veja suas próprias filiais E que os Gerentes vejam as filiais do seu Lojista
DROP POLICY IF EXISTS "Lojistas veem suas proprias filiais" ON public.branches;
CREATE POLICY "Lojistas e Gerentes veem filiais da organizacao" 
ON public.branches FOR SELECT 
USING (
    auth.uid() = merchant_id OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'manager' 
        AND branch_id IN (SELECT id FROM public.branches b2 WHERE b2.merchant_id = public.branches.merchant_id)
    )
);

-- 2. Atualizar política de visualização de Perfis (Profiles)
-- Permite que Gerentes vejam outros membros da equipe (mesmo lojista)
DROP POLICY IF EXISTS "Lojistas podem ver perfis sem filial" ON public.profiles;
CREATE POLICY "Acesso aos perfis da organizacao" 
ON public.profiles FOR SELECT 
USING (
    id = auth.uid() OR
    branch_id IS NULL OR 
    role = 'manager' OR
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE id = public.profiles.branch_id 
        AND merchant_id IN (
            -- É o dono da filial do perfil sendo visualizado
            SELECT id FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
            UNION
            -- É um gerente vinculado a uma filial do mesmo dono
            SELECT merchant_id FROM public.branches WHERE id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
        )
    )
);

-- 3. Permitir que gerentes atualizem perfis de sua organização (MVP)
DROP POLICY IF EXISTS "Lojistas podem gerenciar seus gerentes" ON public.profiles;
CREATE POLICY "Gestao de equipe (Lojistas e Gerentes)" 
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE id = public.profiles.branch_id 
        AND merchant_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
            UNION
            SELECT merchant_id FROM public.branches WHERE id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
        )
    )
)
WITH CHECK (true);

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
