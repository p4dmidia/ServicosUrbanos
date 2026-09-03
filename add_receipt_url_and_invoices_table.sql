-- ==============================================================================
-- MIGRAÇÃO DE SUPORTE FISCAL E PAGAMENTOS
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Adiciona a coluna receipt_url na tabela transactions (caso ainda não exista)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 2. Cria a tabela oficial de Notas Fiscais dos Afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL,
  amount_gross NUMERIC NOT NULL DEFAULT 0,
  amount_weekly NUMERIC DEFAULT 0,
  amount_monthly NUMERIC DEFAULT 0,
  invoice_number TEXT,
  invoice_link TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilita RLS para segurança
ALTER TABLE public.affiliate_invoices ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso seguro
DROP POLICY IF EXISTS "Afiliados podem ver suas próprias notas" ON public.affiliate_invoices;
CREATE POLICY "Afiliados podem ver suas próprias notas"
ON public.affiliate_invoices FOR SELECT
TO authenticated
USING (auth.uid() = profile_id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'financeiro')
));

DROP POLICY IF EXISTS "Afiliados podem enviar notas" ON public.affiliate_invoices;
CREATE POLICY "Afiliados podem enviar notas"
ON public.affiliate_invoices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'financeiro')
));

DROP POLICY IF EXISTS "Admins podem atualizar notas" ON public.affiliate_invoices;
CREATE POLICY "Admins podem atualizar notas"
ON public.affiliate_invoices FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'financeiro')
));

-- 5. Atualiza o cache do schema no PostgREST
NOTIFY pgrst, 'reload schema';
