import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Fetching all orders ---');
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, status, amount, items')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('Orders:', orders);

  // Let's create a temporary dummy order for Emerson with a standard item vs with plan_type 'revendedor'
  console.log('\n--- Checking Emerson profile details ---');
  const { data: emerson } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'a00a6bab-5720-4632-a0db-3604b3a9e258')
    .single();
  console.log('Emerson profile:', emerson);

  // Let's check another profile that is affiliate or customer
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', 'a00a6bab-5720-4632-a0db-3604b3a9e258')
    .limit(1)
    .single();
  console.log('\nOther user:', otherUser?.id, otherUser?.full_name, otherUser?.role);
}

main().catch(console.error);
