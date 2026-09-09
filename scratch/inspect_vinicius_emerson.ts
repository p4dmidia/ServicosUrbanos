import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve('.env') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, cpf, cnpj, pix_key').in('full_name', ['VINICIUS ANTUNES', 'EMERSON MINES ANTUNES']);
  console.log('Profiles:', profiles);

  for (const p of profiles || []) {
    const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', p.id);
    console.log(`\nTransactions for ${p.full_name}:`);
    txs?.forEach(t => {
      console.log(` - [${t.type}] [${t.status}] ${t.amount} | ${t.description}`);
    });
  }

  if (uid) await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
