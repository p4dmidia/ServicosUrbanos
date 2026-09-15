-- ==============================================================================
-- MIGRAÇÃO: SOLICITAÇÃO DE MIGRAÇÃO PARA PJ (PESSOA JURÍDICA)
-- ==============================================================================

-- Adicionar coluna person_type em profiles se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'PF';

CREATE TABLE IF NOT EXISTS public.pj_migration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cnpj TEXT NOT NULL,
    company_name TEXT NOT NULL,
    trade_name TEXT,
    pix_type TEXT DEFAULT 'CNPJ',
    pix_key TEXT,
    document_url TEXT,
    notes TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_pj_migration_requests_user ON public.pj_migration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pj_migration_requests_status ON public.pj_migration_requests(status);

-- Habilitar RLS
ALTER TABLE public.pj_migration_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar suas próprias solicitações
DROP POLICY IF EXISTS "Users can view own pj requests" ON public.pj_migration_requests;
CREATE POLICY "Users can view own pj requests" ON public.pj_migration_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem cadastrar sua própria solicitação
DROP POLICY IF EXISTS "Users can insert own pj requests" ON public.pj_migration_requests;
CREATE POLICY "Users can insert own pj requests" ON public.pj_migration_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Administradores e gerentes podem visualizar todas as solicitações
DROP POLICY IF EXISTS "Admins can view all pj requests" ON public.pj_migration_requests;
CREATE POLICY "Admins can view all pj requests" ON public.pj_migration_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner', 'manager')
        )
    );

-- Administradores e gerentes podem atualizar (aprovar/recusar) solicitações
DROP POLICY IF EXISTS "Admins can update all pj requests" ON public.pj_migration_requests;
CREATE POLICY "Admins can update all pj requests" ON public.pj_migration_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner', 'manager')
        )
    );
