-- =========================================================================
-- MIGRATION: VIEW public.commissions + backfill order_id
-- OBJETIVO: Corrigir comissões vazias no modal "Extrato de Auditoria Financeira"
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   1) Execute ESTE arquivo (fix_commissions_view.sql)
--   2) Execute em seguida fix_commission_logic.sql (trigger + order_id em novos inserts)
-- =========================================================================

-- 0. Garantir coluna order_id em transactions (necessária para filtro por pedido)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_order_id
  ON public.transactions(order_id)
  WHERE type = 'commission';

-- 1. Limpar tabela ou view antiga de comissões
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'commissions' AND n.nspname = 'public' AND c.relkind = 'r'
    ) THEN
        DROP TABLE public.commissions CASCADE;
    ELSIF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'commissions' AND n.nspname = 'public' AND c.relkind = 'v'
    ) THEN
        DROP VIEW public.commissions CASCADE;
    END IF;
END $$;

-- 2. View de comissões a partir de transactions (Cashback tri-split + Comissão MMN legado)
CREATE OR REPLACE VIEW public.commissions AS
SELECT
    t.id,
    t.profile_id AS affiliate_id,
    t.amount,
    t.status,
    t.description,
    COALESCE(t.order_id, substring(t.description FROM 'Pedido #([A-Za-z0-9\-]+)')) AS order_id,
    CASE
        WHEN t.description LIKE 'Comissão MMN%' THEN
            GREATEST(COALESCE(substring(t.description FROM 'Nível ([0-9]+)')::integer, 1), 1)
        ELSE
            GREATEST(COALESCE(substring(t.description FROM 'Nível ([0-9]+)')::integer, 0) + 1, 1)
    END AS level,
    t.created_at
FROM public.transactions t
WHERE t.type = 'commission'
  AND (t.description LIKE 'Cashback%' OR t.description LIKE 'Comissão MMN%');

COMMENT ON VIEW public.commissions IS
  'Comissões MMN/cashback por pedido. affiliate_id = profile_id do afiliado. Filtre por order_id.';

-- 3. Backfill: order_id em transações antigas (extraído da descrição)
UPDATE public.transactions
SET order_id = substring(description FROM 'Pedido #([A-Za-z0-9\-]+)')
WHERE type = 'commission'
  AND order_id IS NULL
  AND description LIKE '%Pedido #%';

-- 4. Permissões para leitura via API (PostgREST)
GRANT SELECT ON public.commissions TO authenticated;
GRANT SELECT ON public.commissions TO service_role;

-- Próximo passo: execute fix_commission_logic.sql para atualizar o trigger handle_order_payment.
