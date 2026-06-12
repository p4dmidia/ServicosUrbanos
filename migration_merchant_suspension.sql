-- 1. Função de apoio SECURITY DEFINER para verificar se uma filial está ativa
CREATE OR REPLACE FUNCTION public.is_branch_active(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Se b_id for nulo, refere-se à Matriz/Sem Filial (portanto ativo por padrão)
    IF b_id IS NULL THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.branches
        WHERE id = b_id AND COALESCE(status, 'active') = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar política de leitura de produtos
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;

CREATE POLICY "products_select_policy" ON public.products 
FOR SELECT 
USING (
    -- Clientes/Público: vêm produtos ativos de filiais ativas
    (status = 'Ativo' AND public.is_branch_active(branch_id))
    OR
    -- Equipe da Filial/Admins: vêm produtos próprios mesmo que inativos/suspensos
    (
        auth.uid() = merchant_id
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.branch_id = products.branch_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    )
);

-- 3. Trigger para bloquear novos pedidos para filiais suspensas
CREATE OR REPLACE FUNCTION public.check_order_branch_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.branch_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.branches
            WHERE id = NEW.branch_id AND COALESCE(status, 'active') = 'active'
        ) THEN
            RAISE EXCEPTION 'Esta filial/lojista está suspensa e não pode receber novos pedidos.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_branch_active ON public.orders;
CREATE TRIGGER trg_check_order_branch_active
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_branch_active();

NOTIFY pgrst, 'reload schema';
