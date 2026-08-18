-- Função para verificar expiração de assinaturas e disparar alertas via WhatsApp
CREATE OR REPLACE FUNCTION public.check_subscriptions_expiration()
RETURNS void AS $$
DECLARE
    sub RECORD;
    v_days_left INTEGER;
    v_msg TEXT;
    v_phone TEXT;
    v_name TEXT;
BEGIN
    -- 1. Varrer assinaturas ativas
    FOR sub IN 
        SELECT s.id, s.profile_id, s.plan_type, s.end_date, p.full_name, p.whatsapp
        FROM public.subscriptions s
        JOIN public.profiles p ON s.profile_id = p.id
        WHERE s.status = 'active'
    LOOP
        -- Calcular quantos dias faltam de forma truncada (inteiro)
        v_days_left := (date_trunc('day', sub.end_date) - date_trunc('day', now())) / interval '1 day';
        -- Sanitiza o número do telefone (removendo espaços, traços e parênteses)
        v_phone := regexp_replace(sub.whatsapp, '\D', '', 'g');
        -- Pega apenas o primeiro nome
        v_name := split_part(sub.full_name, ' ', 1);

        IF v_phone IS NOT NULL AND v_phone <> '' THEN
            -- Adiciona DDI Brasil (55) se tiver 10 ou 11 dígitos sem DDI
            IF length(v_phone) IN (10, 11) THEN
                v_phone := '55' || v_phone;
            END IF;

            -- Alerta de 30 dias
            IF v_days_left = 30 THEN
                v_msg := 'Olá ' || v_name || '! Seu plano de seguro Premiável Serviços Urbanos expirará em 30 dias (em ' || to_char(sub.end_date, 'DD/MM/YYYY') || '). Não se esqueça de renovar para não perder a cobertura e os sorteios!';
                INSERT INTO public.whatsapp_messages (phone, message, status) VALUES (v_phone, v_msg, 'pending');
            
            -- Alerta de 15 dias
            ELSIF v_days_left = 15 THEN
                v_msg := 'Olá ' || v_name || '! Faltam apenas 15 dias para o vencimento do seu seguro Serviços Urbanos. Renove agora mesmo pelo seu painel administrativo e garanta sua proteção!';
                INSERT INTO public.whatsapp_messages (phone, message, status) VALUES (v_phone, v_msg, 'pending');
            
            -- Alerta de 7 dias
            ELSIF v_days_left = 7 THEN
                v_msg := 'Atenção ' || v_name || '! Seu seguro Serviços Urbanos vence em 7 dias. Evite a suspensão do seguro e dos sorteios da Loteria Federal efetuando a renovação do seu plano.';
                INSERT INTO public.whatsapp_messages (phone, message, status) VALUES (v_phone, v_msg, 'pending');
            
            -- Alerta de 3 dias
            ELSIF v_days_left = 3 THEN
                v_msg := 'URGENTE: ' || v_name || ', seu seguro Serviços Urbanos vencerá em 3 dias (no dia ' || to_char(sub.end_date, 'DD/MM/YYYY') || '). Clique no link do seu painel e efetue a renovação para continuar concorrendo aos prêmios.';
                INSERT INTO public.whatsapp_messages (phone, message, status) VALUES (v_phone, v_msg, 'pending');
            END IF;
        END IF;

        -- 2. Se a assinatura expirou (v_days_left < 0)
        IF v_days_left < 0 THEN
            -- Inativar assinatura
            UPDATE public.subscriptions
            SET status = 'inactive'
            WHERE id = sub.id;

            -- Se o usuário tiver WhatsApp cadastrado, avisar do cancelamento da cobertura
            IF v_phone IS NOT NULL AND v_phone <> '' THEN
                -- Formata o telefone
                IF length(v_phone) IN (10, 11) THEN
                    v_phone := '55' || v_phone;
                END IF;

                v_msg := 'Olá ' || v_name || ', sua assinatura do plano de seguro Serviços Urbanos venceu e foi inativada. A sua cobertura de seguro e a participação nos sorteios mensais da Loteria Federal foram suspensas. Acesse a plataforma para assinar um novo plano e reativar seus benefícios!';
                INSERT INTO public.whatsapp_messages (phone, message, status) VALUES (v_phone, v_msg, 'pending');
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
