-- SCRIPT DE TESTE: VALIDAÇÃO DE DISTRIBUIÇÃO MMN (DINÂMICO)
-- Instruções: Execute este script no SQL Editor do Supabase.
-- Ele tentará usar usuários reais existentes no seu banco de dados para o teste.

DO $$
DECLARE
    u1 UUID;
    u2 UUID;
    u3 UUID;
    cust_id UUID;
    order_id TEXT := 'TEST-ORDER-DYNAMIC-' || floor(random() * 1000000)::text;
BEGIN
    -- 1. Buscar os primeiros 4 usuários disponíveis no banco
    SELECT id INTO u1 FROM public.profiles LIMIT 1 OFFSET 0;
    SELECT id INTO u2 FROM public.profiles LIMIT 1 OFFSET 1;
    SELECT id INTO u3 FROM public.profiles LIMIT 1 OFFSET 2;
    SELECT id INTO cust_id FROM public.profiles LIMIT 1 OFFSET 3;

    -- 2. Verificar se temos usuários suficientes para o teste
    IF u1 IS NULL OR u2 IS NULL OR u3 IS NULL OR cust_id IS NULL THEN
        RAISE EXCEPTION 'Você precisa de pelo menos 4 usuários cadastrados na tabela profiles para rodar este teste de hierarquia completa.';
    END IF;

    -- 3. Criar a Hierarquia Temporária para o Teste
    -- U1 (Pai) -> U2 (Filho) -> U3 (Neto) -> CUST (Bisneto/Cliente)
    UPDATE public.profiles SET referred_by = NULL WHERE id = u1;
    UPDATE public.profiles SET referred_by = u1 WHERE id = u2;
    UPDATE public.profiles SET referred_by = u2 WHERE id = u3;
    UPDATE public.profiles SET referred_by = u3 WHERE id = cust_id;

    RAISE NOTICE 'Hierarquia montada: % -> % -> % -> %', u1, u2, u3, cust_id;

    -- 4. Criar um Pedido de Teste para o Cliente
    INSERT INTO public.orders (id, customer_id, customer_name, amount, status)
    VALUES (order_id, cust_id, 'Cliente Teste Dinâmico', 1000.00, 'Pendente');

    -- 5. Simular o Pagamento (Mudar para Concluído)
    -- Isso deve disparar o trigger 'on_order_completed' e distribuir as comissões
    UPDATE public.orders SET status = 'Concluído' WHERE id = order_id;

    RAISE NOTICE 'Pedido % concluído e comissões disparadas.', order_id;

END $$;

-- 6. Verificar Resultados
-- Este SELECT mostrará as comissões geradas para o último pedido de teste
SELECT 
    t.created_at,
    p.full_name as recebedor,
    t.description,
    t.amount as valor_comissao,
    t.type
FROM public.transactions t
JOIN public.profiles p ON t.profile_id = p.id
WHERE t.description LIKE '%TEST-ORDER-DYNAMIC-%'
ORDER BY t.created_at DESC
LIMIT 10;
