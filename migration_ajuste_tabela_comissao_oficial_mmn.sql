-- =========================================================================
-- MIGRATION: AJUSTE OFICIAL DA TABELA DE COMISSIONAMENTO MMN DO MICROFRANQUEADO
-- Alinhamento 100% com a Tabela Oficial Ganha & Ganha (33% Total):
--
--   NÍVEIS  | SEMANAL (Terça-feira) | ANUAL (10 de Dezembro) | TOTAL POR NÍVEL
--   -------------------------------------------------------------------------
--   G0      | 21%                   | 2%                     | 23%
--   G1      | 3%                    | 2%                     | 5%
--   G2      | 3%                    | 2%                     | 5%
--   -------------------------------------------------------------------------
--   TOTAL   | 27%                   | 6%                     | 33% GERAL
--
-- Regras Operacionais Oficiais:
-- 1. Comissões pagas APENAS sobre vendas confirmadas e pagas (status 'Pago', 'Pago, Aguardando Retirada', 'Concluído').
-- 2. Pagamento semanal toda terça-feira (referente a seg-sáb da semana anterior).
-- 3. Bônus anual de 6% pago em 10 de dezembro de cada ano (ciclo 01.11.25 a 30.11.26).
--
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Acesse o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Vá no SQL Editor > New Query
-- 3. Cole todo o conteúdo deste arquivo e clique em RUN
-- =========================================================================

-- 1. Função de Cálculo da Terça-Feira Semanal
CREATE OR REPLACE FUNCTION public.calcular_terca_pagamento(data_venda DATE)
RETURNS DATE AS $$
DECLARE
    v_segunda DATE;
    v_terca DATE;
BEGIN
    -- Obter a segunda-feira da semana da venda
    v_segunda := (date_trunc('week', data_venda::timestamp))::date;
    -- A terça-feira de liberação é a terça da semana SEGUINTE (+8 dias da segunda-feira da venda)
    v_terca := v_segunda + 8;
    RETURN v_terca;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Função de Cálculo do Bônus Anual (10 de Dezembro)
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

-- 3. Função de Processamento do Pedido com a Tabela Oficial
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_vendedor_profile_id UUID;
    v_microfranqueado_id UUID;
    v_licenca_status VARCHAR(50);
    v_mf_status VARCHAR(50);
    v_status_comissao VARCHAR(50);
    v_amount NUMERIC(12,2);
    v_data_venda DATE;
    v_semana_inicio DATE;
    v_semana_fim DATE;
    v_data_terca DATE;
    v_data_dezembro DATE;
    v_comissao_id UUID;
    
    -- G0: 21% Semanal / 2% Anual / 23% Total
    v_bruto_g0 NUMERIC(12,2);
    v_semanal_g0 NUMERIC(12,2);
    v_anual_g0 NUMERIC(12,2);

    -- G1: 3% Semanal / 2% Anual / 5% Total
    v_upline1_profile_id UUID;
    v_upline1_mf_id UUID;
    v_upline1_licenca_status VARCHAR(50);
    v_bruto_g1 NUMERIC(12,2);
    v_semanal_g1 NUMERIC(12,2);
    v_anual_g1 NUMERIC(12,2);

    -- G2: 3% Semanal / 2% Anual / 5% Total
    v_upline2_profile_id UUID;
    v_upline2_mf_id UUID;
    v_upline2_licenca_status VARCHAR(50);
    v_bruto_g2 NUMERIC(12,2);
    v_semanal_g2 NUMERIC(12,2);
    v_anual_g2 NUMERIC(12,2);
BEGIN
    -- Comissões são geradas APENAS sobre vendas com status confirmado/pago
    IF (
        (NEW.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído'))
    ) THEN

        -- Trava contra duplicidade de processamento no mesmo pedido
        IF EXISTS (SELECT 1 FROM public.comissoes_mmn WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Datas operacionais do ciclo
        v_data_venda := COALESCE(NEW.order_date::date, NEW.created_at::date, now()::date);
        v_semana_inicio := (date_trunc('week', v_data_venda::timestamp))::date;
        v_semana_fim := v_semana_inicio + 5; -- Sábado
        v_data_terca := public.calcular_terca_pagamento(v_data_venda);
        v_data_dezembro := public.calcular_dezembro_anual(v_data_venda);
        v_amount := COALESCE(NEW.total_amount, NEW.amount, 0.00);

        -- Se o valor da venda for zero ou nulo, não há comissão financeira
        IF v_amount <= 0 THEN
            RETURN NEW;
        END IF;

        -- Identificar vendedor do pedido
        v_vendedor_profile_id := NEW.seller_id;
        IF v_vendedor_profile_id IS NULL THEN
            IF EXISTS (SELECT 1 FROM public.microfranqueados WHERE profile_id = NEW.customer_id) THEN
                v_vendedor_profile_id := NEW.customer_id;
            END IF;
        END IF;

        -- =====================================================================
        -- 1. PROCESSAR COMISSÃO G0 (VENDA DIRETA: 21% SEMANAL / 2% ANUAL)
        -- =====================================================================
        IF v_vendedor_profile_id IS NOT NULL THEN
            SELECT m.id, m.status, COALESCE(l.status, 'expirada')
            INTO v_microfranqueado_id, v_mf_status, v_licenca_status
            FROM public.microfranqueados m
            LEFT JOIN public.licencas_mmn l ON l.microfranqueado_id = m.id AND l.status = 'ativa' AND l.data_fim >= now()
            WHERE m.profile_id = v_vendedor_profile_id
            LIMIT 1;

            -- APENAS SE FOR MICROFRANQUEADO (Afiliados comuns não recebem comissão)
            IF v_microfranqueado_id IS NOT NULL THEN
                v_semanal_g0 := ROUND(v_amount * 0.21, 2); -- 21% Semanal
                v_anual_g0   := ROUND(v_amount * 0.02, 2); -- 2% Anual
                v_bruto_g0   := v_semanal_g0 + v_anual_g0; -- 23% Total

                IF v_licenca_status = 'ativa' AND v_mf_status = 'ativo' THEN
                    v_status_comissao := 'pendente';
                ELSE
                    v_status_comissao := 'bloqueado_inadimplencia';
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

                -- Transações financeiras para extrato e relatórios consolidados
                INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
                VALUES 
                (v_vendedor_profile_id, 'commission', 'Comissão Semanal G0 (21%) - Terça ' || TO_CHAR(v_data_terca, 'DD/MM') || ' - Pedido #' || NEW.id, v_semanal_g0, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id),
                (v_vendedor_profile_id, 'commission', 'Comissão Anual G0 (2%) - Dezembro - Pedido #' || NEW.id, v_anual_g0, CASE WHEN v_status_comissao = 'pendente' THEN 'pending' ELSE 'failed' END, NEW.id);

                -- =================================================================
                -- 2. IDENTIFICAR O UPLINE NÍVEL 1 (G1 = 3% SEMANAL / 2% ANUAL)
                -- =================================================================
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

                        -- =============================================================
                        -- 3. IDENTIFICAR O UPLINE NÍVEL 2 (G2 = 3% SEMANAL / 2% ANUAL)
                        -- =============================================================
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

-- 4. Reassociar o Trigger à tabela orders (apenas na coluna status)
DROP TRIGGER IF EXISTS on_order_commission_payment ON public.orders;
CREATE TRIGGER on_order_commission_payment
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();
