import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-check-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data: g0Txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id')
    .ilike('description', '%G0%');

  console.log('Transações com G0:', g0Txs?.length || 0);
  if (g0Txs && g0Txs.length > 0) {
    console.log(JSON.stringify(g0Txs, null, 2));
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
