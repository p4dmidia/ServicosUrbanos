-- =========================================================================
-- MIGRATION: SINCRONIZAÇÃO COMPLETA DE E-MAILS EM PUBLIC.PROFILES
-- =========================================================================
-- OBJETIVO:
-- 1. Sincronizar todos os e-mails de auth.users para public.profiles que
--    estiverem como NULL ou vazios (ex: compradores de pedidos como jose005.996).
-- 2. Atualizar a trigger handle_new_user() para que qualquer novo cadastro
--    grave o e-mail automaticamente em public.profiles.
--
-- COMO EXECUTAR:
-- Supabase Dashboard > SQL Editor > Cole e execute este script.
-- =========================================================================

-- 1. Garantir que a coluna email existe na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Sincronizar imediatamente todos os emails nulos ou vazios de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id 
  AND (p.email IS NULL OR p.email = '' OR p.email = 'Não informado');

-- 3. Atualizar a função handle_new_user para sempre gravar o email no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role, referral_code, referred_by, reseller_id,
    whatsapp, cpf, address, number, neighborhood, city, state, zip_code,
    birth_date, gender,
    bank_name, bank_branch, bank_account, pix_key
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    COALESCE(new.raw_user_meta_data->>'referral_code', upper(substring(md5(random()::text) from 1 for 6))),
    (new.raw_user_meta_data->>'referred_by')::uuid,
    (new.raw_user_meta_data->>'reseller_id')::uuid,
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'number',
    new.raw_user_meta_data->>'neighborhood',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code',
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'bank_name',
    new.raw_user_meta_data->>'bank_branch',
    new.raw_user_meta_data->>'bank_account',
    new.raw_user_meta_data->>'pix_key'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notificar recarregamento do schema
NOTIFY pgrst, 'reload schema';
