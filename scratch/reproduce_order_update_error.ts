import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testUpdateOrder() {
  const email = `debugger-order-err-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // Get order 1222 or 1221 or 1223
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('*')
    .in('id', [1221, 1222, 1223])
    .order('id', { ascending: false });

  console.log('Orders found:', orders, oErr);

  if (orders && orders.length > 0) {
    const targetOrder = orders[0];
    console.log('Testing update on order id:', targetOrder.id, 'current status:', targetOrder.status);
    
    // Try updating status
    const { data: updateRes, error: uErr } = await supabase
      .from('orders')
      .update({ status: 'Pago' })
      .eq('id', targetOrder.id)
      .select();

    console.log('Update result:', updateRes);
    console.error('Update ERROR:', uErr);
  }
}

testUpdateOrder();
