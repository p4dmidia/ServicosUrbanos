-- 1. Alterar a tabela de perfis para suportar o novo papel "regional_reseller" (Revendedor Regional)
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Localiza o nome do constraint do CHECK da coluna role
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'profiles' AND ccu.column_name = 'role' AND tc.constraint_type = 'CHECK';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

-- Adiciona a nova restrição de CHECK incluindo 'regional_reseller' e mantendo 'admin'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'manager', 'admin', 'regional_reseller', 'affiliate', 'customer'));

-- Adiciona colunas para Data de Nascimento e Sexo na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F'));


-- 2. Criar a tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('trimestral', 'semestral', 'anual')) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive', 'canceled')) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela de Assinaturas
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para subscriptions
CREATE POLICY "Leitura de assinaturas próprias" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Gerentes e owners veem todas as assinaturas" ON public.subscriptions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Gerentes e owners editam assinaturas" ON public.subscriptions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
    );


-- 3. Criar a tabela de Parceiros Comerciais
CREATE TABLE IF NOT EXISTS public.commercial_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT, -- Emoji ou URL do ícone
    description TEXT,
    discount_value TEXT, -- Ex: "15% OFF", "Frete Grátis"
    category TEXT, -- Ex: "Saúde", "Alimentação", "Lazer"
    link TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela de Parceiros Comerciais
ALTER TABLE public.commercial_partners ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para commercial_partners
CREATE POLICY "Leitura pública de parceiros" ON public.commercial_partners 
    FOR SELECT USING (active = true);

CREATE POLICY "Gerentes e owners editam parceiros" ON public.commercial_partners 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
    );


-- 4. Adicionar triggers para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_commercial_partners_updated_at ON public.commercial_partners;
CREATE TRIGGER update_commercial_partners_updated_at 
    BEFORE UPDATE ON public.commercial_partners 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
