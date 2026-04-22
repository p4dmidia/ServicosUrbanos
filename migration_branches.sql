-- Script para criação da tabela de filiais (UrbaShop)
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Lojistas veem suas proprias filiais" ON public.branches;
CREATE POLICY "Lojistas veem suas proprias filiais" ON public.branches FOR SELECT USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Lojistas cadastram suas proprias filiais" ON public.branches;
CREATE POLICY "Lojistas cadastram suas proprias filiais" ON public.branches FOR INSERT WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Lojistas atualizam suas proprias filiais" ON public.branches;
CREATE POLICY "Lojistas atualizam suas proprias filiais" ON public.branches FOR UPDATE USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Lojistas excluem suas proprias filiais" ON public.branches;
CREATE POLICY "Lojistas excluem suas proprias filiais" ON public.branches FOR DELETE USING (auth.uid() = merchant_id);

CREATE INDEX IF NOT EXISTS idx_branches_merchant_id ON public.branches(merchant_id);
