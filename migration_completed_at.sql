-- =========================================================================
-- MIGRATION: ADD completed_at TO orders AND SET TRIGGER
-- OBJETIVO: Registrar a data/hora exata em que o pedido foi concluído (saída de estoque).
--
-- COMO EXECUTAR (Supabase Dashboard > SQL Editor):
--   Cole e execute este script completo
-- =========================================================================

-- 1. Adicionar a coluna completed_at na tabela orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Atualizar os pedidos já concluídos para terem completed_at igual a order_date como fallback
UPDATE public.orders 
SET completed_at = order_date 
WHERE status = 'Concluído' AND completed_at IS NULL;

-- 3. Criar a função do trigger para definir completed_at automaticamente
CREATE OR REPLACE FUNCTION public.set_order_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status foi alterado para 'Concluído'
    IF NEW.status = 'Concluído' AND (OLD.status IS NULL OR OLD.status <> 'Concluído') THEN
        NEW.completed_at = timezone('utc'::text, now());
    -- Se o status mudou de 'Concluído' para outra coisa (ex: cancelado ou estornado)
    ELSIF NEW.status <> 'Concluído' AND OLD.status = 'Concluído' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar o trigger
DROP TRIGGER IF EXISTS tr_set_order_completed_at ON public.orders;
CREATE TRIGGER tr_set_order_completed_at
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_completed_at();

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
