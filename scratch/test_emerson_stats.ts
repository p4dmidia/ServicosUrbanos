import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function test() {
  // Sign in to have valid authenticated session
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  console.log('--- TESTANDO STATS DO EMERSON ---');
  const stats = await businessRules.getAffiliateStats(emersonId);
  console.log('Emerson Stats:');
  console.log('- isEligible:', stats.isEligible);
  console.log('- walletBonus (Semanal):', stats.walletBonus);
  console.log('- monthlyBonus (Mensal):', stats.monthlyBonus);
  console.log('- annualBonus (Anual):', stats.annualBonus);
  console.log('- totalEarnings:', stats.totalEarnings);
  console.log('- availableBalance:', stats.availableBalance);
  console.log('- activeSubscription:', stats.activeSubscription);

  console.log('\n--- TESTANDO GETPAYABLEBALANCES (ADMIN) ---');
  const networkBalances = await businessRules.getPayableBalances('network');
  const emersonAdmin = networkBalances.find(p => p.profileId === emersonId);
  console.log('Emerson no Admin (Rede MMN):', {
    name: emersonAdmin?.userName,
    isEligible: emersonAdmin?.isEligible,
    digitalPending: emersonAdmin?.digitalPending,
    monthlyPending: emersonAdmin?.monthlyPending,
    annualPending: emersonAdmin?.annualPending,
    netDigital: emersonAdmin?.taxDigital?.netAmount,
    levels: emersonAdmin?.levels
  });

  const sicId = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
  const sicAdmin = networkBalances.find(p => p.profileId === sicId);
  console.log('Sic no Admin (Rede MMN):', {
    name: sicAdmin?.userName,
    isEligible: sicAdmin?.isEligible,
    digitalPending: sicAdmin?.digitalPending,
    monthlyPending: sicAdmin?.monthlyPending,
    annualPending: sicAdmin?.annualPending,
    netDigital: sicAdmin?.taxDigital?.netAmount,
    levels: sicAdmin?.levels
  });

  // Revert test user
  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
