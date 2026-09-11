-- =========================================================================
-- MIGRATION: PLANO DE CARREIRA - PROMOÇÃO A REVENDEDOR REGIONAL (ANTI-DEADLOCK)
-- =========================================================================
-- REGRA DE NEGÓCIO:
-- Quando um Afiliado atinge 3 indicados diretos (G1) ativos
-- (por assinatura vigente, pedido concluído/pago ou status ativo),
-- ele é promovido automaticamente a Revendedor Regional (role = 'regional_reseller').
-- =========================================================================

-- Configurar timeout de lock seguro para evitar travamento de processos
SET lock_timeout = '10s';

-- 1. Função que avalia e promove o usuário caso tenha >= 3 indicados ativos no G1
CREATE OR REPLACE FUNCTION public.check_and_promote_to_reseller(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_active_count INTEGER := 0;
    v_current_role TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar papel atual do usuário
    SELECT role INTO v_current_role 
    FROM public.profiles 
    WHERE id = p_user_id;

    -- Apenas afiliados ou clientes comuns são promovidos (nunca alterar admin, owner ou manager)
    IF v_current_role NOT IN ('affiliate', 'customer') THEN
        RETURN FALSE;
    END IF;

    -- Contagem otimizada com EXISTS (evita cartesianos pesados e bloqueios)
    SELECT COUNT(DISTINCT p.id) INTO v_active_count
    FROM public.profiles p
    WHERE p.referred_by = p_user_id
      AND (p.status IS NULL OR p.status != 'blocked')
      AND (
          p.status = 'active'
          OR EXISTS (
              SELECT 1 FROM public.subscriptions s 
              WHERE s.profile_id = p.id AND s.status = 'active' AND s.end_date >= now()
          )
          OR EXISTS (
              SELECT 1 FROM public.orders o 
              WHERE o.customer_id = p.id AND o.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')
          )
      );

    -- Se atingiu a meta de 3 ou mais indicados ativos no G1: promove a Revendedor Regional!
    IF v_active_count >= 3 THEN
        UPDATE public.profiles
        SET 
            role = 'regional_reseller',
            reseller_id = COALESCE(reseller_id, p_user_id),
            updated_at = now()
        WHERE id = p_user_id;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função de trigger para novas assinaturas
CREATE OR REPLACE FUNCTION public.trg_career_plan_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_sponsor_id UUID;
BEGIN
    SELECT referred_by INTO v_sponsor_id
    FROM public.profiles
    WHERE id = NEW.profile_id;

    IF v_sponsor_id IS NOT NULL THEN
        PERFORM public.check_and_promote_to_reseller(v_sponsor_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atrelar trigger na tabela subscriptions
DROP TRIGGER IF EXISTS trg_career_plan_subscription_check ON public.subscriptions;
CREATE TRIGGER trg_career_plan_subscription_check
AFTER INSERT OR UPDATE OF status, end_date ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.trg_career_plan_on_subscription();

-- 4. Função e trigger para pedidos pagos/concluídos
CREATE OR REPLACE FUNCTION public.trg_career_plan_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_sponsor_id UUID;
BEGIN
    IF NEW.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído') THEN
        SELECT referred_by INTO v_sponsor_id
        FROM public.profiles
        WHERE id = NEW.customer_id;

        IF v_sponsor_id IS NOT NULL THEN
            PERFORM public.check_and_promote_to_reseller(v_sponsor_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_career_plan_order_check ON public.orders;
CREATE TRIGGER trg_career_plan_order_check
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_career_plan_on_order();

-- 5. Backfill declarativo e atômico (sem loop de cursor, 100% livre de deadlock)
UPDATE public.profiles
SET 
    role = 'regional_reseller',
    reseller_id = COALESCE(reseller_id, id),
    updated_at = now()
WHERE role IN ('affiliate', 'customer')
  AND (
      SELECT COUNT(DISTINCT p.id)
      FROM public.profiles p
      WHERE p.referred_by = public.profiles.id
        AND (p.status IS NULL OR p.status != 'blocked')
        AND (
            p.status = 'active'
            OR EXISTS (
                SELECT 1 FROM public.subscriptions s 
                WHERE s.profile_id = p.id AND s.status = 'active' AND s.end_date >= now()
            )
            OR EXISTS (
                SELECT 1 FROM public.orders o 
                WHERE o.customer_id = p.id AND o.status IN ('Pago', 'Pago, Aguardando Retirada', 'Concluído')
            )
        )
  ) >= 3;

-- 6. Recarregar o cache do schema do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
