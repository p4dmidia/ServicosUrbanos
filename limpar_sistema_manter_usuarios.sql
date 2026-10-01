-- =========================================================================
-- SCRIPT DE LIMPEZA GERAL, ZERAGEM DE LANÇAMENTOS E MANUTENÇÃO DE USUÁRIOS
-- (Versão 100% compatível com Supabase SQL Editor / PgBouncer sem Temp Tables)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. ZERAR TODOS OS LANÇAMENTOS E DADOS OPERACIONAIS DE TESTE
-- -------------------------------------------------------------------------

-- Notificações e mensagens
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.product_reviews;
DELETE FROM public.merchant_waitlist;

-- Payouts, Invoices, Alertas e Solicitações
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_payouts') THEN
        EXECUTE 'DELETE FROM public.affiliate_payouts;';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_invoices') THEN
        EXECUTE 'DELETE FROM public.affiliate_invoices;';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_renewal_alerts') THEN
        EXECUTE 'DELETE FROM public.subscription_renewal_alerts;';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pj_migration_requests') THEN
        EXECUTE 'DELETE FROM public.pj_migration_requests;';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lucky_numbers') THEN
        EXECUTE 'DELETE FROM public.lucky_numbers;';
    END IF;
END $$;

-- Transações e Pedidos
DELETE FROM public.transactions;
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- Limpar Assinaturas antigas
DELETE FROM public.subscriptions;

-- Zerar contador de vendas acumuladas dos produtos
UPDATE public.products SET sales = 0;


-- -------------------------------------------------------------------------
-- 2. DESVINCULAR RELACIONAMENTOS QUE APONTAM PARA USUÁRIOS A SEREM EXCLUÍDOS
-- -------------------------------------------------------------------------

-- Desvincular patrocínio (referred_by)
UPDATE public.profiles
SET referred_by = NULL
WHERE referred_by NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);

-- Desvincular revendedor (reseller_id)
UPDATE public.profiles
SET reseller_id = NULL
WHERE reseller_id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);

-- Desvincular lojista (merchant_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'merchant_id'
    ) THEN
        UPDATE public.profiles
        SET merchant_id = NULL
        WHERE merchant_id NOT IN (
            SELECT id FROM public.profiles
            WHERE 
                role IN ('owner', 'admin', 'manager')
                OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
                OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
                OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
                OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
                OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
                OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
        );
    END IF;
END $$;

-- Remover estoques, filiais e produtos vinculados a usuários excluídos
DELETE FROM public.product_stocks
WHERE branch_id IN (
    SELECT id FROM public.branches
    WHERE merchant_id NOT IN (
        SELECT id FROM public.profiles
        WHERE 
            role IN ('owner', 'admin', 'manager')
            OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
            OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
            OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
            OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
            OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
            OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
    )
);

DELETE FROM public.merchant_shipping
WHERE merchant_id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);

DELETE FROM public.categories
WHERE merchant_id IS NOT NULL AND merchant_id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);

DELETE FROM public.products
WHERE merchant_id IS NOT NULL AND merchant_id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);

DELETE FROM public.branches
WHERE merchant_id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
);


-- -------------------------------------------------------------------------
-- 3. EXCLUIR OS USUÁRIOS DE TESTE (AUTH.USERS E PROFILES)
-- -------------------------------------------------------------------------

-- Excluir de auth.users
DELETE FROM auth.users
WHERE id NOT IN (
    SELECT id FROM public.profiles
    WHERE 
        role IN ('owner', 'admin', 'manager')
        OR LOWER(COALESCE(email, '')) IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
        OR LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%silvana%jorge%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%alberto%'
        OR LOWER(COALESCE(full_name, '')) ILIKE '%carlos%lima%'
)
AND LOWER(COALESCE(email, '')) NOT IN (
    'admin@servicosurbanos.com.br', 
    'xipsdapraia23@gmail.com', 
    'agenciap4d@gmail.com', 
    'emersonantunes747@gmail.com', 
    'sjo16061973@gmail.com', 
    'carloslimaribeiro@icloud.com'
);

-- Excluir perfis órfãos em public.profiles
DELETE FROM public.profiles
WHERE 
    role NOT IN ('owner', 'admin', 'manager')
    AND LOWER(COALESCE(email, '')) NOT IN ('admin@servicosurbanos.com.br', 'xipsdapraia23@gmail.com', 'agenciap4d@gmail.com', 'emersonantunes747@gmail.com', 'sjo16061973@gmail.com', 'carloslimaribeiro@icloud.com')
    AND LOWER(COALESCE(full_name, '')) NOT ILIKE '%weider%'
    AND LOWER(COALESCE(full_name, '')) NOT ILIKE '%emerson%'
    AND LOWER(COALESCE(full_name, '')) NOT ILIKE '%silvana%jorge%'
    AND LOWER(COALESCE(full_name, '')) NOT ILIKE '%carlos%alberto%'
    AND LOWER(COALESCE(full_name, '')) NOT ILIKE '%carlos%lima%';


-- -------------------------------------------------------------------------
-- 4. CONFIGURAR STATUS DOS USUÁRIOS MANTIDOS (WEIDER E EMERSON ATIVOS)
-- -------------------------------------------------------------------------

-- Ativar Weider Oliveira
UPDATE public.profiles
SET status = 'active'
WHERE LOWER(COALESCE(full_name, '')) ILIKE '%weider%'
   OR LOWER(COALESCE(email, '')) = 'agenciap4d@gmail.com';

-- Ativar Emerson Mines Antunes
UPDATE public.profiles
SET status = 'active'
WHERE LOWER(COALESCE(full_name, '')) ILIKE '%emerson%'
   OR LOWER(COALESCE(email, '')) = 'emersonantunes747@gmail.com';

-- Criar assinatura ativa de 1 ano para Weider e Emerson para liberar painel completo
INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
SELECT id, 'anual', 0, 'active', now(), now() + interval '1 year'
FROM public.profiles
WHERE (
    LOWER(COALESCE(full_name, '')) ILIKE '%weider%' 
    OR LOWER(COALESCE(email, '')) = 'agenciap4d@gmail.com'
    OR LOWER(COALESCE(full_name, '')) ILIKE '%emerson%' 
    OR LOWER(COALESCE(email, '')) = 'emersonantunes747@gmail.com'
)
ON CONFLICT DO NOTHING;


-- -------------------------------------------------------------------------
-- 5. RECARREGAR O CACHE DO SUPABASE (POSTGREST)
-- -------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
