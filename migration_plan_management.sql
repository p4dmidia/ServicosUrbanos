-- 1. Adicionar colunas de suporte a assinatura na tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Adicionar restrição check se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_plan_type_check'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_plan_type_check CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual'));
    END IF;
END
$$;

-- 2. Limpar planos antigos que possam ter sido criados manualmente sem estes campos
DELETE FROM public.products WHERE category = 'Assinatura' OR is_subscription = true;

-- 3. Inserir os 4 planos iniciais de assinatura diretamente na tabela products
INSERT INTO public.products (name, category, price, stock, sales, cashback, status, image, is_subscription, plan_type, duration_days, branch_id)
VALUES 
('Plano Mensal', 'Assinatura', 20.00, 999999, 0, 0.00, 'Ativo', '📅', true, 'mensal', 30, NULL),
('Plano Trimestral', 'Assinatura', 30.00, 999999, 0, 0.00, 'Ativo', '🌟', true, 'trimestral', 90, NULL),
('Plano Semestral', 'Assinatura', 40.00, 999999, 0, 0.00, 'Ativo', '💼', true, 'semestral', 180, NULL),
('Plano Anual', 'Assinatura', 60.00, 999999, 0, 0.00, 'Ativo', '🏆', true, 'anual', 365, NULL);
