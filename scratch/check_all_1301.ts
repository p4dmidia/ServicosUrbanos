import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  const { data: all1301 } = await supabase
    .from('transactions')
    .select('*')
    .or('order_id.eq.1301,description.ilike.%1301%')
    .order('id', { ascending: true });

  console.log("All transactions for 1301:");
  console.table(all1301);

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
