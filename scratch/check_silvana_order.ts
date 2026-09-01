import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSilvana() {
  const email = `debugger-silvana-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // 1. Silvana profile
  const { data: silvana } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Silvana%')
    .single();

  console.log('Silvana Profile:', silvana);

  if (!silvana) return;

  // 2. Transactions for Silvana
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', silvana.id);

  console.log('\n--- Silvana Transactions ---');
  for (const t of (txs || [])) {
    console.log(`TX ID: ${t.id} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | OrderId: ${t.order_id} | Desc: ${t.description} | CreatedAt: ${t.created_at}`);

    // If there is an order_id or order in description
    if (t.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('*, customer:customer_id(full_name, cpf, email)')
        .eq('id', t.order_id)
        .single();
      console.log('  -> Pedido de Origem:', order?.id, 'Comprador:', order?.customer?.full_name, 'Valor:', order?.amount, 'Data:', order?.created_at, 'Itens:', JSON.stringify(order?.items));
    }
  }
}

checkSilvana();
