-- Adicionar colunas necessárias à tabela profiles (incluindo endereço)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'blocked', 'pending')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Atualizar a função handle_new_user para capturar metadados completos durante o cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
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
