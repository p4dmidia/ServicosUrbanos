import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Order 1307 details ---');
  const { data: o } = await supabase.from('orders').select('*').eq('id', '1307').single();
  console.log(o);

  console.log('\n--- All Subscriptions in DB ---');
  const { data: subs } = await supabase.from('subscriptions').select('*');
  console.log('Subscriptions count:', subs?.length, subs);

  console.log('\n--- All Orders vs Subscriptions ---');
  const { data: orders } = await supabase.from('orders').select('id, customer_id, customer_name, status, created_at, items');
  console.log('Orders:', orders);
}

main().catch(console.error);
