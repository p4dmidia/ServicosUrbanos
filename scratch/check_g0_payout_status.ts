import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkG0() {
  const email = `debugger-g0-status-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // 1. Check all transactions where description has G0 or for Gustavo Ribeiro
  const { data: gustavo } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Gustavo%').single();
  console.log('Gustavo Profile:', gustavo);

  if (gustavo) {
    const { data: gustavoTxs } = await supabase.from('transactions').select('*').eq('profile_id', gustavo.id);
    console.log('Transactions for Gustavo (G0):', gustavoTxs);
  }

  // 2. Check if any transaction anywhere has description 'G0'
  const { data: g0Txs } = await supabase.from('transactions').select('*').ilike('description', '%G0%');
  console.log('Any G0 transactions in entire DB:', g0Txs);
}

checkG0();
