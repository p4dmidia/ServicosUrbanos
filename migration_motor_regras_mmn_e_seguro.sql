-- =========================================================================
-- MIGRATION: ETAPA 2 - MOTOR DE REGRAS DE NEGÓCIO E COMISSIONAMENTO OFICIAL
-- Alinhamento com a Nova Tabela Oficial Ganha & Ganha (33% Total):
--   G0 (Microfranqueado Direto): 21% Semanal (Terça) + 2% Anual (10/Dez) = 23% Total
--   G1 (Upline Nível 1): 3% Semanal (Terça) + 2% Anual (10/Dez) = 5% Total
--   G2 (Upline Nível 2): 3% Semanal (Terça) + 2% Anual (10/Dez) = 5% Total
--   Total: 27% Semanal + 6% Anual = 33% Total Geral
--
-- Regras Fundamentais:
-- 1. APENAS MICROFRANQUEADOS RECEBEM COMISSÃO DE REDE.
-- 2. AFILIADO PREMIUM NÃO TEM MMN, NÃO TEM CASHBACK E NÃO TEM COMISSÃO.
-- 3. SE O MICROFRANQUEADO ESTIVER INADIMPLENTE COM A LICENÇA, AS COMISSÕES
--    ACUMULAM COM STATUS 'bloqueado_inadimplencia' E SÓ SÃO LIBERADAS APÓS QUITAÇÃO.
-- 4. ATIVAÇÃO AUTOMÁTICA DE APÓLICE, NÚMERO DA SORTE E TELEMEDICINA NO SEGURO.
--
-- COMO EXECUTAR:
-- 1. Abra o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Vá em SQL Editor > New query
-- 3. Cole este script e clique em RUN
-- =========================================================================

-- =========================================================================
-- 1. FUNÇÕES AUXILIARES DE CÁLCULO DE CICLOS (TERÇA-FEIRA E DEZEMBRO)
-- =========================================================================

-- 1.1 Obter data da próxima terça-feira (referente às vendas de segunda a sábado anteriores)
CREATE OR REPLACE FUNCTION public.calcular_terca_pagamento(data_venda DATE)
RETURNS DATE AS $$
DECLARE
    v_segunda DATE;
    v_terca DATE;
BEGIN
    -- Obter a segunda-feira da semana da venda
    v_segunda := (date_trunc('week', data_venda::timestamp))::date;
    -- A terça-feira de pagamento é a terça da semana SEGUINTE (+8 dias da segunda da venda)
    v_terca := v_segunda + 8;
    RETURN v_terca;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1.2 Obter data do bônus anual (10 de dezembro do ciclo vigente)
CREATE OR REPLACE FUNCTION public.calcular_dezembro_anual(data_venda DATE)
RETURNS DATE AS $$
DECLARE
    v_ano INTEGER;
    v_dezembro DATE;
BEGIN
    v_ano := EXTRACT(YEAR FROM data_venda);
    
    -- O ciclo inicial vai de 01/11/2025 a 30/11/2026, com pagamento em 10/12/2026
    IF v_ano <= 2025 THEN
        RETURN '2026-12-10'::date;
    END IF;

    -- Se a venda ocorreu após 30/11 do ano corrente (em dezembro), entra no ciclo do ano seguinte
    IF data_venda > (v_ano || '-11-30')::date THEN
        v_dezembro := ((v_ano + 1) || '-12-10')::date;
    ELSE
        v_dezembro := (v_ano || '-12-10')::date;
    END IF;
    
    RETURN v_dezembro;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- =========================================================================
-- 2. TRIGGER PRINCIPAL DE PROCESSAMENTO DE PEDIDOS: handle_order_payment()
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    -- Variáveis de Seguro
    item JSONB;
    v_plan_type TEXT;
    v_price NUMERIC;
    v_days INTEGER;
    v_start_date TIMESTAMPTZ := now();
    v_end_date TIMESTAMPTZ;
    v_segurado_id UUID;
    v_apolice_id UUID;
    v_lucky_number TEXT;
    v_cert_num TEXT;
    
    -- Variáveis de Microfranqueado e Comissões MMN
    v_vendedor_profile_id UUID;
    v_microfranqueado_id UUID;
    v_mf_status TEXT;
    v_licenca_status TEXT;
    
    -- Uplines G1 e G2
    v_upline1_profile_id UUID;
    v_upline1_mf_id UUID;
    v_upline1_licenca_status TEXT;
    
    v_upline2_profile_id UUID;
    v_upline2_mf_id UUID;
    v_upline2_licenca_status TEXT;
    
    -- Valores e Splits
    v_amount NUMERIC := NEW.amount;
    v_bruto_g0 NUMERIC;
    v_semanal_g0 NUMERIC;
    v_anual_g0 NUMERIC;
    
    v_bruto_g1 NUMERIC;
    v_semanal_g1 NUMERIC;
    v_anual_g1 NUMERIC;
    
    v_bruto_g2 NUMERIC;
    v_semanal_g2 NUMERIC;
    v_anual_g2 NUMERIC;
    
    -- Datas de Operação
    v_data_venda DATE := (NEW.order_date)::date;
    v_semana_inicio DATE;
    v_semana_fim DATE;
    v_data_terca DATE;
    v_data_dezembro DATE;
    v_status_comissao TEXT;
    v_comissao_id UUID;
BEGIN
    -- [CONDIÇÃO DE DISPARO]
    -- Executa apenas quando o status transita para Pago ou Concluído
    IF (
        (NEW.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- [TRAVA CONTRA DUPLICIDADE]
        IF EXISTS (
            SELECT 1 FROM public.comissoes_mmn WHERE order_id = NEW.id
        ) OR EXISTS (
            SELECT 1 FROM public.transactions WHERE order_id = NEW.id AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- Calcular datas de referência do ciclo
        v_semana_inicio := (date_trunc('week', v_data_venda::timestamp))::date;
        v_semana_fim := v_semana_inicio + 5; -- Segunda a Sábado
        v_data_terca := public.calcular_terca_pagamento(v_data_venda);
        v_data_dezembro := public.calcular_dezembro_anual(v_data_venda);

        -- =================================================================
        -- A. PROCESSAR PRODUTO B: SEGURO VIDA LIGHT (AFILIADO PREMIUM)
        -- =================================================================
        IF NEW.items IS NOT NULL THEN
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
                -- Verifica se o item é um plano de seguro
                IF (item->>'is_subscription') = 'true' OR (item->>'plan_type') IS NOT NULL THEN
                    v_plan_type := LOWER(COALESCE(item->>'plan_type', 'mensal'));
                    v_price := (item->>'price')::numeric;
                    
                    v_days := 30;
                    IF v_plan_type = 'trimestral' THEN
                        v_days := 90;
                    ELSIF v_plan_type = 'semestral' THEN
                        v_days := 180;
                    ELSIF v_plan_type = 'anual' THEN
                        v_days := 365;
                    END IF;
                    v_end_date := v_start_date + (v_days || ' days')::interval;

                    -- 1. Criar ou Obter Segurado
                    INSERT INTO public.segurados (
                        profile_id,
                        nome_completo,
                        cpf,
                        data_nascimento,
                        sexo,
                        email,
                        whatsapp,
                        status
                    )
                    SELECT 
                        p.id,
                        COALESCE(p.full_name, 'Segurado Oficial'),
                        COALESCE(p.cpf, '00000000000'),
                        COALESCE(p.birth_date, '1990-01-01'::date),
                        COALESCE(p.gender, 'Outro'),
                        p.email,
                        p.whatsapp,
                        'ativo'
                    FROM public.profiles p
                    WHERE p.id = NEW.customer_id
                    ON CONFLICT (profile_id) DO UPDATE
                    SET status = 'ativo',
                        updated_at = now()
                    RETURNING id INTO v_segurado_id;

                    -- 2. Desativar Apólices Anteriores e Inserir Nova Apólice
                    UPDATE public.apolices 
                    SET status = 'expirada', updated_at = now() 
                    WHERE segurado_id = v_segurado_id AND status = 'ativa';

                    v_cert_num := 'MBM-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));

                    INSERT INTO public.apolices (
                        segurado_id,
                        profile_id,
                        order_id,
                        modalidade_codigo,
                        numero_apolice,
                        numero_certificado,
                        capital_segurado,
                        premio_pago,
                        vigencia_inicio,
                        vigencia_fim,
                        status
                    ) VALUES (
                        v_segurado_id,
                        NEW.customer_id,
                        NEW.id,
                        v_plan_type,
                        '11-0982-000058940-0001',
                        v_cert_num,
                        5000.00,
                        v_price,
                        v_start_date,
                        v_end_date,
                        'ativa'
                    ) RETURNING id INTO v_apolice_id;

                    -- 3. Gerar Número da Sorte Oficial da Loteria Federal
                    v_lucky_number := LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0');

                    INSERT INTO public.numeros_da_sorte (
                        segurado_id,
                        apolice_id,
                        numero,
                        serie,
                        mes_ano,
                        status
                    ) VALUES (
                        v_segurado_id,
                        v_apolice_id,
                        v_lucky_number,
                        '001',
                        TO_CHAR(now(), 'YYYY-MM'),
                        'ativo'
                    );

                    -- 4. Ativar Acesso à Telemedicina
                    INSERT INTO public.telemedicina_acesso (
                        segurado_id,
                        apolice_id,
                        status,
                        data_ativacao,
                        data_suspensao
                    ) VALUES (
                        v_segurado_id,
                        v_apolice_id,
                        'ativo',
                        now(),
                        NULL
                    ) ON CONFLICT (segurado_id) DO UPDATE
                    SET apolice_id = EXCLUDED.apolice_id,
                        status = 'ativo',
                        data_ativacao = now(),
                        data_suspensao = NULL,
                        updated_at = now();

                    -- 5. Compatibilidade com tabela legada subscriptions
                    UPDATE public.subscriptions 
                    SET status = 'inactive'
                    WHERE profile_id = NEW.customer_id;

                    INSERT INTO public.subscriptions (
                        profile_id, 
                        plan_type, 
                        amount, 
                        status, 
                        start_date, 
                        end_date
                    ) VALUES (
                        NEW.customer_id, 
                        v_plan_type, 
                        v_price, 
                        'active', 
                        v_start_date, 
                        v_end_date
                    );
                END IF;
            END LOOP;
        END IF;

        -- =================================================================
        -- B. DISTRIBUIÇÃO DE COMISSÕES DE REDE (EXCLUSIVA PARA MICROFRANQUEADOS)
        -- Alíquotas: G0 = 27% | G1 = 3% | G2 = 3% (Total = 33% Bruto)
        -- Split: 80% Pago na Terça-feira / 20% Pago em 10 de Dezembro
        -- =================================================================

        -- 1. IDENTIFICAR O VENDEDOR DIRETO (G0)
        -- Verifica se a compra possui um indicador (referred_by) ou se o próprio comprador é o franqueado
        SELECT referred_by INTO v_vendedor_profile_id FROM public.profiles WHERE id = NEW.customer_id;
        
        -- Se o próprio comprador for um microfranqueado e não tiver patrocinador na venda, ele é o G0
        IF v_vendedor_profile_id IS NULL THEN
            IF EXISTS (SELECT 1 FROM public.microfranqueados WHERE profile_id = NEW.customer_id) THEN
                v_vendedor_profile_id := NEW.customer_id;
            END IF;
        END IF;

        -- Processar comissão G0 caso o vendedor direto seja um Microfranqueado
        IF v_vendedor_profile_id IS NOT NULL THEN
            SELECT m.id, m.status, COALESCE(l.status, 'expirada')
            INTO v_microfranqueado_id, v_mf_status, v_licenca_status
            FROM public.microfranqueados m
            LEFT JOIN public.licencas_mmn l ON l.microfranqueado_id = m.id AND l.status = 'ativa' AND l.data_fim >= now()
            WHERE m.profile_id = v_vendedor_profile_id
            LIMIT 1;

            -- APENAS SE FOR MICROFRANQUEADO (Afiliados comuns NÃO recebem comissão)
            IF v_microfranqueado_id IS NOT NULL THEN
                v_semanal_g0 := ROUND(v_amount * 0.21, 2); -- 21% Semanal
                v_anual_g0   := ROUND(v_amount * 0.02, 2); -- 2% Anual
                v_bruto_g0   := v_semanal_g0 + v_anual_g0; -- 23% Total

                -- Se a licença estiver ativa, libera normal; se estiver em atraso, bloqueia por inadimplência
                IF v_licenca_status = 'ativa' AND v_mf_status = 'ativo' THEN
                    v_status_comissao := 'pendente';
                ELSE
                    v_status_comissao := 'bloqueado_inadimplencia';
                    -- Registra lançamento na tabela de inadimplência
                    INSERT INTO public.inadimplencia_mmn (
                        microfranqueado_id, motivo, saldo_bloqueado, status
                    ) VALUES (
                        v_microfranqueado_id, 'Licença MMN em atraso na venda #' || NEW.id, v_bruto_g0, 'bloqueado'
                    );
                END IF;

                -- Inserir Comissão G0
                INSERT INTO public.comissoes_mmn (
                    order_id,
                    microfranqueado_id,
                    origem_profile_id,
                    nivel,
                    valor_venda,
                    percentual_bruto,
                    valor_bruto,
                    valor_semanal_80,
                    valor_anual_20,
                    status,
                    semana_inicio,
                    semana_fim,
                    data_prevista_terca,
                    data_prevista_dezembro
                ) VALUES (
                    NEW.id,
                    v_microfranqueado_id,
                    NEW.customer_id,
                    0,
                    v_amount,
                    23.00,
                    v_bruto_g0,
                    v_semanal_g0,
                    v_anual_g0,
                    v_status_comissao,
                    v_semana_inicio,
                    v_semana_fim,
                    v_data_terca,
                    v_data_dezembro
                ) RETURNING id INTO v_comissao_id;

                -- Inserir Cashback Granular MMN
                INSERT INTO public.cashback_mmn (
                    microfranqueado_id, comissao_id, tipo, valor, status, data_liberacao
                ) VALUES 
                (v_microfranqueado_id, v_comissao_id, 'semanal_80', v_semanal_g0, CASE WHEN v_status_comissao = 'pendente' THEN 'liberado' ELSE 'bloqueado' END, v_data_terca),
                (v_microfranqueado_id, v_comissao_id, 'anual_20', v_anual_g0, 'acumulado', v_data_dezembro);

                -- Transações financeiras para relatórios consolidados
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_vendedor_profile_id, 'commission', 'Comissão Semanal G0 (21%) - Terça ' || TO_CHAR(v_data_terca, 'DD/MM') || ' - Pedido #' || NEW.id, v_semanal_g0, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id),
                (v_vendedor_profile_id, 'commission', 'Comissão Anual G0 (2%) - Dezembro - Pedido #' || NEW.id, v_anual_g0, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id);

                -- 2. IDENTIFICAR O UPLINE NÍVEL 1 (G1 = 3% SEMANAL / 2% ANUAL)
                SELECT referred_by INTO v_upline1_profile_id FROM public.profiles WHERE id = v_vendedor_profile_id;
                
                IF v_upline1_profile_id IS NOT NULL THEN
                    SELECT m.id, COALESCE(l.status, 'expirada')
                    INTO v_upline1_mf_id, v_upline1_licenca_status
                    FROM public.microfranqueados m
                    LEFT JOIN public.licencas_mmn l ON l.microfranqueado_id = m.id AND l.status = 'ativa' AND l.data_fim >= now()
                    WHERE m.profile_id = v_upline1_profile_id
                    LIMIT 1;

                    -- Apenas comissiona se Upline 1 for Microfranqueado
                    IF v_upline1_mf_id IS NOT NULL THEN
                        v_semanal_g1 := ROUND(v_amount * 0.03, 2); -- 3% Semanal
                        v_anual_g1   := ROUND(v_amount * 0.02, 2); -- 2% Anual
                        v_bruto_g1   := v_semanal_g1 + v_anual_g1; -- 5% Total

                        IF v_upline1_licenca_status = 'ativa' THEN
                            v_status_comissao := 'pendente';
                        ELSE
                            v_status_comissao := 'bloqueado_inadimplencia';
                        END IF;

                        INSERT INTO public.comissoes_mmn (
                            order_id, microfranqueado_id, origem_profile_id, nivel, valor_venda, percentual_bruto,
                            valor_bruto, valor_semanal_80, valor_anual_20, status, semana_inicio, semana_fim,
                            data_prevista_terca, data_prevista_dezembro
                        ) VALUES (
                            NEW.id, v_upline1_mf_id, NEW.customer_id, 1, v_amount, 5.00,
                            v_bruto_g1, v_semanal_g1, v_anual_g1, v_status_comissao, v_semana_inicio, v_semana_fim,
                            v_data_terca, v_data_dezembro
                        ) RETURNING id INTO v_comissao_id;

                        INSERT INTO public.cashback_mmn (
                            microfranqueado_id, comissao_id, tipo, valor, status, data_liberacao
                        ) VALUES 
                        (v_upline1_mf_id, v_comissao_id, 'semanal_80', v_semanal_g1, CASE WHEN v_status_comissao = 'pendente' THEN 'liberado' ELSE 'bloqueado' END, v_data_terca),
                        (v_upline1_mf_id, v_comissao_id, 'anual_20', v_anual_g1, 'acumulado', v_data_dezembro);

                        INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                        VALUES 
                        (v_upline1_profile_id, 'commission', 'Comissão Semanal G1 (3%) - Terça ' || TO_CHAR(v_data_terca, 'DD/MM') || ' - Pedido #' || NEW.id, v_semanal_g1, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id),
                        (v_upline1_profile_id, 'commission', 'Comissão Anual G1 (2%) - Dezembro - Pedido #' || NEW.id, v_anual_g1, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id);

                        -- 3. IDENTIFICAR O UPLINE NÍVEL 2 (G2 = 3% SEMANAL / 2% ANUAL)
                        SELECT referred_by INTO v_upline2_profile_id FROM public.profiles WHERE id = v_upline1_profile_id;
                        
                        IF v_upline2_profile_id IS NOT NULL THEN
                            SELECT m.id, COALESCE(l.status, 'expirada')
                            INTO v_upline2_mf_id, v_upline2_licenca_status
                            FROM public.microfranqueados m
                            LEFT JOIN public.licencas_mmn l ON l.microfranqueado_id = m.id AND l.status = 'ativa' AND l.data_fim >= now()
                            WHERE m.profile_id = v_upline2_profile_id
                            LIMIT 1;

                            IF v_upline2_mf_id IS NOT NULL THEN
                                v_semanal_g2 := ROUND(v_amount * 0.03, 2); -- 3% Semanal
                                v_anual_g2   := ROUND(v_amount * 0.02, 2); -- 2% Anual
                                v_bruto_g2   := v_semanal_g2 + v_anual_g2; -- 5% Total

                                IF v_upline2_licenca_status = 'ativa' THEN
                                    v_status_comissao := 'pendente';
                                ELSE
                                    v_status_comissao := 'bloqueado_inadimplencia';
                                END IF;

                                INSERT INTO public.comissoes_mmn (
                                    order_id, microfranqueado_id, origem_profile_id, nivel, valor_venda, percentual_bruto,
                                    valor_bruto, valor_semanal_80, valor_anual_20, status, semana_inicio, semana_fim,
                                    data_prevista_terca, data_prevista_dezembro
                                ) VALUES (
                                    NEW.id, v_upline2_mf_id, NEW.customer_id, 2, v_amount, 5.00,
                                    v_bruto_g2, v_semanal_g2, v_anual_g2, v_status_comissao, v_semana_inicio, v_semana_fim,
                                    v_data_terca, v_data_dezembro
                                ) RETURNING id INTO v_comissao_id;

                                INSERT INTO public.cashback_mmn (
                                    microfranqueado_id, comissao_id, tipo, valor, status, data_liberacao
                                ) VALUES 
                                (v_upline2_mf_id, v_comissao_id, 'semanal_80', v_semanal_g2, CASE WHEN v_status_comissao = 'pendente' THEN 'liberado' ELSE 'bloqueado' END, v_data_terca),
                                (v_upline2_mf_id, v_comissao_id, 'anual_20', v_anual_g2, 'acumulado', v_data_dezembro);

                                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                                VALUES 
                                (v_upline2_profile_id, 'commission', 'Comissão Semanal G2 (3%) - Terça ' || TO_CHAR(v_data_terca, 'DD/MM') || ' - Pedido #' || NEW.id, v_semanal_g2, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id),
                                (v_upline2_profile_id, 'commission', 'Comissão Anual G2 (2%) - Dezembro - Pedido #' || NEW.id, v_anual_g2, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id);
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reassocia a trigger para a tabela orders
DROP TRIGGER IF EXISTS on_order_commission_payment ON public.orders;
CREATE TRIGGER on_order_commission_payment
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();


-- =========================================================================
-- 3. FUNÇÃO PARA REGULARIZAR LICENÇA E DESBLOQUEAR COMISSÕES RETIDAS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.regularizar_licenca_microfranqueado(p_microfranqueado_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_desbloqueadas INTEGER := 0;
BEGIN
    -- 1. Ativar Licença do Microfranqueado
    UPDATE public.licencas_mmn
    SET status = 'ativa',
        data_fim = now() + interval '12 months',
        updated_at = now()
    WHERE microfranqueado_id = p_microfranqueado_id;

    -- 2. Atualizar Status do Microfranqueado
    UPDATE public.microfranqueados
    SET status = 'ativo',
        registration_fee_status = 'pago',
        updated_at = now()
    WHERE id = p_microfranqueado_id;

    -- 3. Regularizar Inadimplência
    UPDATE public.inadimplencia_mmn
    SET status = 'regularizado',
        data_regularizacao = now()
    WHERE microfranqueado_id = p_microfranqueado_id AND status = 'bloqueado';

    -- 4. Desbloquear todas as comissões retidas para pagamento no próximo lote
    UPDATE public.comissoes_mmn
    SET status = 'pendente',
        data_prevista_terca = public.calcular_terca_pagamento(now()::date)
    WHERE microfranqueado_id = p_microfranqueado_id 
      AND status = 'bloqueado_inadimplencia';

    GET DIAGNOSTICS v_desbloqueadas = ROW_COUNT;

    -- 5. Atualizar status no cashback_mmn
    UPDATE public.cashback_mmn
    SET status = 'liberado',
        data_liberacao = public.calcular_terca_pagamento(now()::date)
    WHERE microfranqueado_id = p_microfranqueado_id 
      AND status = 'bloqueado' 
      AND tipo = 'semanal_80';

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Licença regularizada com sucesso e comissões desbloqueadas.',
        'comissoes_desbloqueadas', v_desbloqueadas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 4. FUNÇÃO DE FECHAMENTO SEMANAL (PAGAMENTO ÀS TERÇAS-FEIRAS)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.processar_pagamentos_semanais_terca()
RETURNS JSONB AS $$
DECLARE
    v_total_pagas INTEGER := 0;
    v_hoje DATE := now()::date;
BEGIN
    -- Marca como pagas as comissões semanais pendentes com data prevista até hoje
    UPDATE public.comissoes_mmn
    SET status = 'pago_semanal',
        pago_semanal_em = now()
    WHERE status = 'liberado_semanal' OR (status = 'pendente' AND data_prevista_terca <= v_hoje);

    GET DIAGNOSTICS v_total_pagas = ROW_COUNT;

    -- Atualiza cashback_mmn
    UPDATE public.cashback_mmn
    SET status = 'pago'
    WHERE tipo = 'semanal_80' 
      AND status = 'liberado' 
      AND data_liberacao <= v_hoje;

    RETURN jsonb_build_object(
        'success', true,
        'data_execucao', v_hoje,
        'comissoes_pagas', v_total_pagas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 5. FUNÇÃO DE FECHAMENTO ANUAL (10 DE DEZEMBRO)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.processar_pagamento_anual_dezembro()
RETURNS JSONB AS $$
DECLARE
    v_total_pagas INTEGER := 0;
    v_hoje DATE := now()::date;
BEGIN
    -- Marca como pagas as comissões anuais
    UPDATE public.comissoes_mmn
    SET status = 'pago_anual',
        pago_anual_em = now()
    WHERE (status IN ('pendente', 'pago_semanal')) 
      AND data_prevista_dezembro <= v_hoje;

    GET DIAGNOSTICS v_total_pagas = ROW_COUNT;

    UPDATE public.cashback_mmn
    SET status = 'pago'
    WHERE tipo = 'anual_20' 
      AND status = 'acumulado' 
      AND data_liberacao <= v_hoje;

    RETURN jsonb_build_object(
        'success', true,
        'data_execucao', v_hoje,
        'comissoes_anuais_pagas', v_total_pagas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
