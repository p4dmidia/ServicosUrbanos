-- =========================================================================
-- SCRIPT DE RESET TOTAL: ZERAR DADOS/LANÇAMENTOS E DEIXAR TODOS INATIVOS
-- 
-- OBJETIVO:
--   1. Zerar todos os lançamentos financeiros (transações, comissões, saques, cashback).
--   2. Zerar todos os pedidos e dados de entrega/retirada (orders, order_extras).
--   3. Zerar todas as assinaturas (subscriptions), tornando todos os afiliados
--      e usuários inativos novamente no sistema.
--   4. Zerar logs e históricos operacionais (notificações, mensagens WhatsApp,
--      avaliações de produtos, lista de espera).
--   5. Zerar contadores de vendas acumuladas dos produtos (mantendo o catálogo).
--   6. Manter intactos: Usuários (auth.users e profiles), Lojas/Filiais (branches),
--      Produtos (products), Categorias e Configurações gerais (mmn_config, etc.).
--
-- COMO EXECUTAR:
--   Supabase Dashboard > SQL Editor > Cole este script completo e clique em RUN.
-- =========================================================================

BEGIN;

-- 1. Limpar logs operacionais e mensagens
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.merchant_waitlist;
DELETE FROM public.product_reviews;

-- 2. Limpar solicitações de saque de afiliados (se a tabela existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'affiliate_payouts'
    ) THEN
        EXECUTE 'DELETE FROM public.affiliate_payouts;';
    END IF;
END $$;

-- 3. Limpar todos os lançamentos financeiros (comissões, cashback, resgates, taxas, vendas)
DELETE FROM public.transactions;

-- 4. Limpar pedidos e códigos de retirada
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- 5. Zerar todas as assinaturas ativas -> Deixa TODOS os usuários/afiliados INATIVOS novamente
DELETE FROM public.subscriptions;

-- 6. Zerar o contador de vendas acumuladas dos produtos (mantendo produtos, preços e estoque)
UPDATE public.products SET sales = 0;

-- 7. Notificar o PostgREST para recarregar o cache de esquemas
NOTIFY pgrst, 'reload schema';

COMMIT;
