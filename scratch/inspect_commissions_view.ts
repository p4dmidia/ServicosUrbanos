import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-comms-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('--- Direct query to commissions view/table ---');
  const { data: commsData, error: commsErr } = await supabase
    .from('commissions')
    .select('*')
    .eq('order_id', '1218');
  console.log('Commissions error:', commsErr);
  console.log('Commissions data:', JSON.stringify(commsData, null, 2));

  console.log('--- Direct query to transactions for commission type ---');
  const { data: txsData, error: txsErr } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id')
    .or('order_id.eq.1218,description.ilike.%1218%');
  console.log('Transactions data:', JSON.stringify(txsData, null, 2));

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
