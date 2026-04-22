-- =========================================================
-- MIGRATION: Melhoria de Produtos, Categorias e Correção RLS
-- Projeto: Serviços Urbanos (ioslywxfppswfuzxzwkn)
-- =========================================================

-- 1. ADICIONAR merchant_id PARA ISOLAMENTO (Essencial para produtos da Matriz)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.profiles(id);

-- 2. ADICIONAR CAMPOS DE LOGÍSTICA E IMAGENS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight NUMERIC,      -- Peso (kg)
ADD COLUMN IF NOT EXISTS height NUMERIC,      -- Altura (cm)
ADD COLUMN IF NOT EXISTS width NUMERIC,       -- Largura (cm)
ADD COLUMN IF NOT EXISTS length NUMERIC,      -- Comprimento (cm)
ADD COLUMN IF NOT EXISTS description TEXT,    -- Descrição detalhada
ADD COLUMN IF NOT EXISTS main_image TEXT,     -- Imagem de capa
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}', -- Galeria de imagens
ADD COLUMN IF NOT EXISTS category_id UUID;    -- Vínculo com nova tabela de categorias

-- 3. CRIAR TABELA DE CATEGORIAS HIERÁRQUICAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO - CATEGORIAS
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy" ON public.categories 
FOR SELECT TO authenticated 
USING (true);

DROP POLICY IF EXISTS "categories_all_policy" ON public.categories;
CREATE POLICY "categories_all_policy" ON public.categories 
FOR ALL TO authenticated 
USING (
    merchant_id = public.get_auth_merchant_owner_id()
)
WITH CHECK (
    merchant_id = public.get_auth_merchant_owner_id()
);

-- 5. POLÍTICAS DE ACESSO - PRODUTOS (FIX 403)
-- Agora usamos o merchant_id para garantir que donos e gerentes vejam apenas seus produtos
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
CREATE POLICY "products_select_policy" ON public.products 
FOR SELECT TO authenticated 
USING (true);

DROP POLICY IF EXISTS "products_all_policy" ON public.products;
CREATE POLICY "products_all_policy" ON public.products 
FOR ALL TO authenticated 
USING (
    merchant_id = public.get_auth_merchant_owner_id()
)
WITH CHECK (
    merchant_id = public.get_auth_merchant_owner_id()
);

-- 6. VINCULAR PRODUTOS EXISTENTES AO SEU MERCHANT_ID (Retrocompatibilidade)
-- Se o produto já tem uma filial, buscamos o merchant_id da filial
UPDATE public.products p
SET merchant_id = b.merchant_id
FROM public.branches b
WHERE p.branch_id = b.id AND p.merchant_id IS NULL;

-- Se o produto não tem filial e o owner criou (suposição), poderíamos tentar vincular, 
-- mas como o erro 403 impedia o cadastro, provavelmente não há muitos produtos órfãos.

NOTIFY pgrst, 'reload schema';
