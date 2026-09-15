-- =========================================================================
-- MIGRATION: REMOVER PLANO DE CARREIRA AUTOMÁTICO (AFILIADO -> REVENDEDOR)
-- =========================================================================
-- REGRA DE NEGÓCIO:
-- A promoção para Revendedor Regional não ocorre mais de forma automática
-- com base em 3 indicados no G1.
-- O papel de Revendedor Regional (role = 'regional_reseller') passa a ser
-- atribuído EXCLUSIVAMENTE de forma manual pelos Administradores no Painel Admin.
-- =========================================================================

-- 1. Remover triggers automáticas
DROP TRIGGER IF EXISTS trg_career_plan_subscription_check ON public.subscriptions;
DROP TRIGGER IF EXISTS trg_career_plan_order_check ON public.orders;

-- 2. Remover funções associadas
DROP FUNCTION IF EXISTS public.trg_career_plan_on_subscription();
DROP FUNCTION IF EXISTS public.trg_career_plan_on_order();
DROP FUNCTION IF EXISTS public.check_and_promote_to_reseller(UUID);
