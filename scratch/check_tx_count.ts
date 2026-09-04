import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  const email = `debugger-txs-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Txs Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { count: txCount, data: txs } = await supabase.from('transactions').select('*', { count: 'exact' });
  const { count: ordCount, data: ords } = await supabase.from('orders').select('*', { count: 'exact' });
  const { count: profCount } = await supabase.from('profiles').select('*', { count: 'exact' });

  console.log(`Total transactions no banco: ${txCount}`);
  console.log(`Total orders no banco: ${ordCount}`);
  console.log(`Total profiles no banco: ${profCount}`);

  if (txs && txs.length > 0) {
    console.log('Primeiras transações:', txs.slice(0, 5));
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
