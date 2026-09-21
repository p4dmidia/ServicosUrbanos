import { businessRules } from '../src/lib/businessRules';

async function testScenario1301() {
  console.log('=== TESTANDO APURAÇÃO E CONSOLIDAÇÃO DO CENÁRIO PEDIDO 1301 ===\n');

  const silvanaId = 'b3628b24-1b89-41fd-bc4d-f787cdaf327a';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  console.log('1. Testando getAffiliateStats para Silvana...');
  const stats = await businessRules.getAffiliateStats(silvanaId);
  console.log('Stats:', {
    networkAvailableBalance: stats.networkAvailableBalance,
    walletBalance: stats.walletBalance,
    monthlyBonus: stats.monthlyBonus,
    isCurrentMonthPaid: stats.isCurrentMonthPaid
  });

  console.log('\n2. Testando getEcosystemActivity (Financeiro da Rede)...');
  const activity = await businessRules.getEcosystemActivity(silvanaId);
  console.log(`Total de atividades: ${activity.length}`);
  activity.slice(0, 5).forEach(a => {
    console.log(`- Pedido: ${a.orderId} | Tipo: ${a.cashbackType} | Nível: ${a.level} | Valor: R$ ${a.amount} | Status: ${a.status}`);
  });

  console.log('\n3. Testando getResellerFinancialSummary (Financeiro do Revendedor)...');
  const resellerSummary = await businessRules.getResellerFinancialSummary(silvanaId, year, month - 1);
  console.log('Reseller Summary:', {
    monthlyEarned: resellerSummary.monthlyEarned,
    monthlyPaid: resellerSummary.monthlyPaid,
    monthlyToReceive: resellerSummary.monthlyToReceive,
    grossToReceive: resellerSummary.grossToReceive,
    salesCount: resellerSummary.salesCount
  });

  console.log('\n4. Testando getConsolidatedFinancialStatement (Financeiro Resumo)...');
  const consolidated = await businessRules.getConsolidatedFinancialStatement(silvanaId, year, month);
  console.log('Consolidated Statement:', {
    rpaNumber: consolidated.rpaNumber,
    isPaid: consolidated.isPaid,
    isSupplemental: consolidated.isSupplemental,
    totalBruto: consolidated.totalBruto,
    pendingBruto: consolidated.pendingBruto,
    liquido: consolidated.liquido,
    brutoMensalMmn: consolidated.brutoMensalMmn,
    brutoMensalRevendedor: consolidated.brutoMensalRevendedor,
    ordersCount: consolidated.ordersCount
  });

  console.log('\n5. Testando generateMonthlyRPAReceipt (Aba RPA)...');
  const rpa = await businessRules.generateMonthlyRPAReceipt(silvanaId, `${year}-${String(month).padStart(2, '0')}`);
  console.log('RPA:', {
    id: rpa?.id,
    rpa_number: rpa?.rpa_number,
    status: rpa?.status,
    bruto_total: rpa?.financial?.bruto_total,
    liquido_total: rpa?.financial?.liquido_total
  });

  console.log('\n=== TESTES CONCLUÍDOS COM SUCESSO ===');
}

testScenario1301().catch(err => {
  console.error('Erro no teste:', err);
});
