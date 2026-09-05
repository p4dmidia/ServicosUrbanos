import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function test() {
  const userId = '3d11cfe4-7e11-4fc2-a01c-87dbe84cfe0b';
  // Sign in
  await supabase.auth.signInWithPassword({
    email: 'admin-test-1772816945532@test.com', // wait, let's create or sign in
  });

  // Let's create fresh user and test 'owner'
  const email = `owner-test-${Date.now()}@test.com`;
  const password = 'SuperOwnerPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  const uid = signRes.data?.user?.id;
  await supabase.auth.signInWithPassword({ email, password });

  // Update to owner
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  // Test mmn_config
  const resConfig = await supabase.from('mmn_config').update({
    cashback_digital: 2.00,
    cashback_mensal: 2.00,
    cashback_anual: 2.00,
    commission_regional_semanal: 2.00,
    commission_regional_mensal: 2.00,
    commission_regional_anual: 2.00
  }).eq('id', 1).select();
  console.log('Update as owner mmn_config:', resConfig);

  const resLevels = await supabase.from('mmn_levels').update({ value: 6.00 }).in('level', [1, 2, 3]).select();
  console.log('Update as owner mmn_levels:', resLevels);
}

test().catch(console.error);
