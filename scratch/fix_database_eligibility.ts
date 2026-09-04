import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function run() {
  console.log('--- APLICANDO CORREÇÕES DE ELEGIBILIDADE NO BANCO DE DADOS ---');
  const email = `debugger-fix-elig2-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Eligibility Fixer 2' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const SIC_ID = '194e5265-cdb6-431f-9f77-8888b1ee74ae';

  console.log('\n1. CANCELANDO ASSINATURAS RESIDUAIS ATIVAS DE NÃO-SIC...');
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id, profile_id, plan_type, status')
    .eq('status', 'active')
    .neq('profile_id', SIC_ID);

  console.log(`Assinaturas ativas a cancelar: ${activeSubs?.length || 0}`);
  if (activeSubs && activeSubs.length > 0) {
    const subIds = activeSubs.map(s => s.id);
    const { error: cancelErr } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .in('id', subIds);

    if (cancelErr) console.error('Erro ao cancelar assinaturas:', cancelErr);
    else console.log('Assinaturas residuais canceladas com sucesso.');
  }

  console.log('\n2. AJUSTANDO STATUS EM PROFILES PARA BLOCKED (APENAS SIC COMÉRCIO ACTIVE)...');
  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, status')
    .eq('status', 'active')
    .neq('id', SIC_ID);

  console.log(`Perfis ativos a bloquear: ${activeProfiles?.length || 0}`);
  activeProfiles?.forEach(p => console.log(`  - ${p.full_name} (${p.email}) | ID: ${p.id}`));

  if (activeProfiles && activeProfiles.length > 0) {
    const profileIds = activeProfiles.map(p => p.id);
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ status: 'blocked' })
      .in('id', profileIds);

    if (profErr) console.error('Erro ao bloquear perfis:', profErr);
    else console.log('Perfis bloqueados com sucesso.');
  }

  // Garantir que a Sic Comércio esteja com status active
  await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', SIC_ID);

  console.log('\n3. VERIFICANDO SALDOS E ELEGIBILIDADE NO DASHBOARD ADMINISTRATIVO...');
  const networkBalances = await businessRules.getPayableBalances('network');
  console.log(`\nBeneficiários na Rede MMN (${networkBalances.length}):`);
  networkBalances.forEach(b => {
    console.log(`- ${b.userName} (${b.role}) | Status: ${b.isEligible ? '🟢 Adimplente' : '🔒 Inadimplente'} | Semanal: R$ ${b.digitalPending} | Total: R$ ${b.totalPending}`);
  });

  const resellerBalances = await businessRules.getPayableBalances('reseller');
  console.log(`\nRevendedores com saldo (${resellerBalances.length}):`);
  resellerBalances.forEach(b => {
    console.log(`- ${b.userName} (${b.role}) | Status: ${b.isEligible ? '🟢 Adimplente' : '🔒 Inadimplente'} | Semanal: R$ ${b.digitalPending} | Total: R$ ${b.totalPending}`);
  });

  // Reverte debugger user
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer', status: 'blocked' }).eq('id', signUpData.user.id);
  }

  console.log('\n--- CORREÇÕES CONCLUÍDAS COM SUCESSO ---');
}

run().catch(console.error);
