import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  
  console.log('1. Setting Emerson role to affiliate temporarily...');
  await supabase.from('profiles').update({ role: 'affiliate' }).eq('id', emersonId);

  console.log('2. Testing update order 1314 to Concluído...');
  const { data: updateRes, error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'Concluído' })
    .eq('id', '1314')
    .select();

  console.log('Update result when role = affiliate:', updateRes);
  console.log('Update error when role = affiliate:', updateErr);

  console.log('3. Restoring Emerson role to regional_reseller (or checking result)...');
  // If update succeeded, let's see what transactions were created
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', '1314');
  console.log('Transactions created for 1314:', txs);

  // Restore role
  await supabase.from('profiles').update({ role: 'regional_reseller' }).eq('id', emersonId);
}

main().catch(console.error);
