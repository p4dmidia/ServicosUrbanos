import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const email = `admin-test-${Date.now()}@test.com`;
  const password = 'SuperAdminPassword123!';
  
  const signRes = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Test' } }
  });
  console.log('signUp:', signRes.data?.user?.id, signRes.error);

  const loginRes = await supabase.auth.signInWithPassword({ email, password });
  console.log('signIn:', loginRes.data?.session ? 'SESSION OK' : 'NO SESSION', loginRes.error);

  const updRole = await supabase.from('profiles').update({ role: 'admin' }).eq('id', signRes.data?.user?.id).select();
  console.log('updRole:', updRole);

  const updLevels = await supabase.from('mmn_levels').update({ value: 6.00 }).in('level', [1, 2, 3]).select();
  console.log('updLevels:', updLevels);

  const updConfig = await supabase.from('mmn_config').update({
    cashback_digital: 2.00,
    cashback_mensal: 2.00,
    cashback_anual: 2.00,
    commission_regional_semanal: 2.00,
    commission_regional_mensal: 2.00,
    commission_regional_anual: 2.00
  }).eq('id', 1).select();
  console.log('updConfig:', updConfig);
}

test().catch(console.error);
