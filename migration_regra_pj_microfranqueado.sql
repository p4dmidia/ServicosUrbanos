-- =========================================================================
-- MIGRATION: REGRA DE TRANSIÇÃO PF / PJ PARA AFILIADO PREMIUM E MICROFRANQUEADO
-- Regra 1: Afiliado Premium é SEMPRE Pessoa Física (PF com CPF).
-- Regra 2: Microfranqueado começa como Pessoa Física (PF com CPF).
-- Regra 3: Ao atingir comissões acumuladas >= R$ 5.000,00, a migração para PJ torna-se obrigatória.
-- =========================================================================

-- 1. Colunas na tabela microfranqueados
ALTER TABLE public.microfranqueados
ADD COLUMN IF NOT EXISTS is_pj_obrigatorio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_migracao_pj TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20),
ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255),
ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255);

-- 2. Garantir coluna person_type na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS person_type VARCHAR(10) DEFAULT 'PF';

-- 3. Trigger de Garantia: Segurado (Afiliado Premium) é SEMPRE Pessoa Física (PF)
CREATE OR REPLACE FUNCTION public.fn_garantir_segurado_pf()
RETURNS TRIGGER AS $$
BEGIN
    -- O Segurado individual do Seguro Vida Light da MBM deve ter CPF obrigatório
    IF NEW.cpf IS NULL OR LENGTH(REGEXP_REPLACE(NEW.cpf, '\D', '', 'g')) != 11 THEN
        RAISE EXCEPTION 'O Segurado (Afiliado Premium) deve ser obrigatoriamente Pessoa Física com CPF válido de 11 dígitos.';
    END IF;

    -- Atualiza profile para garantir PF
    UPDATE public.profiles
    SET person_type = 'PF'
    WHERE id = NEW.profile_id AND (person_type IS NULL OR person_type != 'PF');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_garantir_segurado_pf ON public.segurados;
CREATE TRIGGER trigger_garantir_segurado_pf
BEFORE INSERT OR UPDATE ON public.segurados
FOR EACH ROW
EXECUTE FUNCTION public.fn_garantir_segurado_pf();

-- 4. Função e Trigger para Monitorar Limite de R$ 5.000,00 no Microfranqueado
CREATE OR REPLACE FUNCTION public.fn_verificar_limite_pj_microfranqueado()
RETURNS TRIGGER AS $$
DECLARE
    v_total_bruto NUMERIC(12,2) := 0;
    v_profile_id UUID;
    v_person_type VARCHAR(10);
BEGIN
    -- Obter o profile_id e person_type do microfranqueado
    SELECT mf.profile_id, p.person_type
    INTO v_profile_id, v_person_type
    FROM public.microfranqueados mf
    JOIN public.profiles p ON p.id = mf.profile_id
    WHERE mf.id = NEW.microfranqueado_id;

    -- Calcular soma total de comissões brutas acumuladas
    SELECT COALESCE(SUM(valor_bruto), 0)
    INTO v_total_bruto
    FROM public.comissoes_mmn
    WHERE microfranqueado_id = NEW.microfranqueado_id
      AND status != 'cancelado';

    -- Se atingiu R$ 5.000,00 ou mais e ainda não migrou para PJ
    IF v_total_bruto >= 5000.00 AND (v_person_type IS NULL OR v_person_type = 'PF') THEN
        UPDATE public.microfranqueados
        SET is_pj_obrigatorio = TRUE
        WHERE id = NEW.microfranqueado_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verificar_limite_pj_microfranqueado ON public.comissoes_mmn;
CREATE TRIGGER trigger_verificar_limite_pj_microfranqueado
AFTER INSERT OR UPDATE ON public.comissoes_mmn
FOR EACH ROW
EXECUTE FUNCTION public.fn_verificar_limite_pj_microfranqueado();

-- 5. RPC: Migração Transacional do Microfranqueado para Pessoa Jurídica (PJ)
CREATE OR REPLACE FUNCTION public.fn_migrar_microfranqueado_pj(
    p_user_id UUID,
    p_cnpj VARCHAR,
    p_razao_social VARCHAR,
    p_nome_fantasia VARCHAR DEFAULT NULL,
    p_pix_key VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_clean_cnpj VARCHAR(14);
    v_mf_id UUID;
BEGIN
    -- Limpar dígitos do CNPJ
    v_clean_cnpj := REGEXP_REPLACE(p_cnpj, '\D', '', 'g');

    IF LENGTH(v_clean_cnpj) != 14 THEN
        RETURN jsonb_build_object('success', false, 'error', 'CNPJ inválido. Informe os 14 dígitos numéricos.');
    END IF;

    IF p_razao_social IS NULL OR LENGTH(TRIM(p_razao_social)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A Razão Social é obrigatória.');
    END IF;

    -- Verificar se o usuário é Microfranqueado
    SELECT id INTO v_mf_id
    FROM public.microfranqueados
    WHERE profile_id = p_user_id;

    IF v_mf_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registro de Microfranqueado não encontrado para este usuário.');
    END IF;

    -- 1. Atualizar profiles para PJ
    UPDATE public.profiles
    SET person_type = 'PJ',
        cnpj = v_clean_cnpj,
        store_name = TRIM(p_razao_social),
        pix_key = COALESCE(p_pix_key, pix_key),
        pix_type = 'cnpj',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 2. Atualizar microfranqueados
    UPDATE public.microfranqueados
    SET cnpj = v_clean_cnpj,
        razao_social = TRIM(p_razao_social),
        nome_fantasia = COALESCE(TRIM(p_nome_fantasia), TRIM(p_razao_social)),
        data_migracao_pj = NOW(),
        is_pj_obrigatorio = FALSE, -- Regularizado!
        updated_at = NOW()
    WHERE id = v_mf_id;

    -- 3. Registrar ou atualizar na tabela de migrações pj_migration_requests
    INSERT INTO public.pj_migration_requests (
        user_id,
        cnpj,
        company_name,
        trade_name,
        pix_type,
        pix_key,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_clean_cnpj,
        TRIM(p_razao_social),
        COALESCE(TRIM(p_nome_fantasia), TRIM(p_razao_social)),
        'CNPJ',
        COALESCE(p_pix_key, v_clean_cnpj),
        'approved',
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Migração para Pessoa Jurídica (PJ) concluída com sucesso. Limite liberado para repasses!',
        'cnpj', v_clean_cnpj,
        'razao_social', TRIM(p_razao_social)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_migrar_microfranqueado_pj(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_migrar_microfranqueado_pj(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_migrar_microfranqueado_pj(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO service_role;

