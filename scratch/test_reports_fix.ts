import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testReports() {
  console.log('--- TESTANDO ORDERS NA TABELA ---');
  const { data: allOrders } = await supabase.from('orders').select('id, amount, status, created_at, order_date');
  console.log('Total de pedidos:', allOrders?.length);
  console.log('Pedidos:', allOrders);

  // Teste 1: Query atual com order_date
  const startDate = new Date('2026-09-01T00:00:00.000Z');
  const endDate = new Date('2026-09-16T23:59:59.999Z');

  const { data: currentQueryOrders } = await supabase
    .from('orders')
    .select('amount, order_date, created_at')
    .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído'])
    .gte('order_date', startDate.toISOString())
    .lte('order_date', endDate.toISOString());

  console.log('Resultado da query atual (com order_date):', currentQueryOrders);

  // Teste 2: Query corrigida com created_at
  const { data: fixedQueryOrders } = await supabase
    .from('orders')
    .select('amount, order_date, created_at')
    .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  console.log('Resultado da query corrigida (com created_at):', fixedQueryOrders);
}

testReports();
