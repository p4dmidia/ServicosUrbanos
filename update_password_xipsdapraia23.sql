-- =========================================================================
-- ATUALIZAÇÃO DE SENHA DO USUÁRIO xipsdapraia23@gmail.com
-- Nova Senha: 12345@@@
--
-- COMO EXECUTAR:
-- 1. Abra o painel do Supabase.
-- 2. Vá em SQL Editor > New query.
-- 3. Cole este script e clique em RUN.
-- =========================================================================

BEGIN;

-- 1. Atualizar a senha criptografada no schema auth.users e confirmar o e-mail
UPDATE auth.users
SET 
  encrypted_password = extensions.crypt('12345@@@', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  banned_until = NULL,
  updated_at = now()
WHERE email = 'xipsdapraia23@gmail.com';

-- 2. Garantir que o perfil público esteja com status 'active'
UPDATE public.profiles
SET 
  status = 'active',
  updated_at = now()
WHERE email = 'xipsdapraia23@gmail.com';

-- 3. Recarregar o cache do schema
NOTIFY pgrst, 'reload schema';

COMMIT;
