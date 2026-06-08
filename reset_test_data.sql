-- SCRIPT PARA ZERAR DADOS DE TESTE (Mantendo Usuários, Lojas e Produtos)
-- Execute este script no SQL Editor do Supabase (Projeto: ioslywxfppswfuzxzwkn)

-- 1. Remover notificações de teste
DELETE FROM public.notifications;

-- 2. Remover avaliações de produtos de teste
DELETE FROM public.product_reviews;

-- 3. Remover transações financeiras (comissões, saques, cashback, etc.)
DELETE FROM public.transactions;

-- 4. Remover códigos de retirada de pedidos
DELETE FROM public.order_extras;

-- 5. Remover todos os pedidos
DELETE FROM public.orders;

-- 6. Opcional: Zerar a contagem de vendas acumuladas dos produtos (mantendo o produto e estoque)
UPDATE public.products SET sales = 0;

-- 7. Recarregar o schema do PostgREST para atualizar o cache da API
NOTIFY pgrst, 'reload schema';
