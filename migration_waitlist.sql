CREATE TABLE IF NOT EXISTS merchant_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_name TEXT
);

ALTER TABLE merchant_waitlist ENABLE ROW LEVEL SECURITY;

-- Permite que qualquer pessoa (mesmo sem estar logada) se cadastre na lista
CREATE POLICY "Allow anonymous inserts to waitlist" ON merchant_waitlist
FOR INSERT TO public
WITH CHECK (true);

-- Apenas admins/managers podem ver a lista (opcional, ajustado para authenticated por simplicidade)
CREATE POLICY "Allow authenticated to view waitlist" ON merchant_waitlist
FOR SELECT TO authenticated
USING (true);
