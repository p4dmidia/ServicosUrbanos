-- =========================================================
-- MIGRATION: Tabela e Bucket de Armazenamento de Materiais
-- Projeto: Serviços Urbanos (ioslywxfppswfuzxzwkn)
-- =========================================================

-- 1. Criar tabela de materiais de divulgação
CREATE TABLE IF NOT EXISTS public.marketing_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'feed', -- 'stories', 'feed', 'videos', 'documentos', 'copys', 'drive'
    type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'pdf', 'link', 'text'
    file_url TEXT,
    thumbnail_url TEXT,
    copy_text TEXT,
    external_link TEXT,
    file_size TEXT,
    badge TEXT, -- 'Novo', 'Destaque', 'Mais Usado', 'Oficial'
    order_index INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Inativo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_select_policy" ON public.marketing_materials;
CREATE POLICY "materials_select_policy" ON public.marketing_materials
FOR SELECT
USING (
    status = 'Ativo'
    OR public.is_admin()
    OR public.get_auth_role() IN ('admin', 'owner')
);

DROP POLICY IF EXISTS "materials_admin_all_policy" ON public.marketing_materials;
CREATE POLICY "materials_admin_all_policy" ON public.marketing_materials
FOR ALL TO authenticated
USING (
    public.is_admin() OR public.get_auth_role() IN ('admin', 'owner')
)
WITH CHECK (
    public.is_admin() OR public.get_auth_role() IN ('admin', 'owner')
);

-- 2. Criar bucket público 'marketing-materials' no Storage do Supabase
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'marketing-materials',
    'marketing-materials',
    true,
    104857600 -- 100MB por arquivo
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso para o Storage (leitura pública, escrita para autenticados)
DROP POLICY IF EXISTS "Public Access to Marketing Materials" ON storage.objects;
CREATE POLICY "Public Access to Marketing Materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-materials');

DROP POLICY IF EXISTS "Auth Upload Marketing Materials" ON storage.objects;
CREATE POLICY "Auth Upload Marketing Materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-materials');

DROP POLICY IF EXISTS "Auth Update Marketing Materials" ON storage.objects;
CREATE POLICY "Auth Update Marketing Materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'marketing-materials');

DROP POLICY IF EXISTS "Auth Delete Marketing Materials" ON storage.objects;
CREATE POLICY "Auth Delete Marketing Materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketing-materials');

NOTIFY pgrst, 'reload schema';
