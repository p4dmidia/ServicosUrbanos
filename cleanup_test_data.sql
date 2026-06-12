-- =========================================================================
-- SCRIPT DE LIMPEZA E RESET DE DADOS OPERACIONAIS
-- OBJETIVO: Remover todas as transações, vendas, comissões, notificações e
--           mensagens, mantendo apenas os afiliados especificados.
--
-- COMO EXECUTAR: Supabase Dashboard > SQL Editor > Colar e Executar
-- =========================================================================

BEGIN;

-- =========================================================================
-- 1. LIMPAR DADOS OPERACIONAIS E DE VENDAS DE TODOS OS USUÁRIOS
-- =========================================================================
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.merchant_waitlist;
DELETE FROM public.product_reviews;
DELETE FROM public.affiliate_payouts;
DELETE FROM public.transactions;
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- =========================================================================
-- 2. DESFAZER VÍNCULOS DE GERENCIAMENTO AUTOREFERENCIADOS EM PROFILES
--    (Corrige o erro de constraint profiles_merchant_id_fkey)
-- =========================================================================

-- Zerar merchant_id de perfis que serão removidos ou que apontam para perfis removidos
UPDATE public.profiles
SET merchant_id = NULL
WHERE merchant_id IN (
    SELECT id FROM public.profiles
    WHERE LOWER(email) NOT IN (
        'emersonantunes747@gmail.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'admin@servicosurbanos.com.br'
    ) OR email IS NULL
)
OR LOWER(email) NOT IN (
    'emersonantunes747@gmail.com',
    'sjo16061973@gmail.com',
    'xipsdapraia23@gmail.com',
    'admin@servicosurbanos.com.br'
)
OR email IS NULL;

-- =========================================================================
-- 3. REMOVER INFRAESTRUTURA/VÍNCULOS DOS LOJISTAS A SEREM EXCLUÍDOS
--    (Evita violações de chave estrangeira em tabelas filhas)
-- =========================================================================

-- A. Remover estoques de filiais dos lojistas excluídos
DELETE FROM public.product_stocks
WHERE branch_id IN (
    SELECT id FROM public.branches
    WHERE merchant_id IN (
        SELECT id FROM public.profiles
        WHERE LOWER(email) NOT IN (
            'emersonantunes747@gmail.com',
            'sjo16061973@gmail.com',
            'xipsdapraia23@gmail.com',
            'admin@servicosurbanos.com.br'
        ) OR email IS NULL
    )
);

-- B. Remover envios/fretes configurados pelos lojistas excluídos
DELETE FROM public.merchant_shipping
WHERE merchant_id IN (
    SELECT id FROM public.profiles
    WHERE LOWER(email) NOT IN (
        'emersonantunes747@gmail.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'admin@servicosurbanos.com.br'
    ) OR email IS NULL
);

-- C. Remover produtos cadastrados pelos lojistas excluídos
DELETE FROM public.products
WHERE merchant_id IN (
    SELECT id FROM public.profiles
    WHERE LOWER(email) NOT IN (
        'emersonantunes747@gmail.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'admin@servicosurbanos.com.br'
    ) OR email IS NULL
);

-- D. Remover categorias cadastradas pelos lojistas excluídos
DELETE FROM public.categories
WHERE merchant_id IN (
    SELECT id FROM public.profiles
    WHERE LOWER(email) NOT IN (
        'emersonantunes747@gmail.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'admin@servicosurbanos.com.br'
    ) OR email IS NULL
);

-- E. Remover filiais (branches) vinculadas aos lojistas excluídos
DELETE FROM public.branches
WHERE merchant_id IN (
    SELECT id FROM public.profiles
    WHERE LOWER(email) NOT IN (
        'emersonantunes747@gmail.com',
        'sjo16061973@gmail.com',
        'xipsdapraia23@gmail.com',
        'admin@servicosurbanos.com.br'
    ) OR email IS NULL
);

-- =========================================================================
-- 4. ZERAR METADADOS DOS PRODUTOS DOS USUÁRIOS QUE FICARAM
-- =========================================================================
UPDATE public.products SET sales = 0;

-- =========================================================================
-- 5. REMOVER USUÁRIOS DE AUTH.USERS E SEUS PERFIS
-- =========================================================================
DELETE FROM auth.users
WHERE LOWER(email) NOT IN (
    'emersonantunes747@gmail.com',
    'sjo16061973@gmail.com',
    'xipsdapraia23@gmail.com',
    'admin@servicosurbanos.com.br'
) OR email IS NULL;

-- =========================================================================
-- 6. ATUALIZAR ESQUEMA
-- =========================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
