-- ADICIONAR COLUNA EMAIL E SINCRONIZAÇÃO
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna de email na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Atualizar a função handle_new_user para capturar o email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    role, 
    cpf, 
    whatsapp, 
    address, 
    number, 
    neighborhood, 
    city, 
    state, 
    zip_code
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, -- Pega o email diretamente do auth.users
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'number',
    new.raw_user_meta_data->>'neighborhood',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. (Opcional) Sincronizar emails de usuários já cadastrados
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
