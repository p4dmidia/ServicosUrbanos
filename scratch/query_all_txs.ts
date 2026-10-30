import { supabase } from '../src/lib/supabase';

async function main() {
  const res = await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });
  console.log('SignIn Admin:', res.error ? res.error.message : 'OK');

  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('Txs count:', txs?.length, txErr);
  if (txs) {
    console.log(txs.map(t => ({ id: t.id, profile_id: t.profile_id, type: t.type, amount: t.amount, status: t.status, desc: t.description })));
  }
}

main().catch(console.error);

