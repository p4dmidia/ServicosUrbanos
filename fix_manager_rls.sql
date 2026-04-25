-- 1. Adicionar coluna merchant_id à tabela profiles para vincular gerentes aos lojistas diretamente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.profiles(id);

-- 2. Atualizar a função de helper do RLS para ser mais inteligente
-- Ela agora busca o ID do dono via merchant_id direto ou via filial
CREATE OR REPLACE FUNCTION public.get_auth_merchant_owner_id()
RETURNS UUID AS $$
DECLARE
    found_id UUID;
    v_role TEXT;
    v_merchant_id UUID;
    v_branch_id UUID;
BEGIN
    -- Busca dados do usuário logado
    SELECT role, merchant_id, branch_id INTO v_role, v_merchant_id, v_branch_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se for dono, o ID é ele mesmo
    IF v_role = 'owner' THEN
        RETURN auth.uid();
    END IF;

    -- Se for gerente
    IF v_role = 'manager' THEN
        -- Prioridade 1: merchant_id direto no perfil (nova lógica)
        IF v_merchant_id IS NOT NULL THEN
            RETURN v_merchant_id;
        END IF;

        -- Prioridade 2: buscar através da filial (lógica legada/reserva)
        IF v_branch_id IS NOT NULL THEN
            SELECT b.merchant_id INTO found_id 
            FROM public.branches b
            WHERE b.id = v_branch_id;
            
            RETURN found_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar gerentes existentes que já possuem filial vinculada
UPDATE public.profiles p
SET merchant_id = b.merchant_id
FROM public.branches b
WHERE p.branch_id = b.id
AND p.role = 'manager'
AND p.merchant_id IS NULL;

-- 4. Notificar o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
