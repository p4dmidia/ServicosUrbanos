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

  const { data: prof } = await supabase.from('profiles').select('*').ilike('full_name', '%silvana%').single();
  console.log('User found:', prof.id, prof.full_name, prof.role);

  // Check all transactions in DB for Silvana
  const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', prof.id);
  console.log(`\nDirect DB Transactions for ${prof.full_name} (${txs?.length}):`);
  console.table(txs);

  // Check getEcosystemActivity
  const activity = await businessRules.getEcosystemActivity(prof.id);
  console.log(`\ngetEcosystemActivity items (${activity.length}):`);
  console.table(activity);

  // Check getResellerFinancialSummary
  const resellerSum = await businessRules.getResellerFinancialSummary(prof.id, 2026, 8);
  console.log(`\ngetResellerFinancialSummary itemized (${resellerSum.itemizedTransactions?.length}):`);
  console.table(resellerSum.itemizedTransactions);

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
