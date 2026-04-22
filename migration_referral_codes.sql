-- MIGRATION: ADICIONAR CÓDIGO DE INDICAÇÃO AMIGÁVEL
-- OBJETIVO: Trocar UUIDs por códigos de 6 caracteres (ex: A1B2C3)

-- 1. Adicionar a coluna referral_code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Função para gerar código alfanumérico único de 6 caracteres
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    is_unique BOOLEAN;
BEGIN
    LOOP
        -- Gera 6 caracteres alfanuméricos aleatórios
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Garante que não existe conflito
        SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO is_unique;
        
        IF is_unique THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Preencher códigos para usuários existentes
UPDATE public.profiles SET referral_code = generate_unique_referral_code() WHERE referral_code IS NULL;

-- 4. Atualizar o gatilho de novo usuário para incluir o código
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    referral_code,
    whatsapp,
    cpf,
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
    generate_unique_referral_code(),
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'cpf',
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

-- Comentário: Execute este bloco no SQL Editor do Supabase.
