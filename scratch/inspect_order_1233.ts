import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-txs-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('--- Buscando Pedido 1233 ---');
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1233')
    .single();
  console.log('Order 1233:', JSON.stringify(order, null, 2));

  console.log('--- Transações para 1233 ---');
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, created_at, order_id')
    .or('order_id.eq.1233,description.ilike.%1233%')
    .order('created_at', { ascending: true });
  console.log('Txs 1233:', JSON.stringify(txs, null, 2));

  console.log('--- Últimas 20 transações no banco ---');
  const { data: latestTxs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, created_at, order_id')
    .order('created_at', { ascending: false })
    .limit(20);
  console.log('Latest 20 Txs:', JSON.stringify(latestTxs, null, 2));
}

run();
