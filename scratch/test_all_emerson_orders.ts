import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: emersonOrders } = await supabase
    .from('orders')
    .select('*')
    .ilike('customer_name', '%Emerson%')
    .order('created_at', { ascending: false });
  
  console.log('Emerson orders in DB:', emersonOrders);

  // Check transactions for Emerson
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', 'a00a6bab-5720-4632-a0db-3604b3a9e258');
  
  console.log('Transactions for Emerson:', txs);
}

main().catch(console.error);
