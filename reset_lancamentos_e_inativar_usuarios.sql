-- =========================================================================
-- SCRIPT DE RESET: ZERAR LANÇAMENTOS FINANCEIROS E INATIVAR USUÁRIOS
-- =========================================================================
-- OBJETIVO:
--   1. Zerar todos os lançamentos financeiros (comissões, cashback, saques, taxas).
--   2. Zerar todos os pedidos e notas fiscais de pagamento.
--   3. Inativar todos os usuários/afiliados (removendo planos e assinaturas ativas).
--   4. Limpar filas de notificações e mensagens de teste.
--   5. Zerar contadores de vendas dos produtos.
--   6. PRESERVAR: Contas cadastradas (auth.users e profiles), árvore de rede/indicações,
--      catálogo de produtos e lojas.
--
-- COMO EXECUTAR:
--   Supabase Dashboard > SQL Editor > Cole o script abaixo e clique em RUN.
-- =========================================================================

BEGIN;

-- 1. Limpar todas as transações e movimentações financeiras (Zera todos os saldos e comissões)
DELETE FROM public.transactions;

-- 2. Limpar solicitações e comprovantes de saques/pagamentos (se existirem as tabelas)
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
END $$;

-- 3. Limpar histórico de pedidos e extras de pedidos
DELETE FROM public.order_extras;
DELETE FROM public.orders;

-- 4. INATIVAR TODOS OS USUÁRIOS / AFILIADOS:
--    A. Removendo todas as assinaturas (subscriptions).
--       No sistema, a elegibilidade ativa é baseada em ter uma assinatura ativa.
--       Sem assinatura ativa, 100% dos usuários tornam-se automaticamente INATIVOS/INADIMPLENTES.
DELETE FROM public.subscriptions;

--    B. Atualizar coluna status de profiles para 'pending' (respeitando a constraint de status)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
    ) THEN
        BEGIN
            UPDATE public.profiles SET status = 'pending';
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        BEGIN
            UPDATE public.profiles SET is_active = false;
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;
END $$;

-- 5. Limpar histórico de notificações operacionais, mensagens de WhatsApp e avaliações
DELETE FROM public.notifications;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.product_reviews;
DELETE FROM public.merchant_waitlist;

-- 6. Zerar contador de vendas acumuladas nos produtos (mantendo catálogo e estoque intactos)
UPDATE public.products SET sales = 0;

-- 7. Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
