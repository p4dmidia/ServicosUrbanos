-- Tabela de Filiais (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Perfis de Usuário (Profiles)
-- Extende a tabela auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('owner', 'manager', 'affiliate', 'customer')) DEFAULT 'customer',
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    commission_rate NUMERIC DEFAULT 0,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    cashback NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo',
    image TEXT DEFAULT '📦',
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Pode ser UUID ou código alfanumérico
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_initial TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('Pendente', 'Processando', 'Enviado', 'Concluído', 'Cancelado')) DEFAULT 'Pendente',
    items INTEGER DEFAULT 1,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    cashback_amount NUMERIC DEFAULT 0,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Informações Extras do Pedido (Código de Retirada)
CREATE TABLE IF NOT EXISTS public.order_extras (
    id TEXT PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    withdrawal_code TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('sale', 'withdrawal', 'fee', 'commission', 'cashback_deduction')) NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurações de MMN (Multi-nível)
CREATE TABLE IF NOT EXISTS public.mmn_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    depth INTEGER DEFAULT 4,
    payment_type TEXT CHECK (payment_type IN ('percent', 'fixed')) DEFAULT 'percent',
    cashback_mensal NUMERIC DEFAULT 2.75,
    cashback_digital NUMERIC DEFAULT 1.00,
    cashback_anual NUMERIC DEFAULT 0.75,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Níveis de MMN
CREATE TABLE IF NOT EXISTS public.mmn_levels (
    level INTEGER PRIMARY KEY,
    value NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Dados Iniciais para MMN
INSERT INTO public.mmn_config (id, depth, payment_type) 
VALUES (1, 4, 'percent')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.mmn_levels (level, value) VALUES 
(1, 4.00), (2, 3.00), (3, 2.00), (4, 1.00)
ON CONFLICT (level) DO NOTHING;

-- Gatilho para atualizar o 'updated_at' automaticamente comum
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_mmn_config_updated_at ON public.mmn_config;
CREATE TRIGGER update_mmn_config_updated_at BEFORE UPDATE ON public.mmn_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_extras ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Exemplo: todos podem ler branches e produtos, mas apenas perfil certo edita)
CREATE POLICY "Leitura pública de filiais" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Leitura pública de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Usuários veem seus próprios perfis" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Gatilho para criar perfil automaticamente após cadastro no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- LOGICA DE MMN (Marketing Multinível)

-- Função para obter a cadeia de patrocinadores recursivamente
CREATE OR REPLACE FUNCTION public.get_upline_chain(user_id UUID, max_depth INTEGER)
RETURNS TABLE (upline_id UUID, level INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE uplines AS (
        -- Base: O patrocinador direto do usuário que fez a compra
        SELECT referred_by, 1 as current_level
        FROM public.profiles
        WHERE id = user_id AND referred_by IS NOT NULL
        
        UNION ALL
        
        -- Recursivo: Encontrar o patrocinador do patrocinador
        SELECT p.referred_by, u.current_level + 1
        FROM public.profiles p
        INNER JOIN uplines u ON p.id = u.referred_by
        WHERE p.referred_by IS NOT NULL AND u.current_level < max_depth
    )
    SELECT * FROM uplines;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função principal para distribuir comissões ao pagar pedido
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    mmn_depth INTEGER;
    mmn_pay_type TEXT;
    commission_record RECORD;
    commission_val NUMERIC;
    p_mensal NUMERIC;
    p_digital NUMERIC;
    p_anual NUMERIC;
    v_mensal NUMERIC;
    v_digital NUMERIC;
    v_anual NUMERIC;
BEGIN
    -- [CONDIÇÃO DE DISPARO]
    -- Só processa se o novo status for 'Pago, Aguardando Retirada' ou 'Concluído'
    -- E o status anterior NÃO era um desses (evita pagar 2x se mudar de 'Pago' para 'Concluído')
    IF (
        (NEW.status IN ('Pago, Aguardando Retirada', 'Concluído')) 
        AND 
        (OLD.status IS NULL OR OLD.status NOT IN ('Pago, Aguardando Retirada', 'Concluído'))
    ) THEN
        
        -- [TRAVA DE SEGURANÇA]
        -- Verifica se já existem transações de comissão para este pedido
        IF EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE description LIKE '%Pedido #' || NEW.id || '%' 
            AND type = 'commission'
        ) THEN
            RETURN NEW;
        END IF;

        -- Pegar configurações de MMN
        SELECT depth, payment_type INTO mmn_depth, mmn_pay_type FROM public.mmn_config WHERE id = 1;
        
        -- Percorrer a cadeia de patrocinadores e gerar comissões
        FOR commission_record IN 
            SELECT u.upline_id, u.level, l.value
            FROM public.get_upline_chain(NEW.customer_id, mmn_depth) u
            JOIN public.mmn_levels l ON u.level = l.level
        LOOP
            -- Pegar as proporções configuradas
            SELECT cashback_mensal, cashback_digital, cashback_anual 
            INTO p_mensal, p_digital, p_anual 
            FROM public.mmn_config WHERE id = 1;

            -- Calcular o valor TOTAL da comissão para este nível
            IF mmn_pay_type = 'percent' THEN
                commission_val := (NEW.amount * (commission_record.value / 100));
            ELSE
                commission_val := commission_record.value;
            END IF;
            
            -- Calcular as partes baseadas nos percentuais reais (Normalizando para o total da comissão se necessário)
            -- Mas aqui vamos usar os percentuais diretos se o total bater com o nível
            -- Para manter a flexibilidade:
            v_mensal := ROUND(commission_val * (p_mensal / (p_mensal + p_digital + p_anual)), 2);
            v_digital := ROUND(commission_val * (p_digital / (p_mensal + p_digital + p_anual)), 2);
            v_anual := commission_val - (v_mensal + v_digital); -- Resíduo no anual
            
            -- 1. Bônus Mensal
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN (Mensal) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_mensal, 
                'completed'
            );

            -- 2. Bônus Anual
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN (Anual) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_anual, 
                'completed'
            );

            -- 3. Bônus Carteira Digital (CD)
            INSERT INTO public.transactions (profile_id, type, description, amount, status)
            VALUES (
                commission_record.upline_id, 
                'commission', 
                'Comissão MMN (CD) - Pedido #' || NEW.id || ' (Nível ' || commission_record.level || ')', 
                v_digital, 
                'completed'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar a distribuição de comissões
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
DROP TRIGGER IF EXISTS on_order_commission_payment ON public.orders;
CREATE TRIGGER on_order_commission_payment
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();
