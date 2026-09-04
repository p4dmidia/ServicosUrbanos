-- ==============================================================================
-- ATUALIZAÇÃO DO TRIGGER HANDLE_NEW_USER (SEM ATRIBUIÇÃO FORÇADA DE FALLBACK)
-- Vendas e cadastros diretos pela internet sem indicação ficam com referred_by e reseller_id como NULL.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  v_sponsor_id UUID := NULL;
  v_reseller_id UUID := NULL;
  v_ref_raw TEXT;
  v_rev_raw TEXT;
BEGIN
  -- 1. Tratar patrocinador MMN (apenas se explicitamente fornecido)
  v_ref_raw := NULLIF(TRIM(new.raw_user_meta_data->>'referred_by'), '');
  IF v_ref_raw IS NOT NULL THEN
    BEGIN
      v_sponsor_id := v_ref_raw::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_sponsor_id := NULL;
    END;
  END IF;

  -- 2. Tratar Revendedor Regional (apenas se explicitamente fornecido)
  v_rev_raw := NULLIF(TRIM(new.raw_user_meta_data->>'reseller_id'), '');
  IF v_rev_raw IS NOT NULL THEN
    BEGIN
      v_reseller_id := v_rev_raw::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_reseller_id := NULL;
    END;
  END IF;

  -- Não permitir auto-referência
  IF new.id = v_sponsor_id THEN
    v_sponsor_id := NULL;
  END IF;
  IF new.id = v_reseller_id THEN
    v_reseller_id := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    referral_code, 
    referred_by, 
    reseller_id,
    whatsapp, 
    cpf, 
    address, 
    number, 
    neighborhood, 
    city, 
    state, 
    zip_code,
    bank_name,
    bank_branch,
    bank_account,
    pix_key
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(new.raw_user_meta_data->>'role', 'affiliate'),
    COALESCE(new.raw_user_meta_data->>'referral_code', upper(substring(md5(random()::text) from 1 for 6))),
    v_sponsor_id,
    v_reseller_id,
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'number',
    new.raw_user_meta_data->>'neighborhood',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code',
    new.raw_user_meta_data->>'bank_name',
    new.raw_user_meta_data->>'bank_branch',
    new.raw_user_meta_data->>'bank_account',
    new.raw_user_meta_data->>'pix_key'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    referred_by = COALESCE(profiles.referred_by, EXCLUDED.referred_by),
    reseller_id = COALESCE(profiles.reseller_id, EXCLUDED.reseller_id),
    whatsapp = EXCLUDED.whatsapp,
    cpf = EXCLUDED.cpf,
    address = EXCLUDED.address,
    number = EXCLUDED.number,
    neighborhood = EXCLUDED.neighborhood,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    bank_name = EXCLUDED.bank_name,
    bank_branch = EXCLUDED.bank_branch,
    bank_account = EXCLUDED.bank_account,
    pix_key = EXCLUDED.pix_key;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reanexar o trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
