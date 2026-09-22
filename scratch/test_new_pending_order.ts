import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  
  console.log('--- Creating test pending order for Emerson ---');
  const { data: newOrder, error: createErr } = await supabase
    .from('orders')
    .insert({
      id: '9999',
      customer_id: emersonId,
      customer_name: 'Emerson Mines Antunes ',
      customer_initial: 'E',
      amount: 85,
      status: 'Aguardando Pagamento',
      items: [
        {
          id: '06ba2eb8-f811-4f76-883c-6123aa444d31',
          name: 'Licenciamento MMN - Revendedor Regional',
          price: 85,
          quantity: 1,
          plan_type: 'revendedor',
          is_subscription: true
        }
      ],
      reseller_id: emersonId
    })
    .select()
    .single();

  if (createErr) {
    console.error('Create error:', createErr);
    return;
  }
  console.log('Created order 9999:', newOrder);

  console.log('\n--- Now simulating Admin clicking Approve (Concluído) ---');
  const { data: approvedOrder, error: approveErr } = await supabase
    .from('orders')
    .update({ status: 'Concluído' })
    .eq('id', '9999')
    .select();

  console.log('Approve result:', approvedOrder);
  console.log('Approve error:', approveErr);

  // Clean up test order 9999
  console.log('\n--- Cleaning up test order 9999 ---');
  await supabase.from('orders').delete().eq('id', '9999');
  console.log('Done test!');
}

main().catch(console.error);
