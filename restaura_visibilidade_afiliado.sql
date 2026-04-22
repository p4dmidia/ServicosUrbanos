-- SCRIPT DE RESTAURAÇÃO: Visibilidade de Afiliados e Rede MMN
-- Execute no SQL Editor do Supabase (ioslywxfppswfuzxzwkn)

-- 1. Permitir que Afiliados vejam sua própria rede (quem eles indicaram)
DROP POLICY IF EXISTS "Afiliados veem seus indicados" ON public.profiles;
CREATE POLICY "Afiliados veem seus indicados" 
ON public.profiles FOR SELECT 
USING (
    referred_by = (SELECT referral_code FROM public.profiles WHERE id = auth.uid()) OR
    referred_by = auth.uid()::text -- Cobertura para ambos os formatos de indicação
);

-- 2. Garantir que todos vejam seu próprio perfil (Reforço)
DROP POLICY IF EXISTS "Profiles - Ver proprio perfil" ON public.profiles;
CREATE POLICY "Profiles - Ver proprio perfil" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 3. Adicionar permissão para ver transações próprias (Dashboard Stats)
-- Se não houver política para transações, o affiliate verá R$ 0.00
DROP POLICY IF EXISTS "User ve suas proprias transacoes" ON public.transactions;
CREATE POLICY "User ve suas proprias transacoes" 
ON public.transactions FOR SELECT 
USING (profile_id = auth.uid());

-- 4. Garantir visibilidade de pedidos onde o usuário é o comprador
DROP POLICY IF EXISTS "User ve seus proprios pedidos" ON public.orders;
CREATE POLICY "User ve seus proprios pedidos" 
ON public.orders FOR SELECT 
USING (customer_id = auth.uid());

-- 5. Restaurar visibilidade de filiais para todos (necessário para links e navegação)
DROP POLICY IF EXISTS "Visibilidade publica de filiais" ON public.branches;
CREATE POLICY "Visibilidade publica de filiais" 
ON public.branches FOR SELECT 
USING (true);

NOTIFY pgrst, 'reload schema';
