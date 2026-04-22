-- ADICIONAR COLUNAS PARA DADOS REAIS DO AFILIADO
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Afiliado';

-- COMENTÁRIO: Execute este script no SQL Editor do Supabase para habilitar a integração total dos dados.
