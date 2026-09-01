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

  console.log('--- Pedido 1218 ---');
  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customer_id(id, full_name, referred_by)')
    .eq('id', '1218')
    .single();
  console.log('Order 1218:', JSON.stringify(order, null, 2));

  console.log('--- Transações para 1218 ---');
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, profiles(id, full_name, referred_by, role)')
    .or('order_id.eq.1218,description.ilike.%1218%');
  console.log('Txs 1218:', JSON.stringify(txs, null, 2));

  if (order?.customer_id) {
    console.log('--- Árvore Genealógica do Comprador ---');
    let currentId = order.customer_id;
    let level = 0;
    while (currentId && level <= 5) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, role, referred_by')
        .eq('id', currentId)
        .single();
      console.log(`Level ${level}:`, prof);
      currentId = prof?.referred_by;
      level++;
    }
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
