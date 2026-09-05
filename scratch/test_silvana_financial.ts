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

  // Find user with CPF 01565377613
  const { data: prof } = await supabase.from('profiles').select('id, full_name, role, cpf').eq('cpf', '01565377613').single();
  console.log('User found:', prof);

  if (prof) {
    console.log('\n=== TESTANDO COM O USUÁRIO DO PRINT (SILVANA: 01565377613) ===\n');

    // 1. SETEMBRO 2026
    const setSummary = await businessRules.getResellerFinancialSummary(prof.id, 2026, 8);
    console.log('>>> SETEMBRO / 2026:');
    console.log('  - Mensal a receber:', setSummary.monthlyToReceive);
    console.log('  - Semanal disponível:', setSummary.weeklyAvailable);
    console.log('  - Anual acumulado:', setSummary.annualToReceive);
    console.log('  - Card Principal Bruto:', setSummary.tax.bruto);
    console.log('  - Card Principal Líquido:', setSummary.tax.liquido);
    console.log('  - Vendas fechadas no mês (salesCount):', setSummary.salesCount);
    console.log('  - Faturamento Total (totalOrderVolume):', setSummary.totalOrderVolume);

    // 2. OUTUBRO 2026
    const outSummary = await businessRules.getResellerFinancialSummary(prof.id, 2026, 9);
    console.log('\n>>> OUTUBRO / 2026:');
    console.log('  - Mensal a receber:', outSummary.monthlyToReceive);
    console.log('  - Semanal disponível:', outSummary.weeklyAvailable);
    console.log('  - Anual acumulado:', outSummary.annualToReceive);
    console.log('  - Card Principal Bruto:', outSummary.tax.bruto);
    console.log('  - Card Principal Líquido:', outSummary.tax.liquido);

    // 3. NOVEMBRO 2026
    const novSummary = await businessRules.getResellerFinancialSummary(prof.id, 2026, 10);
    console.log('\n>>> NOVEMBRO / 2026:');
    console.log('  - Mensal a receber:', novSummary.monthlyToReceive);
    console.log('  - Semanal disponível:', novSummary.weeklyAvailable);
    console.log('  - Anual acumulado:', novSummary.annualToReceive);
    console.log('  - Card Principal Bruto:', novSummary.tax.bruto);
    console.log('  - Card Principal Líquido:', novSummary.tax.liquido);

    // 4. DEZEMBRO 2026
    const dezSummary = await businessRules.getResellerFinancialSummary(prof.id, 2026, 11);
    console.log('\n>>> DEZEMBRO / 2026:');
    console.log('  - Mensal a receber:', dezSummary.monthlyToReceive);
    console.log('  - Semanal disponível:', dezSummary.weeklyAvailable);
    console.log('  - Anual acumulado:', dezSummary.annualToReceive);
    console.log('  - Card Principal Bruto:', dezSummary.tax.bruto);
    console.log('  - Card Principal Líquido:', dezSummary.tax.liquido);
    console.log('  - isDecember:', dezSummary.isDecember);
    console.log('  - Vendas fechadas no mês (salesCount):', dezSummary.salesCount);
    console.log('  - Faturamento Total (totalOrderVolume):', dezSummary.totalOrderVolume);
  }

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
