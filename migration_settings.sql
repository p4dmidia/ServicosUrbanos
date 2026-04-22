-- Tabela de Configurações Financeiras
CREATE TABLE IF NOT EXISTS public.finance_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    min_withdrawal_amount NUMERIC DEFAULT 50.00,
    withdrawal_fee NUMERIC DEFAULT 4.90,
    payout_schedule TEXT DEFAULT 'Padrão (D+15)',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Tabela de Configurações de Marketplace (Caso não exista)
CREATE TABLE IF NOT EXISTS public.marketplace_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    commission_rate NUMERIC DEFAULT 12.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir dados iniciais se não existirem
INSERT INTO public.finance_config (id, min_withdrawal_amount, withdrawal_fee, payout_schedule)
VALUES (1, 50.00, 4.90, 'Padrão (D+15)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.marketplace_config (id, commission_rate)
VALUES (1, 12.00)
ON CONFLICT (id) DO NOTHING;

-- Trigger para updated_at (assumindo que a função update_updated_at_column já existe do schema principal)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_finance_config_updated_at') THEN
        CREATE TRIGGER update_finance_config_updated_at BEFORE UPDATE ON public.finance_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marketplace_config_updated_at') THEN
        CREATE TRIGGER update_marketplace_config_updated_at BEFORE UPDATE ON public.marketplace_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
