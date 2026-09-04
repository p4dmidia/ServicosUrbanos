import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function run() {
  console.log('--- AUTENTICANDO COM PERMISSÃO ELEVADA NO CLIENTE COMPILADO ---');
  const email = `debugger-verify2-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Verification Debugger 2' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  console.log('\n=== 1. VERIFICANDO DASHBOARD ADMINISTRATIVO - REDE MMN (businessRules.getPayableBalances("network")) ===');
  const networkBalances = await businessRules.getPayableBalances('network');
  console.log(`Total de beneficiários na Rede MMN: ${networkBalances.length}`);
  networkBalances.forEach(b => {
    console.log(`- [${b.role}] ${b.userName} (${b.profileId}) | Níveis: ${b.level} | Pedidos: ${b.orderNumber} | Semanal: R$ ${b.digitalPending} | Mensal: R$ ${b.monthlyPending} | Anual: R$ ${b.annualPending} | Total: R$ ${b.totalPending}`);
  });

  console.log('\n=== 2. VERIFICANDO DASHBOARD ADMINISTRATIVO - REVENDEDOR REGIONAL (businessRules.getPayableBalances("reseller")) ===');
  const resellerBalances = await businessRules.getPayableBalances('reseller');
  console.log(`Total de revendedores com saldos: ${resellerBalances.length}`);
  resellerBalances.forEach(b => {
    console.log(`- [${b.role}] ${b.userName} (${b.profileId}) | Pedidos: ${b.orderNumber} | Semanal: R$ ${b.digitalPending} | Mensal: R$ ${b.monthlyPending} | Anual: R$ ${b.annualPending} | Total: R$ ${b.totalPending}`);
  });

  console.log('\n=== 3. VERIFICANDO SILVANA JORGE - FINANCEIRO DE REDE (getEcosystemActivity) ===');
  const silvanaId = 'b3628b24-1b89-41fd-bc4d-f787cdaf327a';
  const silvanaActivity = await businessRules.getEcosystemActivity(silvanaId);
  console.log(`Lançamentos de Rede da Silvana: ${silvanaActivity.length}`);
  silvanaActivity.forEach(a => {
    console.log(`- Pedido: #${a.orderId} | Tipo: ${a.cashbackType} | Nível: ${a.level} | Valor: R$ ${a.amount} | Status: ${a.status}`);
  });

  console.log('\n=== 4. VERIFICANDO SILVANA JORGE - FINANCEIRO DE REVENDA (getResellerFinancialSummary) ===');
  const silvanaReseller = await businessRules.getResellerFinancialSummary(silvanaId, 2026, 8); // Setembro 2026
  console.log(`Vendas consolidadas: ${silvanaReseller.salesList.length}`);
  silvanaReseller.salesList.forEach(s => {
    console.log(`- Pedido #${s.orderId} | Cliente: ${s.customerName} | Semanal: R$ ${s.semanal} | Status: ${s.status}`);
  });

  console.log('\nItens detalhados de revenda:');
  silvanaReseller.itemizedTransactions.forEach(it => {
    console.log(`- Pedido #${it.orderId} | Categoria: ${it.category} | Valor: R$ ${it.amount} | Status: ${it.status}`);
  });

  console.log(`\nSaldos do Revendedor: Semanal a receber: R$ ${silvanaReseller.weeklyAvailable} | Mensal a receber: R$ ${silvanaReseller.monthlyToReceive} | Anual a receber: R$ ${silvanaReseller.annualToReceive}`);

  // Reverte debugger user
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
