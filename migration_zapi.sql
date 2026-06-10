-- =========================================================================
-- MIGRATION: Z-API WhatsApp Integration
-- OBJETIVO: Criar tabelas, RLS, triggers e rotinas de agendamento (cron) para a Z-API
--
-- COMO EXECUTAR: Supabase Dashboard > SQL Editor > colar e executar
-- =========================================================================

-- Habilitar extensões necessárias se existirem/permitido
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. TABELA DE CONFIGURAÇÃO DA Z-API
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    zapi_instance_id TEXT,
    zapi_token TEXT,
    zapi_client_token TEXT,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir registro inicial se não existir
INSERT INTO public.whatsapp_config (id, is_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE FILA DE MENSAGENS (LOGS)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_config
DROP POLICY IF EXISTS "Leitura pública de whatsapp_config" ON public.whatsapp_config;
CREATE POLICY "Leitura pública de whatsapp_config" ON public.whatsapp_config 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escrita apenas para admins de whatsapp_config" ON public.whatsapp_config;
CREATE POLICY "Escrita apenas para admins de whatsapp_config" ON public.whatsapp_config 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')
        )
    );

-- Políticas para whatsapp_messages
DROP POLICY IF EXISTS "Leitura de logs apenas para admins" ON public.whatsapp_messages;
CREATE POLICY "Leitura de logs apenas para admins" ON public.whatsapp_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')
        )
    );

DROP POLICY IF EXISTS "Escrita de logs apenas para admins" ON public.whatsapp_messages;
CREATE POLICY "Escrita de logs apenas para admins" ON public.whatsapp_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')
        )
    );

-- 4. FUNÇÃO E TRIGGER PARA PROCESSAR A FILA VIA EDGE FUNCTION
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_queue_proc()
RETURNS TRIGGER AS $$
DECLARE
  v_url TEXT;
  v_anon_key TEXT;
  v_enabled BOOLEAN;
BEGIN
  -- Buscar configurações
  SELECT supabase_url, supabase_anon_key, is_enabled 
  INTO v_url, v_anon_key, v_enabled 
  FROM public.whatsapp_config 
  WHERE id = 1;

  -- Disparar requisição assíncrona se ativado
  IF COALESCE(v_enabled, TRUE) = TRUE AND v_url IS NOT NULL AND v_anon_key IS NOT NULL AND v_url <> '' AND v_anon_key <> '' THEN
    PERFORM net.http_post(
      url := v_url || '/functions/v1/send-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body := jsonb_build_object('message_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_whatsapp_message_queued ON public.whatsapp_messages;
CREATE TRIGGER on_whatsapp_message_queued
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_queue_proc();

-- 5. TRIGGER: CADASTRO CONCLUÍDO E INDICAÇÕES (PROFILES INSERT)
CREATE OR REPLACE FUNCTION public.handle_profile_insert_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_whatsapp TEXT;
  v_referred_name TEXT;
  v_upline RECORD;
  v_mmn_depth INTEGER;
BEGIN
  -- A. Cadastro concluído
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp <> '' THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    VALUES (NEW.whatsapp, 'Cadastro realizado com sucesso. Mantenha seus dados atualizados conforme LGPD.');
  END IF;

  -- B. Indicações (Se foi indicado por alguém)
  IF NEW.referred_by IS NOT NULL THEN
    -- Obter whatsapp do patrocinador direto
    SELECT whatsapp INTO v_referrer_whatsapp FROM public.profiles WHERE id = NEW.referred_by;
    
    IF v_referrer_whatsapp IS NOT NULL AND v_referrer_whatsapp <> '' THEN
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_referrer_whatsapp, 'Indicação registrada com sucesso. Lembre-se: válidas até a 5ª geração.');
    END IF;

    -- C. Novo afiliado em suas gerações (para uplines da 2ª à 5ª geração)
    SELECT depth INTO v_mmn_depth FROM public.mmn_config WHERE id = 1;
    v_mmn_depth := COALESCE(v_mmn_depth, 4);

    FOR v_upline IN 
      SELECT u.upline_id, u.level
      FROM public.get_upline_chain(NEW.id, v_mmn_depth) u
      WHERE u.level > 1 -- Pula o nível 1 que já recebeu o aviso direto de indicação
    LOOP
      SELECT whatsapp INTO v_referrer_whatsapp FROM public.profiles WHERE id = v_upline.upline_id;
      IF v_referrer_whatsapp IS NOT NULL AND v_referrer_whatsapp <> '' THEN
        INSERT INTO public.whatsapp_messages (phone, message)
        VALUES (v_referrer_whatsapp, 'Você ganhou um novo afiliado em sua rede. Agora sua geração se fortalece e pode gerar mais cashback.');
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_whatsapp ON public.profiles;
CREATE TRIGGER on_profile_created_whatsapp
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_insert_whatsapp();

-- 6. TRIGGER: COMPRA PIX, CASHBACK E RETIRADA DE PRODUTO (ORDERS PAYMENT)
CREATE OR REPLACE FUNCTION public.handle_order_payment_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_whatsapp TEXT;
  v_upline RECORD;
  v_upline_whatsapp TEXT;
  v_mmn_depth INTEGER;
  v_staff RECORD;
BEGIN
  -- Obter whatsapp do comprador
  SELECT whatsapp INTO v_buyer_whatsapp FROM public.profiles WHERE id = NEW.customer_id;

  IF v_buyer_whatsapp IS NOT NULL AND v_buyer_whatsapp <> '' THEN
    -- A. Compra via PIX confirmada
    IF NEW.payment_method LIKE '%Pix%' OR NEW.payment_method LIKE '%PIX%' OR NEW.payment_method IS NULL OR NEW.payment_method = 'Saldo de Carteira + Pix' THEN
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_buyer_whatsapp, 'Sua compra foi registrada via PIX. Cashback será liberado conforme regras.');
    END IF;

    -- B. Notificação de Cashback Digital (para quem comprou)
    IF COALESCE(NEW.cashback_amount, 0) > 0 THEN
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_buyer_whatsapp, 'Confira o seu valor liberado de cashback digital para novas compras.');
    END IF;
  END IF;

  -- C. Recebimento de cashback por compras da 1ª a 5ª geração (para uplines)
  SELECT depth INTO v_mmn_depth FROM public.mmn_config WHERE id = 1;
  v_mmn_depth := COALESCE(v_mmn_depth, 4);

  FOR v_upline IN 
    SELECT u.upline_id, u.level
    FROM public.get_upline_chain(NEW.customer_id, v_mmn_depth) u
  LOOP
    SELECT whatsapp INTO v_upline_whatsapp FROM public.profiles WHERE id = v_upline.upline_id;
    IF v_upline_whatsapp IS NOT NULL AND v_upline_whatsapp <> '' THEN
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_upline_whatsapp, 'Você recebeu cashback pelas compras realizadas por seus afiliados até a 5ª geração.');
    END IF;
  END LOOP;

  -- D. Aviso de retirada de produto (para parceiros/lojistas)
  IF NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Olá, parceiro! Informamos que um afiliado realizará a retirada do produto em sua loja. Por favor, prepare o item para entrega conforme os procedimentos da Plataforma Serviços Urbanos. As comissões referentes a esta entrega serão depositadas em sua conta no dia seguinte à confirmação da retirada.');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_paid_whatsapp ON public.orders;
CREATE TRIGGER on_order_paid_whatsapp
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status IN ('Pago, Aguardando Retirada', 'Concluído') AND (OLD.status IS NULL OR OLD.status NOT IN ('Pago, Aguardando Retirada', 'Concluído')))
  EXECUTE FUNCTION public.handle_order_payment_whatsapp();

-- 7. TRIGGER: CONFIRMAÇÃO OU CANCELAMENTO DE RETIRADA (ORDERS STATUS CHANGE)
CREATE OR REPLACE FUNCTION public.handle_order_status_change_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- A. Confirmação de retirada realizada
  IF NEW.status = 'Concluído' AND OLD.status = 'Pago, Aguardando Retirada' AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Confirmação: o produto foi retirado em sua loja pelo afiliado. Obrigado pelo suporte e parceria. As comissões correspondentes serão depositadas em sua conta no próximo dia útil.');
    END LOOP;
  END IF;

  -- B. Aviso de alteração ou cancelamento de retirada
  IF NEW.status = 'Cancelado' AND OLD.status IN ('Pago, Aguardando Retirada', 'Pendente', 'Aguardando Pagamento', 'Processando') AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Atenção: o afiliado alterou ou cancelou a retirada do produto em sua loja. Verifique o novo status no sistema. Caso a retirada seja confirmada, as comissões serão depositadas no dia seguinte.');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change_whatsapp ON public.orders;
CREATE TRIGGER on_order_status_change_whatsapp
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change_whatsapp();

-- 8. TRIGGER: ESTOQUE BAIXO (PRODUCTS & PRODUCT_STOCKS UPDATE)
CREATE OR REPLACE FUNCTION public.handle_product_stock_low_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  IF NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Atenção: o estoque do produto em sua loja está baixo. Recomendamos providenciar reposição para garantir disponibilidade nas próximas retiradas. As comissões continuarão sendo repassadas normalmente no dia seguinte às confirmações de entrega.');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_stock_low_whatsapp ON public.products;
CREATE TRIGGER on_product_stock_low_whatsapp
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_stock_low_whatsapp();

-- Trigger para tabela de estoques de filiais
CREATE OR REPLACE FUNCTION public.handle_product_stocks_low_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  IF NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Atenção: o estoque do produto em sua loja está baixo. Recomendamos providenciar reposição para garantir disponibilidade nas próximas retiradas. As comissões continuarão sendo repassadas normalmente no dia seguinte às confirmações de entrega.');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_stocks_low_whatsapp ON public.product_stocks;
CREATE TRIGGER on_product_stocks_low_whatsapp
  AFTER UPDATE ON public.product_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_stocks_low_whatsapp();

-- 9. TRIGGER: ALTERAÇÃO DE TERMOS/PERCENTUAIS (MMN CONFIG UPDATE)
CREATE OR REPLACE FUNCTION public.handle_mmn_config_change_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cashback_mensal <> NEW.cashback_mensal OR 
     OLD.cashback_digital <> NEW.cashback_digital OR 
     OLD.cashback_anual <> NEW.cashback_anual THEN
     
     INSERT INTO public.whatsapp_messages (phone, message)
     SELECT whatsapp, 'Os percentuais de cashback foram atualizados. Confira no site.'
     FROM public.profiles
     WHERE whatsapp IS NOT NULL AND whatsapp <> '' AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_mmn_config_change_whatsapp ON public.mmn_config;
CREATE TRIGGER on_mmn_config_change_whatsapp
  AFTER UPDATE ON public.mmn_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mmn_config_change_whatsapp();

-- 10. ROTINAS AGENDADAS (CRON SCHEDULER & COORDINATOR)
CREATE OR REPLACE FUNCTION public.is_first_business_day(p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_dow INTEGER;
BEGIN
  v_dow := extract(dow from p_date); -- 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  
  IF extract(day from p_date) = 1 THEN
    IF v_dow BETWEEN 1 AND 5 THEN
      RETURN TRUE;
    END IF;
  ELSIF extract(day from p_date) = 2 THEN
    IF v_dow = 1 THEN
      RETURN TRUE;
    END IF;
  ELSIF extract(day from p_date) = 3 THEN
    IF v_dow = 1 THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.run_whatsapp_cron_tasks()
RETURNS VOID AS $$
DECLARE
  v_date DATE;
  v_last_day_of_month DATE;
  v_eligibility_date DATE;
  v_upline RECORD;
BEGIN
  v_date := current_date;
  v_last_day_of_month := (date_trunc('month', v_date) + interval '1 month - 1 day')::date;
  v_eligibility_date := (date_trunc('month', v_date) + interval '1 month - 4 days')::date;

  -- A. Atualização de dados bancários (primeiro dia útil do mês)
  IF public.is_first_business_day(v_date) THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    SELECT whatsapp, 'Lembre-se de manter seus dados bancários atualizados para garantir o recebimento do seu cashback no dia 10.'
    FROM public.profiles
    WHERE role = 'affiliate' AND status = 'active' AND whatsapp IS NOT NULL AND whatsapp <> '';
  END IF;

  -- B. Aviso prévio de elegibilidade (3 dias antes do fim do mês)
  IF v_date = v_eligibility_date THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    SELECT p.whatsapp, 'Faltam 3 dias para o fechamento do mês. Realize ao menos uma compra para garantir sua elegibilidade ao recebimento de cashback.'
    FROM public.profiles p
    WHERE p.role = 'affiliate' AND p.status = 'active' AND p.whatsapp IS NOT NULL AND p.whatsapp <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = p.id
      AND o.status IN ('Pago, Aguardando Retirada', 'Concluído')
      AND o.order_date >= date_trunc('month', v_date)
    );
  END IF;

  -- C. Inatividade 28 dias
  IF extract(day from v_date) = 28 THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    SELECT p.whatsapp, 'Atenção: se não consumir este mês, perderá 50% do cashback acumulado.'
    FROM public.profiles p
    WHERE p.role = 'affiliate' AND p.status = 'active' AND p.whatsapp IS NOT NULL AND p.whatsapp <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = p.id
      AND o.status IN ('Pago, Aguardando Retirada', 'Concluído')
      AND o.order_date >= date_trunc('month', v_date)
    );
  END IF;

  -- D. Cashback mensal (dia 10)
  IF extract(day from v_date) = 10 THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    SELECT DISTINCT p.whatsapp, 'Seu cashback mensal foi creditado em sua conta.'
    FROM public.profiles p
    JOIN public.transactions t ON t.profile_id = p.id
    WHERE t.description LIKE 'Cashback Mensal%'
    AND t.created_at >= date_trunc('month', v_date - interval '1 month')
    AND t.created_at < date_trunc('month', v_date)
    AND p.whatsapp IS NOT NULL AND p.whatsapp <> '' AND p.status = 'active';
  END IF;

  -- E. Cashback anual (10 de dezembro)
  IF extract(day from v_date) = 10 AND extract(month from v_date) = 12 THEN
    INSERT INTO public.whatsapp_messages (phone, message)
    SELECT DISTINCT p.whatsapp, 'Seu cashback anual  foi creditado.' -- Mantendo os dois espaços em 'anual  foi' para seguir a string exata do cliente
    FROM public.profiles p
    JOIN public.transactions t ON t.profile_id = p.id
    WHERE t.description LIKE 'Cashback Anual%'
    AND t.created_at >= date_trunc('year', v_date)
    AND t.created_at < date_trunc('year', v_date + interval '1 year')
    AND p.whatsapp IS NOT NULL AND p.whatsapp <> '' AND p.status = 'active';
  END IF;

  -- F. Inatividade 90 dias (bloqueio de conta e aviso)
  FOR v_upline IN 
    SELECT p.id, p.whatsapp
    FROM public.profiles p
    WHERE p.status = 'active' AND p.role = 'affiliate'
    AND (
      SELECT COALESCE(max(o.order_date), p.created_at)
      FROM public.orders o
      WHERE o.customer_id = p.id
      AND o.status IN ('Pago, Aguardando Retirada', 'Concluído')
    ) < (v_date - interval '90 days')
  LOOP
    -- Bloquear a conta
    UPDATE public.profiles SET status = 'blocked' WHERE id = v_upline.id;

    -- Enviar notificação de bloqueio
    IF v_upline.whatsapp IS NOT NULL AND v_upline.whatsapp <> '' THEN
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_upline.whatsapp, 'Sua conta foi bloqueada por inatividade superior a 90 dias.');
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendamento com pg_cron (Executa diariamente às 09:00 da manhã)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Desagendar se já existir
        PERFORM cron.unschedule('run-daily-whatsapp-tasks');
        -- Agendar novo job
        PERFORM cron.schedule('run-daily-whatsapp-tasks', '0 9 * * *', 'SELECT public.run_whatsapp_cron_tasks();');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível agendar o job de cron: %', SQLERRM;
END $$;

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
