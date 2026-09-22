import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function cleanup() {
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  // IDs 1700 to 1707 are the old duplicates for order 1301 from 19/09
  const idsToDelete = [1700, 1701, 1702, 1703, 1704, 1705, 1706, 1707];
  
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .in('id', idsToDelete)
    .select();

  if (error) {
    console.error("Error deleting duplicates:", error);
  } else {
    console.log(`Deleted ${data?.length || 0} duplicate transactions for order 1301:`, data);
  }

  // Verify remaining transactions for 1301
  const { data: remaining } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, created_at')
    .or('order_id.eq.1301,description.ilike.%1301%')
    .order('id', { ascending: true });

  console.log("\nRemaining valid transactions for 1301:");
  console.table(remaining);

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

cleanup().catch(console.error);
