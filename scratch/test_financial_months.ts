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

  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';

  console.log('=== TESTANDO MESES NO FINANCEIRO DO REVENDEDOR (EMERSON) ===\n');

  // 1. SETEMBRO 2026 (month = 8)
  const setSummary = await businessRules.getResellerFinancialSummary(emersonId, 2026, 8);
  console.log('>>> SETEMBRO / 2026:');
  console.log('  - Mensal a receber (mês):', setSummary.monthlyToReceive);
  console.log('  - Semanal disponível (acumulado):', setSummary.weeklyAvailable);
  console.log('  - Anual acumulado (ano):', setSummary.annualToReceive);
  console.log('  - Bruto a receber no card principal:', setSummary.tax.bruto);
  console.log('  - Líquido a receber no card principal:', setSummary.tax.liquido);
  console.log('  - isDecember:', setSummary.isDecember);

  // 2. NOVEMBRO 2026 (month = 10)
  const novSummary = await businessRules.getResellerFinancialSummary(emersonId, 2026, 10);
  console.log('\n>>> NOVEMBRO / 2026:');
  console.log('  - Mensal a receber (mês):', novSummary.monthlyToReceive);
  console.log('  - Semanal disponível (acumulado):', novSummary.weeklyAvailable);
  console.log('  - Anual acumulado (ano):', novSummary.annualToReceive);
  console.log('  - Bruto a receber no card principal:', novSummary.tax.bruto);
  console.log('  - Líquido a receber no card principal:', novSummary.tax.liquido);
  console.log('  - isDecember:', novSummary.isDecember);

  // 3. DEZEMBRO 2026 (month = 11)
  const dezSummary = await businessRules.getResellerFinancialSummary(emersonId, 2026, 11);
  console.log('\n>>> DEZEMBRO / 2026:');
  console.log('  - Mensal a receber (mês):', dezSummary.monthlyToReceive);
  console.log('  - Semanal disponível (acumulado):', dezSummary.weeklyAvailable);
  console.log('  - Anual acumulado (ano):', dezSummary.annualToReceive);
  console.log('  - Bruto a receber no card principal:', dezSummary.tax.bruto);
  console.log('  - Líquido a receber no card principal:', dezSummary.tax.liquido);
  console.log('  - isDecember:', dezSummary.isDecember);
  console.log('  - Itens detalhados exibidos em Dezembro:', dezSummary.itemizedTransactions.length);
  dezSummary.itemizedTransactions.forEach(item => {
    console.log(`    * [${item.category}] ${item.orderId} - R$ ${item.amount} (${item.status})`);
  });

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
