const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function resetForUser() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  // 1. Remove commissions & transactions created during testing
  await supabase.rpc('execute_sql', {
    query: `
      DELETE FROM public.comissoes_mmn WHERE order_id = '1337';
      DELETE FROM public.transactions WHERE order_id = '1337';
      UPDATE public.orders SET status = 'Aguardando Pagamento' WHERE id = '1337';
    `
  });

  const { data: ord } = await supabase.from('orders').select('id, status, amount').eq('id', '1337').single();
  console.log('Order 1337 reset to:', ord);
}

resetForUser().catch(console.error);
