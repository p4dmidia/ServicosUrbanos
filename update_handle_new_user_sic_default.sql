-- ==============================================================================
-- ATUALIZAÇÃO DO TRIGGER HANDLE_NEW_USER COM FALLBACK PARA A SIC COMÉRCIO
-- ID DA SIC COMÉRCIO: '194e5265-cdb6-431f-9f77-8888b1ee74ae'
-- CÓDIGO DA SIC COMÉRCIO: 'A03A7B'
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  v_default_company_id UUID := '194e5265-cdb6-431f-9f77-8888b1ee74ae'::uuid;
  v_sponsor_id UUID;
  v_reseller_id UUID;
  v_ref_raw TEXT;
  v_rev_raw TEXT;
BEGIN
  -- 1. Tratar patrocinador MMN
  v_ref_raw := NULLIF(TRIM(new.raw_user_meta_data->>'referred_by'), '');
  IF v_ref_raw IS NOT NULL THEN
    BEGIN
      v_sponsor_id := v_ref_raw::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_sponsor_id := v_default_company_id;
    END;
  ELSE
    v_sponsor_id := v_default_company_id;
  END IF;

  -- 2. Tratar Revendedor Regional
  v_rev_raw := NULLIF(TRIM(new.raw_user_meta_data->>'reseller_id'), '');
  IF v_rev_raw IS NOT NULL THEN
    BEGIN
      v_reseller_id := v_rev_raw::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_reseller_id := v_default_company_id;
    END;
  ELSE
    v_reseller_id := v_default_company_id;
  END IF;

  -- Não vincular a empresa a si mesma se ela própria for o novo usuário
  IF new.id = v_default_company_id THEN
    v_sponsor_id := NULL;
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

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-vincular trigger ao auth.users se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir que a Sic Comércio tenha assinatura ativa vitalícia registrada
INSERT INTO public.subscriptions (
  id,
  profile_id,
  plan_type,
  amount,
  status,
  start_date,
  end_date
)
VALUES (
  '194e5265-0000-0000-0000-000000000001'::uuid,
  '194e5265-cdb6-431f-9f77-8888b1ee74ae'::uuid,
  'anual',
  0,
  'active',
  NOW(),
  NOW() + INTERVAL '100 years'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  end_date = NOW() + INTERVAL '100 years';
