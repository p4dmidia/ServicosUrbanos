import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

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

  // Set profile role to admin
  const updRole = await supabase.from('profiles').update({ role: 'admin' }).eq('id', signRes.data?.user?.id);
  console.log('updRole:', updRole);

  // Test businessRules.saveMMNConfig
  try {
    await businessRules.saveMMNConfig({
      depth: 3,
      paymentType: 'percent',
      cashbackMensal: 2.00,
      cashbackDigital: 2.00,
      cashbackAnual: 2.00,
      commissionRegionalSemanal: 2.00,
      commissionRegionalMensal: 2.00,
      commissionRegionalAnual: 2.00
    });
    console.log('saveMMNConfig SUCCESS!');
  } catch (e: any) {
    console.error('saveMMNConfig ERROR:', e);
  }

  // Test businessRules.saveMMNLevels
  try {
    await businessRules.saveMMNLevels([
      { level: 1, value: 6.00 },
      { level: 2, value: 6.00 },
      { level: 3, value: 6.00 }
    ]);
    console.log('saveMMNLevels SUCCESS!');
  } catch (e: any) {
    console.error('saveMMNLevels ERROR:', e);
  }

  // Now verify what is in the tables
  const { data: config } = await supabase.from('mmn_config').select('*');
  console.log('Config now:', config);

  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('Levels now:', levels);
}

test().catch(console.error);
