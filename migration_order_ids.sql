-- Migration: Change Order ID generation and Withdrawal Code format
-- 1. Create a sequence for numeric order IDs starting at 1000
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq START 1000;

-- 2. Update orders table to use the sequence by default
ALTER TABLE public.orders 
ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq')::text;

-- 3. (Optional) Update existing orders if needed, but usually we just want new ones to be numeric.
-- Since they are already strings like ORD-..., we leave them alone.

-- 4. Create a function to get the next order ID if needed by frontend (though select() single is better)
CREATE OR REPLACE FUNCTION public.get_next_order_id()
RETURNS TEXT AS $$
BEGIN
    RETURN nextval('public.order_id_seq')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
