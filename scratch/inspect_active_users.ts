import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function run() {
  const email = `debugger-active-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Active Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role, status');
  const { data: subs } = await supabase.from('subscriptions').select('*');

  console.log('=== PERFIS COM STATUS ATIVO OU COM ASSINATURA OU REGIONAL RESELLER ===');
  const now = new Date();

  for (const p of profiles || []) {
    const userSubs = (subs || []).filter(s => s.profile_id === p.id);
    const hasRealActiveSub = userSubs.some(s => s.status === 'active' && new Date(s.end_date) >= now);
    
    // Critérios de liberação:
    // 1. DB status === 'active'
    // 2. Role === 'regional_reseller' ou 'owner' ou 'admin'
    // 3. hasRealActiveSub
    // 4. ID da Sic Comercio (194e5265-cdb6-431f-9f77-8888b1ee74ae)
    const isSpecial = p.status === 'active' || p.role === 'regional_reseller' || p.role === 'owner' || p.role === 'admin' || hasRealActiveSub || p.id === '194e5265-cdb6-431f-9f77-8888b1ee74ae';

    if (isSpecial) {
      console.log(`\nPerfil: ${p.full_name} (${p.email}) | ID: ${p.id}`);
      console.log(`  Role: ${p.role} | DB Status: ${p.status}`);
      console.log(`  Assinatura Ativa no Banco: ${hasRealActiveSub ? 'SIM' : 'NÃO'}`);
      if (userSubs.length > 0) {
        console.log('  Subs:', userSubs.map(s => `${s.plan_type} (${s.status}, até ${s.end_date})`));
      }
    }
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
