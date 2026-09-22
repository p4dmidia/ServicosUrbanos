import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- 1. Testing get_upline_chain for Emerson ---');
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const { data: chain, error: chainErr } = await supabase.rpc('get_upline_chain', {
    user_id: emersonId,
    max_depth: 5
  });
  console.log('Upline chain result:', chain, chainErr);

  console.log('\n--- 2. Testing insert into subscriptions directly for plan_type revendedor ---');
  const { data: subData, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      profile_id: emersonId,
      plan_type: 'revendedor',
      amount: 85,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    })
    .select();
  console.log('Subscription insert:', subData, subErr);

  console.log('\n--- 3. Testing update order with status Cancelado (which does not trigger handle_order_payment) ---');
  const { data: cancelData, error: cancelErr } = await supabase
    .from('orders')
    .update({ status: 'Aguardando Pagamento' }) // keeping it same
    .eq('id', '1314')
    .select();
  console.log('Update without trigger:', cancelData, cancelErr);

  console.log('\n--- 4. Checking mmn_config and mmn_levels ---');
  const { data: mmnConfig, error: configErr } = await supabase.from('mmn_config').select('*');
  console.log('mmn_config:', mmnConfig, configErr);

  const { data: mmnLevels, error: levelsErr } = await supabase.from('mmn_levels').select('*');
  console.log('mmn_levels:', mmnLevels, levelsErr);
}

main().catch(console.error);
