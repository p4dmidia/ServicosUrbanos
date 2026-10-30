import { supabase } from '../src/lib/supabase';

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const { data: withdrawals } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'withdrawal')
    .order('created_at', { ascending: false });

  console.log('All withdrawals in database:', JSON.stringify(withdrawals, null, 2));
}

main().catch(console.error);

