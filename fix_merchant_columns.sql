-- SCRIPT DE FIX: Garantir colunas de Lojista na tabela profiles
-- Execute no SQL Editor do Supabase (ioslywxfppswfuzxzwkn)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS stock_address TEXT,
ADD COLUMN IF NOT EXISTS stock_number TEXT,
ADD COLUMN IF NOT EXISTS stock_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS stock_city TEXT,
ADD COLUMN IF NOT EXISTS stock_state TEXT,
ADD COLUMN IF NOT EXISTS stock_zip_code TEXT;

-- Garantir que as colunas de endereço pessoal também existam
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Garantir extensões e tipos se necessário
-- (Adicione aqui se houver necessidade de tipos ENUM customizados)

NOTIFY pgrst, 'reload schema';
