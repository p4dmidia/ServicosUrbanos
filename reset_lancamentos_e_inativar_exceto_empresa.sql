-- =========================================================================
-- SCRIPT DE RESET: ZERAR LANÇAMENTOS E INATIVAR TODOS (EXCETO EMPRESA)
-- =========================================================================
-- OBJETIVO:
--   1. Zerar todos os lançamentos financeiros (comissões, cashback, transações, saques).
--   2. Zerar todos os pedidos e notas fiscais de pagamento anexadas.
--   3. Zerar contadores de vendas dos produtos.
--   4. Inativar todos os usuários da base (remove assinaturas ativas e define status = 'pending').
--   5. MANTER ATIVOS APENAS:
--      - SIC Comércio (ID: 194e5265-cdb6-431f-9f77-8888b1ee74ae / Lojista da Empresa)
--      - agenciap4d@gmail.com (Conta da Empresa)
--      - admin@servicosurbanos.com.br (se existir)
--   6. PRESERVAR: Os cadastros dos usuários (auth.users e profiles) e a árvore de indicações
--      são mantidos, para que ninguém perca o acesso à conta (apenas precisarão assinar para ativar).
--
-- COMO EXECUTAR:
--   1. Acesse o painel do Supabase (https://supabase.com/dashboard).
--   2. Vá em SQL Editor (menu lateral esquerdo).
--   3. Cole o script abaixo e clique em RUN.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. ZERAR TODOS OS LANÇAMENTOS FINANCEIROS E OPERACIONAIS
-- -------------------------------------------------------------------------

-- Limpar todas as transações (zera saldos, comissões MMN e cashback)
DELETE FROM public.transactions;

-- Limpar comprovantes de saques e notas fiscais de autônomos/afiliados (se existirem)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'affiliate_payouts'
    ) THEN
        EXECUTE 'DELETE FROM public.affiliate_payouts;';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'affiliate_invoices'
    ) THEN
        EXECUTE 'DELETE FROM public.affiliate_invoices;';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscription_renewal_alerts'
    ) THEN
        EXECUTE 'DELETE FROM public.subscription_renewal_alerts;';
    END IF;
END $$;

-- Limpar histórico de pedidos e extras de entrega
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- Limpar histórico de notificações, mensagens de WhatsApp e avaliações de teste
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.product_reviews;
DELETE FROM public.merchant_waitlist;

-- Zerar contador de vendas acumuladas nos produtos
UPDATE public.products SET sales = 0;


-- -------------------------------------------------------------------------
-- 2. INATIVAR ASSINATURAS (EXCETO EMPRESA E SIC COMÉRCIO)
-- -------------------------------------------------------------------------

-- Remove todas as assinaturas ativas de outros usuários.
-- No ecossistema Serviços Urbanos, a elegibilidade/ativação é baseada em ter
-- assinatura ativa. Sem assinatura, o associado fica automaticamente INATIVO.
DELETE FROM public.subscriptions
WHERE profile_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
       OR id = '194e5265-cdb6-431f-9f77-8888b1ee74ae'
       OR LOWER(full_name) LIKE '%sic com%rcio%'
       OR LOWER(store_name) LIKE '%sic com%rcio%'
);

-- Garante que o SIC Comércio e a conta da empresa tenham assinatura ativa vitalícia
DO $$
DECLARE
    empresa_record RECORD;
BEGIN
    FOR empresa_record IN (
        SELECT id FROM public.profiles 
        WHERE LOWER(email) IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
           OR id = '194e5265-cdb6-431f-9f77-8888b1ee74ae'
           OR LOWER(full_name) LIKE '%sic com%rcio%'
           OR LOWER(store_name) LIKE '%sic com%rcio%'
    ) LOOP
        -- Se já tiver assinatura, ativa até 2099
        UPDATE public.subscriptions
        SET status = 'active',
            plan_type = 'anual',
            end_date = '2099-12-31 23:59:59'
        WHERE profile_id = empresa_record.id;

        -- Se não tiver, cria uma ativa
        IF NOT FOUND THEN
            INSERT INTO public.subscriptions (
                profile_id,
                plan_type,
                amount,
                status,
                start_date,
                end_date,
                created_at
            ) VALUES (
                empresa_record.id,
                'anual',
                99.00,
                'active',
                NOW(),
                '2099-12-31 23:59:59',
                NOW()
            );
        END IF;
    END LOOP;
END $$;


-- -------------------------------------------------------------------------
-- 3. INATIVAR STATUS DOS DEMAIS USUÁRIOS NO PROFILES
-- -------------------------------------------------------------------------

-- Define status como 'pending' (ou 'Inativo') para todos, exceto a empresa
UPDATE public.profiles
SET status = 'pending'
WHERE LOWER(email) NOT IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
  AND id != '194e5265-cdb6-431f-9f77-8888b1ee74ae'
  AND (full_name IS NULL OR LOWER(full_name) NOT LIKE '%sic com%rcio%')
  AND (store_name IS NULL OR LOWER(store_name) NOT LIKE '%sic com%rcio%');

-- Garante status 'active' / 'approved' para a conta da empresa e SIC Comércio
UPDATE public.profiles
SET status = 'active'
WHERE LOWER(email) IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
   OR id = '194e5265-cdb6-431f-9f77-8888b1ee74ae'
   OR LOWER(full_name) LIKE '%sic com%rcio%'
   OR LOWER(store_name) LIKE '%sic com%rcio%';

-- Se existir a coluna is_active, atualiza também
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        UPDATE public.profiles
        SET is_active = false
        WHERE LOWER(email) NOT IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
          AND id != '194e5265-cdb6-431f-9f77-8888b1ee74ae';

        UPDATE public.profiles
        SET is_active = true
        WHERE LOWER(email) IN ('agenciap4d@gmail.com', 'admin@servicosurbanos.com.br')
           OR id = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
    END IF;
END $$;


-- -------------------------------------------------------------------------
-- 4. RECARREGAR CACHE DO POSTGREST
-- -------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
