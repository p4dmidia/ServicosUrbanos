-- Atualizar a função handle_new_user para capturar dados bancários durante o cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, role, referral_code, referred_by, 
    whatsapp, cpf, address, number, neighborhood, city, state, zip_code,
    birth_date, gender,
    bank_name, bank_branch, bank_account, pix_key
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    COALESCE(new.raw_user_meta_data->>'referral_code', upper(substring(md5(random()::text) from 1 for 6))),
    (new.raw_user_meta_data->>'referred_by')::uuid,
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
