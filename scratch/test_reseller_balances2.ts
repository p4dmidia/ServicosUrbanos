import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function test() {
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  const resellerBalances = await businessRules.getPayableBalances('reseller');
  console.log('Total resellers with balance:', resellerBalances.length);
  resellerBalances.forEach(r => {
    console.log(`- ${r.userName} (${r.profileId}): digital=${r.digitalPending}, monthly=${r.monthlyPending}, annual=${r.annualPending}, levels=${r.levels}`);
  });

  // Check who has the reseller transaction for order 1241
  const { data: tx1246 } = await supabase.from('transactions').select('*').eq('id', 1246).single();
  console.log('TX #1246 profile_id:', tx1246?.profile_id, 'desc:', tx1246?.description);
}

test().catch(console.error);
