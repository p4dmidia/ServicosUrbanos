-- Migração para atualizar descrições históricas de Cashback/Comissões de 'Digital' e 'CD' para 'Semanal'
UPDATE public.transactions 
SET description = replace(description, 'Digital', 'Semanal') 
WHERE description LIKE '%Digital%';

UPDATE public.transactions 
SET description = replace(description, 'CD', 'Semanal') 
WHERE description LIKE '%(CD)%';

UPDATE public.transactions 
SET description = replace(description, 'CD', 'Semanal') 
WHERE description LIKE '% CD %';
