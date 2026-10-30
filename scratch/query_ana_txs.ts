import { supabase } from '../src/lib/supabase';

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', 'ec35306f-b3ac-4a87-8746-a04c3b771e86') // Ana Lisboa
    .order('created_at', { ascending: false });

  console.log('Ana Lisboa transactions:', txs);
}

main().catch(console.error);

