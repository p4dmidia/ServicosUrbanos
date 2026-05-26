-- Script de Políticas de RLS para Configurações (UrbaShop)
-- Execute no SQL Editor do Supabase (ioslywxfppswfuzxzwkn)

-- 1. Habilitar RLS nas tabelas (caso ainda não estejam)
ALTER TABLE public.marketplace_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_config ENABLE ROW LEVEL SECURITY;

-- 2. Configurações de Políticas para marketplace_config
DROP POLICY IF EXISTS "Leitura pública de marketplace_config" ON public.marketplace_config;
CREATE POLICY "Leitura pública de marketplace_config" ON public.marketplace_config 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escrita apenas para admins de marketplace_config" ON public.marketplace_config;
CREATE POLICY "Escrita apenas para admins de marketplace_config" ON public.marketplace_config 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Configurações de Políticas para finance_config
DROP POLICY IF EXISTS "Leitura pública de finance_config" ON public.finance_config;
CREATE POLICY "Leitura pública de finance_config" ON public.finance_config 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escrita apenas para admins de finance_config" ON public.finance_config;
CREATE POLICY "Escrita apenas para admins de finance_config" ON public.finance_config 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
