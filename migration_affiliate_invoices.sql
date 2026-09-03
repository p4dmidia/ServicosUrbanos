-- Migração para criação da tabela de Notas Fiscais dos Afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL, -- Ex: '2026-09'
    amount_gross NUMERIC NOT NULL,
    invoice_number TEXT,
    invoice_link TEXT,
    file_url TEXT,
    notes TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.affiliate_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access to affiliate_invoices" ON public.affiliate_invoices
    FOR ALL USING (true) WITH CHECK (true);
