-- 1. Alterar a restrição de CHECK para permitir plano mensal (30 dias)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual'));

-- 2. Adicionar políticas de RLS para permitir que os próprios afiliados insiram e atualizem suas assinaturas
DROP POLICY IF EXISTS "Usuários inserem próprias assinaturas" ON public.subscriptions;
CREATE POLICY "Usuários inserem próprias assinaturas" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Usuários atualizam próprias assinaturas" ON public.subscriptions;
CREATE POLICY "Usuários atualizam próprias assinaturas" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = profile_id);

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
