import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  
  // Let's test creating a dummy order with amount 85 and different customer_ids to see if it's the customer or order
  console.log('--- Test A: Update order 1314 with customer_id set to Antonio ---');
  // Antonio customer id
  const antonioId = '6d0d6163-658a-45fd-9620-9dfa65363680';
  
  // Set customer_id = Antonio on 1314
  await supabase.from('orders').update({ customer_id: antonioId }).eq('id', '1314');
  
  let { data: resA, error: errA } = await supabase.from('orders').update({ status: 'Concluído' }).eq('id', '1314').select();
  console.log('Result with Antonio as customer:', resA, errA);

  // Reset back
  await supabase.from('orders').update({ status: 'Aguardando Pagamento', customer_id: emersonId }).eq('id', '1314');

  console.log('\n--- Test B: Setting reseller_id on Emerson to his own id or Antonio id ---');
  await supabase.from('profiles').update({ reseller_id: emersonId }).eq('id', emersonId);
  await supabase.from('orders').update({ reseller_id: emersonId }).eq('id', '1314');
  
  let { data: resB, error: errB } = await supabase.from('orders').update({ status: 'Concluído' }).eq('id', '1314').select();
  console.log('Result with reseller_id set:', resB, errB);

  // If still error, let's test setting referred_by on Emerson
  if (errB) {
    console.log('\n--- Test C: Setting referred_by on Emerson to Antonio ---');
    await supabase.from('profiles').update({ referred_by: antonioId }).eq('id', emersonId);
    let { data: resC, error: errC } = await supabase.from('orders').update({ status: 'Concluído' }).eq('id', '1314').select();
    console.log('Result with referred_by set:', resC, errC);
  }
}

main().catch(console.error);
