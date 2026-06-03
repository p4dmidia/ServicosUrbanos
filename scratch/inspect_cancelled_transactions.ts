import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // Get all cancelled orders
  const { data: cancelledOrders } = await supabase
    .from('orders')
    .select('id, amount, status')
    .eq('status', 'Cancelado');

  console.log('Cancelled Orders:', cancelledOrders);

  if (!cancelledOrders || cancelledOrders.length === 0) {
    console.log('No cancelled orders found.');
    // clean up
    if (signUpData?.user) {
      await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
    }
    return;
  }

  const orderIds = cancelledOrders.map(o => o.id);

  // Fetch all transactions for these orders
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .in('order_id', orderIds);

  console.log('\nTransactions for Cancelled Orders (by order_id):');
  console.log(JSON.stringify(txs, null, 2));

  // Search by description pattern
  const orFilters = orderIds.map(id => `description.ilike.%Pedido #${id}%`).join(',');
  const { data: txsByDesc } = await supabase
    .from('transactions')
    .select('*')
    .or(orFilters);

  console.log('\nTransactions for Cancelled Orders (by description):');
  console.log(JSON.stringify(txsByDesc, null, 2));

  // clean up
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
