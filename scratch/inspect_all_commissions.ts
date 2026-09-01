import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-alltxs-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('--- Buscando todas as transações de comissão ---');
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id, profiles(full_name)')
    .eq('type', 'commission');

  console.log(`Total de comissões encontradas: ${txs?.length || 0}`);
  (txs || []).forEach(t => {
    console.log(`ID: ${t.id} | Order: ${t.order_id} | User: ${(t.profiles as any)?.full_name} | Desc: ${t.description} | Amount: ${t.amount}`);
  });

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
