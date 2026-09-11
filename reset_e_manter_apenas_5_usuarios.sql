-- =========================================================================
-- SCRIPT DE RESET OPERACIONAL E MANUTENÇÃO DE USUÁRIOS SELECIONADOS
-- =========================================================================
-- OBJETIVO:
--   1. Zerar todos os lançamentos financeiros, pedidos, notas fiscais,
--      assinaturas ativas, transações e mensagens.
--   2. Inativar os usuários mantidos (status = 'pending' e sem assinatura ativa).
--   3. Manter APENAS os 5 usuários especificados (+ admin@servicosurbanos.com.br):
--      - Emerson Mines Antunes        (emersonantunes747@gmail.com)
--      - Carlos Alberto Gomes Lima R. (carloslimaribeiro@icloud.com)
--      - Silvana Jorge de Oliveira    (sjo16061973@gmail.com)
--      - Serviços Urbanos Tecnologia  (xipsdapraia23@gmail.com)
--      - Weider de Oliveira           (agenciap4d@gmail.com)
--   4. Excluir com segurança todos os demais usuários (auth.users e profiles).
--
-- COMO EXECUTAR:
--   Acesse o painel do Supabase > SQL Editor > Cole e execute este script.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. ZERAR TODOS OS LANÇAMENTOS E DADOS OPERACIONAIS
-- -------------------------------------------------------------------------

-- Notificações, mensagens e filas de teste
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.product_reviews;
DELETE FROM public.merchant_waitlist;

-- Pagamentos, notas fiscais e alertas de renovação (se as tabelas existirem)
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

-- Transações financeiras e pedidos (zera todo saldo, comissão e cashback)
DELETE FROM public.transactions;
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- Zerar todas as assinaturas (inativa os planos e cobertura de seguro coletivo)
DELETE FROM public.subscriptions;

-- Zerar contador de vendas acumuladas dos produtos mantidos
UPDATE public.products SET sales = 0;


-- -------------------------------------------------------------------------
-- 2. DESFAZER VÍNCULOS E INFRAESTRUTURA DOS USUÁRIOS QUE SERÃO EXCLUÍDOS
--    (Garante integridade referencial para não violar chaves estrangeiras)
-- -------------------------------------------------------------------------

-- Desvincular indicações e revendedores que apontam para usuários que serão excluídos
UPDATE public.profiles
SET referred_by = NULL
WHERE referred_by NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);

UPDATE public.profiles
SET reseller_id = NULL
WHERE reseller_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);

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
            WHERE LOWER(email) IN (
                'emersonantunes747@gmail.com',
                'carloslimaribeiro@icloud.com',
                'sjo16061973@gmail.com',
                'xipsdapraia23@gmail.com',
                'agenciap4d@gmail.com',
                'admin@servicosurbanos.com.br'
            )
        );
    END IF;
END $$;

-- Remover estoques, filiais e produtos que pertençam a lojistas excluídos
DELETE FROM public.product_stocks
WHERE branch_id IN (
    SELECT id FROM public.branches
    WHERE merchant_id NOT IN (
        SELECT id FROM public.profiles 
        WHERE LOWER(email) IN (
            'emersonantunes747@gmail.com',
            'carloslimaribeiro@icloud.com',
            'sjo16061973@gmail.com',
            'xipsdapraia23@gmail.com',
            'agenciap4d@gmail.com',
            'admin@servicosurbanos.com.br'
        )
    )
);

DELETE FROM public.merchant_shipping
WHERE merchant_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);

DELETE FROM public.categories
WHERE merchant_id IS NOT NULL AND merchant_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);

DELETE FROM public.products
WHERE merchant_id IS NOT NULL AND merchant_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);

DELETE FROM public.branches
WHERE merchant_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(email) IN (
        'emersonantunes747@gmail.com',
        'carloslimaribeiro@icloud.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'agenciap4d@gmail.com',
        'admin@servicosurbanos.com.br'
    )
);


-- -------------------------------------------------------------------------
-- 3. EXCLUIR TODOS OS DEMAIS USUÁRIOS (AUTH.USERS E PROFILES)
-- -------------------------------------------------------------------------

-- Exclusão na autenticação (o CASCADE remove os profiles vinculados)
DELETE FROM auth.users
WHERE LOWER(email) NOT IN (
    'emersonantunes747@gmail.com',
    'carloslimaribeiro@icloud.com',
    'sjo16061973@gmail.com',
    'xipsdapraia23@gmail.com',
    'agenciap4d@gmail.com',
    'admin@servicosurbanos.com.br'
) OR email IS NULL;

-- Exclusão de qualquer perfil órfão remanescente em public.profiles
DELETE FROM public.profiles
WHERE LOWER(email) NOT IN (
    'emersonantunes747@gmail.com',
    'carloslimaribeiro@icloud.com',
    'sjo16061973@gmail.com',
    'xipsdapraia23@gmail.com',
    'agenciap4d@gmail.com',
    'admin@servicosurbanos.com.br'
) OR email IS NULL;


-- -------------------------------------------------------------------------
-- 4. INATIVAR OS USUÁRIOS MANTIDOS
--    (Define status como 'pending' para que fiquem inativos / pendentes)
-- -------------------------------------------------------------------------
UPDATE public.profiles
SET status = 'pending'
WHERE LOWER(email) != 'admin@servicosurbanos.com.br';


-- -------------------------------------------------------------------------
-- 5. RECARREGAR O CACHE DO SUPABASE (POSTGREST)
-- -------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
