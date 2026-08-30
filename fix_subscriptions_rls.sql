-- 1. Remover políticas de RLS antigas restritivas
DROP POLICY IF EXISTS "Gerentes e owners veem todas as assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Gerentes e owners editam assinaturas" ON public.subscriptions;

-- 2. Criar novas políticas de RLS que incluem explicitamente a role 'admin'
CREATE POLICY "Admins, gerentes e owners veem todas as assinaturas" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Admins, gerentes e owners editam assinaturas" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager', 'admin')
        )
    );

-- 3. Recarregar o schema do PostgREST para aplicar imediatamente
NOTIFY pgrst, 'reload schema';
