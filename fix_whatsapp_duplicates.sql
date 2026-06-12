-- =========================================================================
-- SCRIPT DE CORREÇÃO: Evitar Duplicação de Mensagens de WhatsApp
-- OBJETIVO: Atualizar as funções de gatilho para usar SELECT DISTINCT ao buscar
--           números de WhatsApp. Isso impede mensagens duplicadas para o mesmo
--           número em indicações, compras ou alertas de estoque.
--
-- COMO EXECUTAR: Supabase Dashboard > SQL Editor > Colar e Executar
-- =========================================================================

-- 1. CORREÇÃO NA FUNÇÃO DE CADASTRO CONCLUÍDO E INDICAÇÕES
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

    -- C. Novo afiliado em suas gerações (para uplines da 2ª à 5ª geração) - Com DISTINCT para evitar duplicados
    SELECT depth INTO v_mmn_depth FROM public.mmn_config WHERE id = 1;
    v_mmn_depth := COALESCE(v_mmn_depth, 4);

    FOR v_upline IN 
      SELECT DISTINCT p.whatsapp
      FROM public.get_upline_chain(NEW.id, v_mmn_depth) u
      JOIN public.profiles p ON p.id = u.upline_id
      WHERE u.level > 1 AND p.whatsapp IS NOT NULL AND p.whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_upline.whatsapp, 'Você ganhou um novo afiliado em sua rede. Agora sua geração se fortalece e pode gerar mais cashback.');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. CORREÇÃO NA FUNÇÃO DE PAGAMENTO DE PEDIDOS E COMISSÃO
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

  -- C. Recebimento de cashback por compras da 1ª a 5ª geração (para uplines) - Com DISTINCT para evitar duplicados
  SELECT depth INTO v_mmn_depth FROM public.mmn_config WHERE id = 1;
  v_mmn_depth := COALESCE(v_mmn_depth, 4);

  FOR v_upline IN 
    SELECT DISTINCT p.whatsapp
    FROM public.get_upline_chain(NEW.customer_id, v_mmn_depth) u
    JOIN public.profiles p ON p.id = u.upline_id
    WHERE p.whatsapp IS NOT NULL AND p.whatsapp <> ''
  LOOP
    INSERT INTO public.whatsapp_messages (phone, message)
    VALUES (v_upline.whatsapp, 'Você recebeu cashback pelas compras realizadas por seus afiliados até a 5ª geração.');
  END LOOP;

  -- D. Aviso de retirada de produto (para parceiros/lojistas) - Com DISTINCT para evitar duplicados
  IF NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT DISTINCT whatsapp 
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


-- 3. CORREÇÃO NA FUNÇÃO DE ALTERAÇÃO OU CONFIRMAÇÃO DE RETIRADA
CREATE OR REPLACE FUNCTION public.handle_order_status_change_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- A. Confirmação de retirada realizada - Com DISTINCT para evitar duplicados
  IF NEW.status = 'Concluído' AND OLD.status = 'Pago, Aguardando Retirada' AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT DISTINCT whatsapp 
      FROM public.profiles 
      WHERE branch_id = NEW.branch_id AND role IN ('owner', 'manager') AND whatsapp IS NOT NULL AND whatsapp <> ''
    LOOP
      INSERT INTO public.whatsapp_messages (phone, message)
      VALUES (v_staff.whatsapp, 'Confirmação: o produto foi retirado em sua loja pelo afiliado. Obrigado pelo suporte e parceria. As comissões correspondentes serão depositadas em sua conta no próximo dia útil.');
    END LOOP;
  END IF;

  -- B. Aviso de alteração ou cancelamento de retirada - Com DISTINCT para evitar duplicados
  IF NEW.status = 'Cancelado' AND OLD.status IN ('Pago, Aguardando Retirada', 'Pendente', 'Aguardando Pagamento', 'Processando') AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT DISTINCT whatsapp 
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


-- 4. CORREÇÃO NA FUNÇÃO DE ALERTA DE ESTOQUE BAIXO
CREATE OR REPLACE FUNCTION public.handle_product_stock_low_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- Com DISTINCT para evitar duplicados
  IF NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT DISTINCT whatsapp 
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


-- 5. CORREÇÃO NA FUNÇÃO DE ALERTA DE ESTOQUE BAIXO (MULTI BRANCH STOCK)
CREATE OR REPLACE FUNCTION public.handle_product_stocks_low_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- Com DISTINCT para evitar duplicados
  IF NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) AND NEW.branch_id IS NOT NULL THEN
    FOR v_staff IN 
      SELECT DISTINCT whatsapp 
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

-- 6. ATUALIZAR ESQUEMA DO POSTGREST
NOTIFY pgrst, 'reload schema';
