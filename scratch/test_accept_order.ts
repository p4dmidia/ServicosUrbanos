import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testAcceptOrder() {
  const email = `debugger-accept-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // Update order 1223 to 'Pago, Aguardando Retirada'
  console.log('Updating order 1223 to "Pago, Aguardando Retirada"...');
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'Pago, Aguardando Retirada' })
    .eq('id', 1223)
    .select();

  console.log('Update Result:', data, error);

  // Check transactions generated
  const { data: txs } = await supabase.from('transactions').select('*').eq('order_id', 1223);
  console.log('Transactions generated for order 1223:', txs);

  // Check subscription generated for customer
  if (data && data[0]) {
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('profile_id', data[0].customer_id);
    console.log('Subscription for customer:', subs);
  }
}

testAcceptOrder();
