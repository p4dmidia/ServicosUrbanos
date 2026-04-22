-- =========================================================
-- SCRIPT FINAL DE FIX: RLS SEM RECURSÃO E VÍNCULO DE INDICAÇÃO
-- Projeto: Serviços Urbanos (ioslywxfppswfuzxzwkn)
-- =========================================================

-- 1. LIMPEZA TOTAL DE POLÍTICAS ANTERIORES PARA EVITAR CONFLITOS
DROP POLICY IF EXISTS "VISIBILIDADE_PERFIS_MMN" ON public.profiles;
DROP POLICY IF EXISTS "ADMIN_VER_TUDO" ON public.profiles;
DROP POLICY IF EXISTS "EDICAO_PROPRIO_PERFIL" ON public.profiles;
DROP POLICY IF EXISTS "PERMISSAO_TOTAL_PROPRIO_PERFIL" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Afiliados veem seus indicados" ON public.profiles;
DROP POLICY IF EXISTS "Visibilidade Total de Rede" ON public.profiles;
DROP POLICY IF EXISTS "VER_MEUS_INDICADOS" ON public.profiles;
DROP POLICY IF EXISTS "PERMISSAO_TOTAL_PROPRIO_PERFIL" ON public.profiles;

-- 2. FUNÇÕES DE APOIO "SECURITY DEFINER" (QUEBRAM A RECURSÃO)
-- Estas funções rodam com permissão de sistema para buscar dados sem disparar o RLS novamente.

CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_referral_code() 
RETURNS text AS $$
  SELECT referral_code FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. POLÍTICAS DA TABELA PROFILES (PERFIS)

-- Permissão de Leitura (SELECT)
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  id = auth.uid()                             -- Ver a si mesmo
  OR public.get_auth_role() IN ('owner', 'manager') -- Admins veem tudo
  OR referred_by::text = auth.uid()::text     -- Ver indicados por UUID
  OR referred_by::text = public.get_auth_referral_code() -- Ver indicados por Código
);

-- Permissão de Edição (UPDATE)
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permissão de Inserção (INSERT)
CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- 4. POLÍTICAS DE TRANSAÇÕES E PEDIDOS (DASHBOARD)
-- Removemos as antigas e aplicamos as novas usando a função de Cargo

DROP POLICY IF EXISTS "VER_MINHAS_TRANSACOES" ON public.transactions;
DROP POLICY IF EXISTS "Transactions - Ver proprias" ON public.transactions;
DROP POLICY IF EXISTS "Transactions - Admins veem tudo" ON public.transactions;

CREATE POLICY "transactions_user_policy" ON public.transactions FOR SELECT 
TO authenticated 
USING (
    profile_id = auth.uid() 
    OR public.get_auth_role() IN ('owner', 'manager')
);

DROP POLICY IF EXISTS "Orders - Ver proprios" ON public.orders;
DROP POLICY IF EXISTS "Orders - Admins veem tudo" ON public.orders;

CREATE POLICY "orders_user_policy" ON public.orders FOR SELECT 
TO authenticated 
USING (
    customer_id = auth.uid() 
    OR public.get_auth_role() IN ('owner', 'manager')
);

-- 5. CORREÇÃO FINAL NO GATILHO DE CADASTRO (FIX DO referred_by)
-- Garante que novos usuários SALVEM quem os indicou.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, role, referral_code, referred_by, 
    whatsapp, cpf, address, number, neighborhood, city, state, zip_code
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
    new.raw_user_meta_data->>'zip_code'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar perfis que já foram criados mas estão sem o vínculo de indicação
UPDATE public.profiles p
SET referred_by = (u.raw_user_meta_data->>'referred_by')::uuid
FROM auth.users u
WHERE p.id = u.id 
AND p.referred_by IS NULL 
AND u.raw_user_meta_data->>'referred_by' IS NOT NULL;

NOTIFY pgrst, 'reload schema';
