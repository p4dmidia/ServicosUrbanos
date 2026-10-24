const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const { data: coms } = await supabase.from('comissoes_mmn').select('*').eq('order_id', '1337');
  console.log('comissoes_mmn for 1337:', coms);

  const { data: txs } = await supabase.from('transactions').select('*').eq('order_id', '1337');
  console.log('transactions for 1337:', txs);

  const { data: ord } = await supabase.from('orders').select('*').eq('id', '1337');
  console.log('order 1337 status:', ord[0]?.status);
}
check().catch(console.error);
