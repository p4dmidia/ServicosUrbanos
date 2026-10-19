-- =========================================================================
-- MIGRATION: ETAPA 1 - SEPARAÇÃO COMPLETA DE PRODUTOS
-- Produto A: Microfranqueado (MMN)
-- Produto B: Seguro Vida Light (Afiliado Premium)
-- Versão 1.0 - Alinhamento Jurídico e Modelagem de Dados
--
-- COMO EXECUTAR:
-- 1. Abra o painel do Supabase (https://supabase.com/dashboard)
-- 2. Vá em SQL Editor > New query
-- 3. Cole este script e clique em RUN
-- =========================================================================

-- Função utilitária para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função RPC para execução de comandos administrativos (quando necessário)
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Permitir apenas se usuário autenticado for admin ou owner
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores e donos podem executar comandos SQL.';
    END IF;

    EXECUTE query;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 1. TABELAS DO PRODUTO A: MICROFRANQUEADO (MMN)
-- =========================================================================

-- 1.1 Tabela de Microfranqueados
CREATE TABLE IF NOT EXISTS public.microfranqueados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inadimplente', 'bloqueado', 'cancelado')),
    limit_100_free BOOLEAN DEFAULT FALSE,
    registration_fee_amount NUMERIC NOT NULL DEFAULT 0.00,
    registration_fee_status TEXT NOT NULL DEFAULT 'isento' CHECK (registration_fee_status IN ('isento', 'pendente_dezembro', 'pago', 'atrasado')),
    cobranca_dezembro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_microfranqueados_profile_id ON public.microfranqueados(profile_id);
CREATE INDEX IF NOT EXISTS idx_microfranqueados_status ON public.microfranqueados(status);

DROP TRIGGER IF EXISTS trg_microfranqueados_updated_at ON public.microfranqueados;
CREATE TRIGGER trg_microfranqueados_updated_at
BEFORE UPDATE ON public.microfranqueados
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 1.2 Tabela de Licenças MMN (Validade 12 Meses)
CREATE TABLE IF NOT EXISTS public.licencas_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pendente', 'expirada', 'bloqueada_inadimplente', 'cancelada')),
    validade_meses INTEGER NOT NULL DEFAULT 12,
    data_inicio TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '12 months'),
    valor NUMERIC NOT NULL DEFAULT 0.00,
    gratis_100_primeiros BOOLEAN DEFAULT FALSE,
    cobranca_dezembro BOOLEAN DEFAULT FALSE,
    ano_referencia INTEGER DEFAULT EXTRACT(YEAR FROM now()),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_licencas_mmn_microfranqueado ON public.licencas_mmn(microfranqueado_id);
CREATE INDEX IF NOT EXISTS idx_licencas_mmn_status ON public.licencas_mmn(status);

DROP TRIGGER IF EXISTS trg_licencas_mmn_updated_at ON public.licencas_mmn;
CREATE TRIGGER trg_licencas_mmn_updated_at
BEFORE UPDATE ON public.licencas_mmn
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 1.3 Tabela de Rede MMN (G0, G1, G2)
CREATE TABLE IF NOT EXISTS public.rede_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    indicado_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL CHECK (nivel IN (0, 1, 2)),
    tipo_indicado TEXT NOT NULL DEFAULT 'afiliado_premium' CHECK (tipo_indicado IN ('afiliado_premium', 'microfranqueado')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT rede_mmn_unique_relacao UNIQUE (microfranqueado_id, indicado_profile_id, nivel)
);

CREATE INDEX IF NOT EXISTS idx_rede_mmn_microfranqueado ON public.rede_mmn(microfranqueado_id);
CREATE INDEX IF NOT EXISTS idx_rede_mmn_indicado ON public.rede_mmn(indicado_profile_id);

-- 1.4 Tabela de Comissões MMN (80% Semanal Terça / 20% Anual Dezembro)
CREATE TABLE IF NOT EXISTS public.comissoes_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    origem_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL CHECK (nivel IN (0, 1, 2)),
    valor_venda NUMERIC NOT NULL DEFAULT 0.00,
    percentual_bruto NUMERIC NOT NULL DEFAULT 0.00,
    valor_bruto NUMERIC NOT NULL DEFAULT 0.00,
    valor_semanal_80 NUMERIC NOT NULL DEFAULT 0.00,
    valor_anual_20 NUMERIC NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'liberado_semanal', 'bloqueado_inadimplencia', 'pago_semanal', 'pago_anual', 'cancelado')),
    semana_inicio DATE,
    semana_fim DATE,
    data_prevista_terca DATE,
    data_prevista_dezembro DATE,
    pago_semanal_em TIMESTAMPTZ,
    pago_anual_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comissoes_mmn_microfranqueado ON public.comissoes_mmn(microfranqueado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_mmn_status ON public.comissoes_mmn(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_mmn_order_id ON public.comissoes_mmn(order_id);

-- 1.5 Tabela de Cashback MMN
CREATE TABLE IF NOT EXISTS public.cashback_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    comissao_id UUID REFERENCES public.comissoes_mmn(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('semanal_80', 'anual_20')),
    valor NUMERIC NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'acumulado' CHECK (status IN ('acumulado', 'bloqueado', 'liberado', 'pago', 'zerado_cancelamento')),
    data_liberacao DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cashback_mmn_microfranqueado ON public.cashback_mmn(microfranqueado_id);

-- 1.6 Tabela de Inadimplência MMN
CREATE TABLE IF NOT EXISTS public.inadimplencia_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL DEFAULT 'atraso_taxa_licenciamento',
    saldo_bloqueado NUMERIC NOT NULL DEFAULT 0.00,
    data_bloqueio TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_regularizacao TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'bloqueado' CHECK (status IN ('bloqueado', 'regularizado', 'cancelado_zerado')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inadimplencia_mmn_microfranqueado ON public.inadimplencia_mmn(microfranqueado_id);

-- 1.7 Tabela de Aceites Digitais MMN (Auditoria e Versão)
CREATE TABLE IF NOT EXISTS public.aceites_mmn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microfranqueado_id UUID NOT NULL REFERENCES public.microfranqueados(id) ON DELETE CASCADE,
    tipo_termo TEXT NOT NULL CHECK (tipo_termo IN ('termo_adesao_microfranqueado', 'termo_intermediacao_anexo_xiii')),
    versao_documento TEXT NOT NULL DEFAULT '1.0',
    hash_texto TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    data_hora TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aceites_mmn_microfranqueado ON public.aceites_mmn(microfranqueado_id);


-- =========================================================================
-- 2. TABELAS DO PRODUTO B: SEGURO VIDA LIGHT (AFILIADO PREMIUM)
-- =========================================================================

-- 2.1 Tabela de Segurados
CREATE TABLE IF NOT EXISTS public.segurados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    nome_completo TEXT NOT NULL,
    cpf TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo TEXT NOT NULL CHECK (sexo IN ('M', 'F', 'Outro')),
    email TEXT,
    whatsapp TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inadimplente', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_segurados_profile_id ON public.segurados(profile_id);
CREATE INDEX IF NOT EXISTS idx_segurados_cpf ON public.segurados(cpf);

DROP TRIGGER IF EXISTS trg_segurados_updated_at ON public.segurados;
CREATE TRIGGER trg_segurados_updated_at
BEFORE UPDATE ON public.segurados
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2.2 Tabela de Modalidade de Pagamento do Seguro (Novos Preços Oficiais)
CREATE TABLE IF NOT EXISTS public.modalidade_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE CHECK (codigo IN ('mensal', 'trimestral', 'semestral', 'anual')),
    nome TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    meses_vigencia INTEGER NOT NULL,
    quantidade_sorteios INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO public.modalidade_pagamento (codigo, nome, valor, meses_vigencia, quantidade_sorteios, ativo)
VALUES 
    ('mensal', 'Plano Mensal Premium', 5.00, 1, 4, true),
    ('trimestral', 'Plano Trimestral Premium', 15.00, 3, 12, true),
    ('semestral', 'Plano Semestral Premium', 30.00, 6, 24, true),
    ('anual', 'Plano Anual Premium', 48.00, 12, 48, true)
ON CONFLICT (codigo) DO UPDATE 
SET valor = EXCLUDED.valor,
    meses_vigencia = EXCLUDED.meses_vigencia,
    quantidade_sorteios = EXCLUDED.quantidade_sorteios,
    ativo = EXCLUDED.ativo;

-- 2.3 Tabela de Apólices
CREATE TABLE IF NOT EXISTS public.apolices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segurado_id UUID NOT NULL REFERENCES public.segurados(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    modalidade_codigo TEXT REFERENCES public.modalidade_pagamento(codigo),
    numero_apolice TEXT NOT NULL DEFAULT '11-0982-000058940-0001',
    numero_certificado TEXT,
    seguradora TEXT NOT NULL DEFAULT 'MBM SEGURADORA S/A (CNPJ: 87.883.807/0001-06)',
    capital_segurado NUMERIC NOT NULL DEFAULT 5000.00,
    premio_pago NUMERIC NOT NULL DEFAULT 0.00,
    vigencia_inicio TIMESTAMPTZ DEFAULT now() NOT NULL,
    vigencia_fim TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa_inadimplencia', 'cancelada', 'expirada')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_apolices_segurado_id ON public.apolices(segurado_id);
CREATE INDEX IF NOT EXISTS idx_apolices_profile_id ON public.apolices(profile_id);
CREATE INDEX IF NOT EXISTS idx_apolices_status ON public.apolices(status);

DROP TRIGGER IF EXISTS trg_apolices_updated_at ON public.apolices;
CREATE TRIGGER trg_apolices_updated_at
BEFORE UPDATE ON public.apolices
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2.4 Tabela de Números da Sorte
CREATE TABLE IF NOT EXISTS public.numeros_da_sorte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segurado_id UUID NOT NULL REFERENCES public.segurados(id) ON DELETE CASCADE,
    apolice_id UUID NOT NULL REFERENCES public.apolices(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    serie TEXT DEFAULT '001',
    mes_ano TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'premiado')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_numeros_da_sorte_segurado ON public.numeros_da_sorte(segurado_id);
CREATE INDEX IF NOT EXISTS idx_numeros_da_sorte_numero ON public.numeros_da_sorte(numero);

-- 2.5 Tabela de Sorteios da Loteria Federal (4 últimos domingos)
CREATE TABLE IF NOT EXISTS public.sorteios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_sorteio DATE NOT NULL,
    mes_ano TEXT NOT NULL,
    domingo_ordem INTEGER NOT NULL,
    numero_sorteado TEXT,
    segurado_ganhador_id UUID REFERENCES public.segurados(id) ON DELETE SET NULL,
    apolice_ganhadora_id UUID REFERENCES public.apolices(id) ON DELETE SET NULL,
    numero_sorte_ganhador TEXT,
    valor_premio_bruto NUMERIC DEFAULT 5000.00,
    valor_premio_liquido NUMERIC DEFAULT 3750.00,
    status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'apurado', 'pago', 'cancelado')),
    auditoria_loteria_federal TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sorteios_data ON public.sorteios(data_sorteio);

-- 2.6 Tabela de Acesso à Telemedicina
CREATE TABLE IF NOT EXISTS public.telemedicina_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segurado_id UUID NOT NULL REFERENCES public.segurados(id) ON DELETE CASCADE UNIQUE,
    apolice_id UUID NOT NULL REFERENCES public.apolices(id) ON DELETE CASCADE,
    provedor TEXT NOT NULL DEFAULT 'Racca Saúde',
    url_acesso TEXT NOT NULL DEFAULT 'https://raccasaude.com.br/parceiro/servicos-urbanos',
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso_inadimplencia', 'revogado')),
    data_ativacao TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_suspensao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemedicina_segurado ON public.telemedicina_acesso(segurado_id);

DROP TRIGGER IF EXISTS trg_telemedicina_updated_at ON public.telemedicina_acesso;
CREATE TRIGGER trg_telemedicina_updated_at
BEFORE UPDATE ON public.telemedicina_acesso
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2.7 Tabela de Sinistros
CREATE TABLE IF NOT EXISTS public.sinistros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segurado_id UUID NOT NULL REFERENCES public.segurados(id) ON DELETE CASCADE,
    apolice_id UUID NOT NULL REFERENCES public.apolices(id) ON DELETE CASCADE,
    tipo_sinistro TEXT NOT NULL CHECK (tipo_sinistro IN ('morte_acidental', 'invalidez_permanente_total', 'invalidez_permanente_parcial')),
    data_ocorrencia DATE NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'documentos_pendentes', 'aprovado', 'rejeitado', 'indenizado')),
    valor_solicitado NUMERIC DEFAULT 5000.00,
    valor_indenizado NUMERIC,
    observacoes_analise TEXT,
    data_abertura TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sinistros_segurado ON public.sinistros(segurado_id);
CREATE INDEX IF NOT EXISTS idx_sinistros_status ON public.sinistros(status);

DROP TRIGGER IF EXISTS trg_sinistros_updated_at ON public.sinistros;
CREATE TRIGGER trg_sinistros_updated_at
BEFORE UPDATE ON public.sinistros
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2.8 Tabela de Documentos de Sinistro
CREATE TABLE IF NOT EXISTS public.documentos_sinistro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sinistro_id UUID NOT NULL REFERENCES public.sinistros(id) ON DELETE CASCADE,
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('certidao_obito', 'laudo_medico', 'boletim_ocorrencia', 'documento_identificacao', 'comprovante_residencia', 'declaracao_herdeiros', 'outro')),
    arquivo_url TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'em_analise', 'aprovado', 'rejeitado')),
    motivo_rejeicao TEXT,
    enviado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
    avaliado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documentos_sinistro_sinistro ON public.documentos_sinistro(sinistro_id);

-- 2.9 Tabela de Aceites Digitais do Seguro (Auditoria e Versão)
CREATE TABLE IF NOT EXISTS public.aceites_seguro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segurado_id UUID NOT NULL REFERENCES public.segurados(id) ON DELETE CASCADE,
    versao_termo TEXT NOT NULL DEFAULT '1.0',
    hash_texto TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    data_hora TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aceites_seguro_segurado ON public.aceites_seguro(segurado_id);


-- =========================================================================
-- 3. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- =========================================================================

ALTER TABLE public.microfranqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas_mmn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rede_mmn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_mmn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_mmn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencia_mmn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aceites_mmn ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.segurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modalidade_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apolices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_da_sorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemedicina_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_sinistro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aceites_seguro ENABLE ROW LEVEL SECURITY;

-- 3.1 Políticas Públicas e Gerais
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Modalidade pagamento visivel para todos" ON public.modalidade_pagamento;
    CREATE POLICY "Modalidade pagamento visivel para todos" ON public.modalidade_pagamento FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Sorteios visiveis para todos autenticados" ON public.sorteios;
    CREATE POLICY "Sorteios visiveis para todos autenticados" ON public.sorteios FOR SELECT USING (auth.role() = 'authenticated');
END $$;

-- 3.2 Políticas do Microfranqueado (Apenas o próprio usuário ou Admin/Owner)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Microfranqueado ve seu proprio registro" ON public.microfranqueados;
    CREATE POLICY "Microfranqueado ve seu proprio registro" ON public.microfranqueados 
    FOR ALL USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

    DROP POLICY IF EXISTS "Microfranqueado ve suas licencas" ON public.licencas_mmn;
    CREATE POLICY "Microfranqueado ve suas licencas" ON public.licencas_mmn 
    FOR ALL USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

    DROP POLICY IF EXISTS "Microfranqueado ve sua rede" ON public.rede_mmn;
    CREATE POLICY "Microfranqueado ve sua rede" ON public.rede_mmn 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.microfranqueados m WHERE m.id = microfranqueado_id AND m.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Microfranqueado ve suas comissoes" ON public.comissoes_mmn;
    CREATE POLICY "Microfranqueado ve suas comissoes" ON public.comissoes_mmn 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.microfranqueados m WHERE m.id = microfranqueado_id AND m.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Microfranqueado ve seu cashback" ON public.cashback_mmn;
    CREATE POLICY "Microfranqueado ve seu cashback" ON public.cashback_mmn 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.microfranqueados m WHERE m.id = microfranqueado_id AND m.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Microfranqueado ve sua inadimplencia" ON public.inadimplencia_mmn;
    CREATE POLICY "Microfranqueado ve sua inadimplencia" ON public.inadimplencia_mmn 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.microfranqueados m WHERE m.id = microfranqueado_id AND m.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Microfranqueado ve seus aceites" ON public.aceites_mmn;
    CREATE POLICY "Microfranqueado ve seus aceites" ON public.aceites_mmn 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.microfranqueados m WHERE m.id = microfranqueado_id AND m.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );
END $$;

-- 3.3 Políticas do Segurado Premium (Apenas o próprio titular ou Admin/Owner)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Segurado ve seus dados" ON public.segurados;
    CREATE POLICY "Segurado ve seus dados" ON public.segurados 
    FOR ALL USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

    DROP POLICY IF EXISTS "Segurado ve suas apolices" ON public.apolices;
    CREATE POLICY "Segurado ve suas apolices" ON public.apolices 
    FOR ALL USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

    DROP POLICY IF EXISTS "Segurado ve seus numeros da sorte" ON public.numeros_da_sorte;
    CREATE POLICY "Segurado ve seus numeros da sorte" ON public.numeros_da_sorte 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.segurados s WHERE s.id = segurado_id AND s.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Segurado ve telemedicina" ON public.telemedicina_acesso;
    CREATE POLICY "Segurado ve telemedicina" ON public.telemedicina_acesso 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.segurados s WHERE s.id = segurado_id AND s.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Segurado ve seus sinistros" ON public.sinistros;
    CREATE POLICY "Segurado ve seus sinistros" ON public.sinistros 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.segurados s WHERE s.id = segurado_id AND s.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Segurado ve seus documentos de sinistro" ON public.documentos_sinistro;
    CREATE POLICY "Segurado ve seus documentos de sinistro" ON public.documentos_sinistro 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sinistros sin 
            JOIN public.segurados s ON s.id = sin.segurado_id
            WHERE sin.id = sinistro_id AND s.profile_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

    DROP POLICY IF EXISTS "Segurado ve seus aceites" ON public.aceites_seguro;
    CREATE POLICY "Segurado ve seus aceites" ON public.aceites_seguro 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.segurados s WHERE s.id = segurado_id AND s.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );
END $$;
