import { supabase } from '../src/lib/supabase';

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const idsToComplete = [2245, 2251, 2241];
  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .in('id', idsToComplete)
    .select();

  console.log('Updated transactions:', data, error);
}

main().catch(console.error);

