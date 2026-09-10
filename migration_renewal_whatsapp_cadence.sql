-- =========================================================================
-- MIGRATION: Régua de Disparos Automáticos de Renovação via WhatsApp (Z-API)
-- Disparos automáticos em 3 marcos temporais:
-- 1. 30 dias antes do vencimento (Abertura da janela de renovação)
-- 2. 5 dias antes do vencimento (Alerta crítico preventivo)
-- 3. Após o vencimento (Notificação de bloqueio de saque e regularização)
-- =========================================================================

-- 1. TABELA DE CONTROLE DE DISPAROS DE RENOVAÇÃO (Garante que nunca envie duplicado)
CREATE TABLE IF NOT EXISTS public.subscription_renewal_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('30_days', '5_days', 'expired')),
    phone TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_sub_alert UNIQUE (subscription_id, alert_type)
);

ALTER TABLE public.subscription_renewal_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso a alertas de renovacao para admins" ON public.subscription_renewal_alerts;
CREATE POLICY "Acesso a alertas de renovacao para admins" ON public.subscription_renewal_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')
        )
    );

-- 2. FUNÇÃO SQL PARA PROCESSAR A RÉGUA DE RENOVAÇÃO
CREATE OR REPLACE FUNCTION public.process_subscription_renewal_alerts()
RETURNS jsonb AS $$
DECLARE
    v_sub RECORD;
    v_days_left NUMERIC;
    v_phone TEXT;
    v_name TEXT;
    v_date_str TEXT;
    v_msg TEXT;
    v_count_30d INTEGER := 0;
    v_count_5d INTEGER := 0;
    v_count_exp INTEGER := 0;
BEGIN
    FOR v_sub IN
        SELECT 
            s.id AS sub_id,
            s.profile_id,
            s.plan_type,
            s.end_date,
            s.status,
            p.full_name,
            p.whatsapp
        FROM public.subscriptions s
        JOIN public.profiles p ON s.profile_id = p.id
        WHERE p.whatsapp IS NOT NULL AND p.whatsapp <> ''
    LOOP
        v_days_left := EXTRACT(EPOCH FROM (v_sub.end_date - now())) / 86400.0;
        v_phone := regexp_replace(v_sub.whatsapp, '\D', '', 'g');
        v_name := split_part(v_sub.full_name, ' ', 1);
        v_date_str := to_char(v_sub.end_date, 'DD/MM/YYYY');

        IF length(v_phone) IN (10, 11) THEN
            v_phone := '55' || v_phone;
        END IF;

        IF length(v_phone) >= 12 THEN
            -- 1. Alerta de 30 Dias (Janela entre 25 e 31 dias antes do vencimento)
            IF v_days_left <= 31 AND v_days_left >= 25 AND v_sub.status = 'active' THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.subscription_renewal_alerts 
                    WHERE subscription_id = v_sub.sub_id AND alert_type = '30_days'
                ) THEN
                    v_msg := 'Olá, ' || v_name || '! 🚀 Informamos que faltam 30 dias para o vencimento do seu plano MMN Serviços Urbanos (vence em ' || v_date_str || '). A renovação antecipada já está liberada no seu painel! Renove agora para continuar acumulando seus cashbacks de rede e garantir sua Telemedicina 24h sem interrupção.';
                    
                    INSERT INTO public.whatsapp_messages (phone, message, status)
                    VALUES (v_phone, v_msg, 'pending');

                    INSERT INTO public.subscription_renewal_alerts (subscription_id, profile_id, alert_type, phone)
                    VALUES (v_sub.sub_id, v_sub.profile_id, '30_days', v_phone);

                    v_count_30d := v_count_30d + 1;
                END IF;

            -- 2. Alerta de 5 Dias (Janela entre 0 e 5 dias antes do vencimento)
            ELSIF v_days_left <= 5 AND v_days_left > 0 AND v_sub.status = 'active' THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.subscription_renewal_alerts 
                    WHERE subscription_id = v_sub.sub_id AND alert_type = '5_days'
                ) THEN
                    v_msg := 'Atenção, ' || v_name || '! ⚠️ Faltam apenas 5 dias para o vencimento do seu licenciamento MMN (' || v_date_str || '). Evite a retenção dos seus saques do dia 10 e a suspensão da sua Telemedicina 24h. Acesse o painel agora e faça sua renovação para manter sua conta ativa!';
                    
                    INSERT INTO public.whatsapp_messages (phone, message, status)
                    VALUES (v_phone, v_msg, 'pending');

                    INSERT INTO public.subscription_renewal_alerts (subscription_id, profile_id, alert_type, phone)
                    VALUES (v_sub.sub_id, v_sub.profile_id, '5_days', v_phone);

                    v_count_5d := v_count_5d + 1;
                END IF;

            -- 3. Alerta de Plano Vencido (Venceu nos últimos 15 dias)
            ELSIF v_days_left <= 0 AND v_days_left >= -15 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.subscription_renewal_alerts 
                    WHERE subscription_id = v_sub.sub_id AND alert_type = 'expired'
                ) THEN
                    v_msg := 'Importante, ' || v_name || ': O seu plano MMN Serviços Urbanos venceu em ' || v_date_str || ' e sua conta está em estado de renovação pendente. Os saques de comissões do dia 10 foram retidos e a Telemedicina pausada. Acesse o painel e regularize hoje mesmo para reativar todos os seus benefícios e destravar seus pagamentos!';
                    
                    INSERT INTO public.whatsapp_messages (phone, message, status)
                    VALUES (v_phone, v_msg, 'pending');

                    INSERT INTO public.subscription_renewal_alerts (subscription_id, profile_id, alert_type, phone)
                    VALUES (v_sub.sub_id, v_sub.profile_id, 'expired', v_phone);

                    v_count_exp := v_count_exp + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'alerts_30d', v_count_30d,
        'alerts_5d', v_count_5d,
        'alerts_expired', v_count_exp,
        'total_queued', (v_count_30d + v_count_5d + v_count_exp)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AGENDAMENTO DIÁRIO VIA PG_CRON (Às 09:00 BRT / 12:00 UTC)
-- Se a extensão pg_cron estiver habilitada no Supabase:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('process_subscription_renewal_alerts_daily');
        PERFORM cron.schedule(
            'process_subscription_renewal_alerts_daily',
            '0 12 * * *',
            'SELECT public.process_subscription_renewal_alerts();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignora se pg_cron não tiver permissão
    NULL;
END $$;
