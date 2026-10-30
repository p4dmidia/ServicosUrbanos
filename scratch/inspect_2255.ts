import { supabase } from '../src/lib/supabase';

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', 2255)
    .single();

  console.log('Transaction 2255:', tx);

  // Check Emerson's commissions
  const { data: emersonComms } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', 'a00a6bab-5720-4632-a0db-3604b3a9e258')
    .order('created_at', { ascending: false });

  console.log('All Emerson Comms:');
  console.table(emersonComms.map(c => ({ id: c.id, order_id: c.order_id, type: c.type, amount: c.amount, status: c.status, desc: c.description })));
}

main().catch(console.error);

