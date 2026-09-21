import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';

async function testFullScenario() {
  console.log('=== SIMULANDO CENÁRIO 1 E 2: PEDIDO 1301 ===\n');

  const email = `debugger-test-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', uid);
  }

  const silvanaId = 'b3628b24-1b89-41fd-bc4d-f787cdaf327a';
  const empresaId = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 1. Inserir Pedido 1301
  const { data: orderData, error: orderErr } = await supabase.from('orders').upsert({
    id: '1301',
    customer_id: '501cf803-7047-4ae6-a96d-cb96815acc98', // Ruan de Oliveira
    customer_name: 'Ruan de Oliveira',
    amount: 85.00,
    status: 'Concluído',
    order_date: now.toISOString(),
    created_at: now.toISOString(),
    reseller_id: silvanaId
  }).select().single();

  console.log('Pedido 1301 upsert:', orderData?.id, orderErr);

  // 2. Inserir as transações geradas pelo Pedido 1301
  const txsToInsert = [
    {
      profile_id: '501cf803-7047-4ae6-a96d-cb96815acc98',
      type: 'commission',
      description: 'Comissão Mensal G0 (Titular) - Pedido #1301',
      amount: 4.25,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: '501cf803-7047-4ae6-a96d-cb96815acc98',
      type: 'commission',
      description: 'Comissão Anual G0 (Titular) - Pedido #1301',
      amount: 1.70,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: silvanaId,
      type: 'commission',
      description: 'Comissão Mensal G1 - Pedido #1301',
      amount: 4.25,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: silvanaId,
      type: 'commission',
      description: 'Comissão Anual G1 - Pedido #1301',
      amount: 1.70,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: empresaId,
      type: 'commission',
      description: 'Comissão Mensal G2 (Empresa) - Pedido #1301',
      amount: 4.25,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: empresaId,
      type: 'commission',
      description: 'Comissão Anual G2 (Empresa) - Pedido #1301',
      amount: 1.70,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: silvanaId,
      type: 'commission',
      description: 'Comissão Revendedor Mensal (10.00%) - Pedido #1301',
      amount: 8.50,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    },
    {
      profile_id: silvanaId,
      type: 'commission',
      description: 'Comissão Revendedor Anual (2.00%) - Pedido #1301',
      amount: 1.70,
      status: 'pending',
      order_id: '1301',
      created_at: now.toISOString()
    }
  ];

  const { data: insertedTxs, error: txsErr } = await supabase.from('transactions').insert(txsToInsert).select();
  console.log('Transações inseridas:', insertedTxs?.length, txsErr);

  // 3. Verificação das 5 Abas do Dashboard

  console.log('\n--- VERIFICAÇÃO 1: ABA FINANCEIRO DA REDE ---');
  const stats = await businessRules.getAffiliateStats(silvanaId);
  console.log('Cartão Mensal (Rede): R$', stats.networkAvailableBalance, '| Esperado: 4.25');
  const activity = await businessRules.getEcosystemActivity(silvanaId);
  const p1301Activity = activity.find(a => a.orderId === '1301');
  console.log('Status do Pedido 1301 no Financeiro de Rede:', p1301Activity?.status, '| Esperado: Pendente');

  console.log('\n--- VERIFICAÇÃO 2: ABA FINANCEIRO DO REVENDEDOR ---');
  const resellerSummary = await businessRules.getResellerFinancialSummary(silvanaId, year, month - 1);
  console.log('Cartão Comissões Revenda: R$', resellerSummary.monthlyToReceive, '| Esperado: 8.50');
  const p1301Sale = resellerSummary.salesList?.find((s: any) => s.orderId === '1301');
  console.log('Status da Venda 1301 na Revenda:', p1301Sale?.status, '| Esperado: pending');

  console.log('\n--- VERIFICAÇÃO 3: ABA FINANCEIRO RESUMO ---');
  const consolidated = await businessRules.getConsolidatedFinancialStatement(silvanaId, year, month);
  console.log('Demonstrativo Consolidado:', {
    rpaNumber: consolidated.rpaNumber,
    isPaid: consolidated.isPaid,
    isSupplemental: consolidated.isSupplemental,
    brutoMensalMmn: consolidated.brutoMensalMmn,
    brutoMensalRevendedor: consolidated.brutoMensalRevendedor,
    totalBruto: consolidated.totalBruto,
    liquido: consolidated.liquido
  });
  console.log('Esperado: isPaid = false, isSupplemental = true, brutoMensalMmn = 4.25, brutoMensalRevendedor = 8.50, liquido = 12.75');

  console.log('\n--- VERIFICAÇÃO 4: ABA RECIBO RPA (PF) ---');
  const rpa = await businessRules.generateMonthlyRPAReceipt(silvanaId, `${year}-${String(month).padStart(2, '0')}`);
  console.log('RPA Complementar Gerado:', {
    rpa_number: rpa?.rpa_number,
    status: rpa?.status,
    rede_g1: rpa?.financial?.rede_g1,
    vendas_revendedor: rpa?.financial?.vendas_revendedor,
    liquido_total: rpa?.financial?.liquido_total
  });
  console.log('Esperado: status = pendente_previsao, rede_g1 = 4.25, vendas_revendedor = 8.50, liquido_total = 12.75');

  console.log('\n--- VERIFICAÇÃO 5: TRANSAÇÕES CREDITADAS PARA A EMPRESA ---');
  const { data: empresaTxs } = await supabase.from('transactions').select('*').eq('profile_id', empresaId).eq('order_id', '1301');
  console.log('Transações da Empresa para o Pedido 1301:', empresaTxs?.map(t => ({ desc: t.description, amount: t.amount, status: t.status })));
}

testFullScenario().catch(err => console.error('Erro:', err));
