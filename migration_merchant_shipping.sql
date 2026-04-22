-- Script para criação da tabela de frete/logística (UrbaShop)
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.merchant_shipping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'calculated')),
    fee DECIMAL(10,2) DEFAULT 0.00,
    deadline TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.merchant_shipping ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Lojistas e clientes podem visualizar fretes" ON public.merchant_shipping;
CREATE POLICY "Lojistas e clientes podem visualizar fretes" ON public.merchant_shipping FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lojistas podem cadastrar seus próprios fretes" ON public.merchant_shipping;
CREATE POLICY "Lojistas podem cadastrar seus próprios fretes" ON public.merchant_shipping FOR INSERT WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Lojistas podem atualizar seus próprios fretes" ON public.merchant_shipping;
CREATE POLICY "Lojistas podem atualizar seus próprios fretes" ON public.merchant_shipping FOR UPDATE USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Lojistas podem excluir seus próprios fretes" ON public.merchant_shipping;
CREATE POLICY "Lojistas podem excluir seus próprios fretes" ON public.merchant_shipping FOR DELETE USING (auth.uid() = merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_shipping_merchant_id ON public.merchant_shipping(merchant_id);
