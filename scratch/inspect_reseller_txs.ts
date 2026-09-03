import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const email = `debugger-${Date.now()}@test.com`;
  await supabase.auth.signUp({ email, password: 'SuperDebugPassword123!' });
  await supabase.auth.signInWithPassword({ email, password: 'SuperDebugPassword123!' });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data: weider } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Weider%').single();
  const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', weider.id);
  console.log('Weider all transactions:', JSON.stringify(txs, null, 2));

  // Check other regional resellers
  const { data: resellers } = await supabase.from('profiles').select('id, full_name').eq('role', 'regional_reseller');
  console.log('All regional resellers:', resellers);

  for (const r of (resellers || [])) {
    const { data: rTxs } = await supabase.from('transactions').select('*').eq('profile_id', r.id);
    const regTxs = rTxs?.filter(t => t.description?.includes('Revendedor') || t.description?.includes('Regional')) || [];
    console.log(`Reseller ${r.full_name} (${r.id}) has ${regTxs.length} reseller transactions:`);
    regTxs.forEach(t => console.log(`  - [${t.type}] ${t.description} -> R$ ${t.amount} (${t.status})`));
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

test().catch(console.error);
