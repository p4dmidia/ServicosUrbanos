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

  console.log('\n--- TESTANDO GETPAYABLEBALANCES RESELLER ---');
  const resellerBalances = await businessRules.getPayableBalances('reseller');
  const sicId = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
  const sicReseller = resellerBalances.find(p => p.profileId === sicId);
  console.log('Sic no Admin (Revendedor):', {
    name: sicReseller?.userName,
    isEligible: sicReseller?.isEligible,
    digitalPending: sicReseller?.digitalPending,
    monthlyPending: sicReseller?.monthlyPending,
    annualPending: sicReseller?.annualPending,
    levels: sicReseller?.levels
  });

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
