-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('sale', 'order', 'stock', 'system')) DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Função auxiliar para notificar equipe da filial
CREATE OR REPLACE FUNCTION public.notify_branch_staff(p_branch_id UUID, p_title TEXT, p_message TEXT, p_type TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, p_title, p_message, p_type
    FROM public.profiles
    WHERE branch_id = p_branch_id AND role IN ('owner', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Notificação de Novo Pedido
CREATE OR REPLACE FUNCTION public.handle_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.branch_id IS NOT NULL THEN
        PERFORM public.notify_branch_staff(
            NEW.branch_id,
            'Novo Pedido Recebido',
            'O pedido #' || NEW.id || ' de ' || COALESCE(NEW.customer_name, 'Cliente') || ' acaba de chegar.',
            'order'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created_notification ON public.orders;
CREATE TRIGGER on_order_created_notification
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_order_notification();

-- 2. Notificação de Venda Concluída
CREATE OR REPLACE FUNCTION public.handle_order_completed_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status <> 'Concluído' AND NEW.status = 'Concluído') AND NEW.branch_id IS NOT NULL THEN
        PERFORM public.notify_branch_staff(
            NEW.branch_id,
            'Venda Confirmada! 💰',
            'O pagamento do pedido #' || NEW.id || ' foi confirmado e a venda concluída.',
            'sale'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_completed_notification ON public.orders;
CREATE TRIGGER on_order_completed_notification
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_completed_notification();

-- 3. Notificação de Alerta de Estoque
CREATE OR REPLACE FUNCTION public.handle_stock_alert_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta quando o estoque fica abaixo ou igual a 5 unidades
    IF (NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL)) AND NEW.branch_id IS NOT NULL THEN
        PERFORM public.notify_branch_staff(
            NEW.branch_id,
            'Alerta de Estoque Baixo ⚠️',
            'O produto "' || NEW.name || '" está com apenas ' || NEW.stock || ' unidades em estoque.',
            'stock'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_stock_alert_notification ON public.products;
CREATE TRIGGER on_stock_alert_notification
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_stock_alert_notification();
