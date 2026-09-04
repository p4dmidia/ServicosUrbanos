import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function run() {
  const email = `debugger-eligibility-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Eligibility Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Perfis e suas assinaturas
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role, status, created_at');
  const { data: subs } = await supabase.from('subscriptions').select('*');

  console.log('=== VERIFICAÇÃO DE TODOS OS PERFIS E STATUS ===');
  const now = new Date();

  for (const p of profiles || []) {
    const userSubs = (subs || []).filter(s => s.profile_id === p.id);
    const hasRealActiveSub = userSubs.some(s => s.status === 'active' && new Date(s.end_date) >= now);
    
    // Obter stats da businessRules
    const stats = await businessRules.getAffiliateStats(p.id);

    console.log(`\nPerfil: ${p.full_name} (${p.email})`);
    console.log(`  Role: ${p.role} | DB Status: ${p.status}`);
    console.log(`  Tem Assinatura Real Ativa no Banco? ${hasRealActiveSub ? 'SIM' : 'NÃO'}`);
    if (userSubs.length > 0) {
      console.log('  Assinaturas no Banco:', userSubs.map(s => ({ plan: s.plan_type, status: s.status, end: s.end_date })));
    }
    console.log(`  businessRules.getAffiliateStats -> isEligible: ${stats.isEligible}`);
    if (stats.activeSubscription) {
      console.log('  businessRules.getAffiliateStats -> activeSubscription:', stats.activeSubscription);
    }
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
