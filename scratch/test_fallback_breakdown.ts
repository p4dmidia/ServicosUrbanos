import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function testFunction() {
  const userId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  
  const [{ data: allOrders }, { data: allProfiles }, { data: mmnConfig }] = await Promise.all([
    supabase.from('orders').select('*').in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada', 'Aguardando Pagamento']),
    supabase.from('profiles').select('id, full_name, referred_by, role, reseller_id'),
    supabase.from('mmn_config').select('*').maybeSingle()
  ]);

  const userProfile = (allProfiles || []).find(p => p.id === userId);
  const isReseller = userProfile?.role === 'regional_reseller' || userProfile?.role === 'reseller' || !!userProfile?.reseller_id;
  
  const directReferrals = (allProfiles || []).filter(p => p.referred_by === userId).map(p => p.id);
  const secondReferrals = (allProfiles || []).filter(p => directReferrals.includes(p.referred_by || '')).map(p => p.id);

  const breakdown: any[] = [];

  (allOrders || []).forEach((o) => {
    const isOwn = o.customer_id === userId;
    const isG1 = directReferrals.includes(o.customer_id);
    const isG2 = secondReferrals.includes(o.customer_id);
    const amt = Number(o.amount || 0);
    if (amt <= 0) return;

    const orderNum = `#${o.id}`;
    const orderDate = new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR');

    if (isOwn) {
      breakdown.push({
        id: `ord-${o.id}-g0`,
        orderId: String(o.id),
        orderNumber: orderNum,
        date: orderDate,
        origin: 'Cashback Mensal (G0 Titular)',
        amount: amt,
        rate: '5%',
        commissionAmount: parseFloat((amt * 0.05).toFixed(2)),
        status: o.status || 'Concluído'
      });

      if (isReseller) {
        breakdown.push({
          id: `ord-${o.id}-reseller-m`,
          orderId: String(o.id),
          orderNumber: orderNum,
          date: orderDate,
          origin: 'Venda Direta / Polo Regional (10%)',
          amount: amt,
          rate: '10%',
          commissionAmount: parseFloat((amt * 0.10).toFixed(2)),
          status: o.status || 'Concluído'
        });
        breakdown.push({
          id: `ord-${o.id}-reseller-a`,
          orderId: String(o.id),
          orderNumber: orderNum,
          date: orderDate,
          origin: 'Provisão Anual Polo Regional (2%)',
          amount: amt,
          rate: '2%',
          commissionAmount: parseFloat((amt * 0.02).toFixed(2)),
          status: o.status || 'Concluído'
        });
      }
    } else if (isG1) {
      breakdown.push({
        id: `ord-${o.id}-g1`,
        orderId: String(o.id),
        orderNumber: orderNum,
        date: orderDate,
        origin: `Comissão Rede MMN (Nível G1 - ${o.customer_name})`,
        amount: amt,
        rate: '7%',
        commissionAmount: parseFloat((amt * 0.07).toFixed(2)),
        status: o.status || 'Concluído'
      });

      if (isReseller) {
        breakdown.push({
          id: `ord-${o.id}-polo`,
          orderId: String(o.id),
          orderNumber: orderNum,
          date: orderDate,
          origin: `Venda Polo Regional (10% - ${o.customer_name})`,
          amount: amt,
          rate: '10%',
          commissionAmount: parseFloat((amt * 0.10).toFixed(2)),
          status: o.status || 'Concluído'
        });
      }
    } else if (isG2) {
      breakdown.push({
        id: `ord-${o.id}-g2`,
        orderId: String(o.id),
        orderNumber: orderNum,
        date: orderDate,
        origin: `Comissão Rede MMN (Nível G2 - ${o.customer_name})`,
        amount: amt,
        rate: '7%',
        commissionAmount: parseFloat((amt * 0.07).toFixed(2)),
        status: o.status || 'Concluído'
      });
    }
  });

  console.log('Result Breakdown:', JSON.stringify(breakdown, null, 2));
}

testFunction();
