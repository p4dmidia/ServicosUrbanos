-- Limpa assinaturas anteriores dos usuários de teste para evitar duplicados
DELETE FROM public.subscriptions 
WHERE profile_id IN (
  '33b4bdfe-e9b0-4c9a-af7f-a0b2fd044196', -- Anselmo Ribeiro
  'e8ae8253-6bca-4e18-9576-eac9bbe5cef5', -- Weider de Oliveira
  '194e5265-cdb6-431f-9f77-8888b1ee74ae', -- Sic Comercio
  'c05669e6-b65d-4703-899f-6055b89dd44b'  -- teste2
);

-- Insere as novas assinaturas ativas diretamente para os usuários de teste
INSERT INTO public.subscriptions (profile_id, plan_type, amount, status, start_date, end_date)
VALUES 
('33b4bdfe-e9b0-4c9a-af7f-a0b2fd044196', 'mensal', 20, 'active', '2026-08-28 00:00:00+00', '2026-09-27 23:59:59+00'),
('e8ae8253-6bca-4e18-9576-eac9bbe5cef5', 'trimestral', 30, 'active', '2026-08-27 00:00:00+00', '2026-11-25 23:59:59+00'),
('194e5265-cdb6-431f-9f77-8888b1ee74ae', 'mensal', 20, 'active', '2026-08-27 00:00:00+00', '2026-09-26 23:59:59+00'),
('c05669e6-b65d-4703-899f-6055b89dd44b', 'semestral', 40, 'active', '2026-08-27 00:00:00+00', '2027-02-23 23:59:59+00');
