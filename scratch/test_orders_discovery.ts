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

async function testOrdersDiscovery() {
  const userId = 'a00a6bab-5720-4632-a0db-3604b3a9e258'; // Emerson
  
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: orders } = await supabase.from('orders').select('*').in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada', 'Aguardando Pagamento']);
  const { data: config } = await supabase.from('mmn_config').select('*').maybeSingle();
  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level');

  console.log('Orders found:', orders?.length);

  // Build referral tree
  const directReferrals = profiles?.filter(p => p.referred_by === userId).map(p => p.id) || [];
  const secondReferrals = profiles?.filter(p => directReferrals.includes(p.referred_by || '')).map(p => p.id) || [];

  console.log('Direct referrals (G1):', directReferrals);
  console.log('Second referrals (G2):', secondReferrals);

  const breakdown: any[] = [];

  (orders || []).forEach(o => {
    const isOwn = o.customer_id === userId;
    const isG1 = directReferrals.includes(o.customer_id);
    const isG2 = secondReferrals.includes(o.customer_id);
    const isReseller = o.reseller_id === userId || (!o.reseller_id && (isOwn || isG1));

    const amt = Number(o.amount || 0);

    if (isOwn) {
      breakdown.push({
        orderNumber: `#${o.id}`,
        date: new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR'),
        customerName: o.customer_name,
        origin: 'Cashback Mensal (G0 Titular)',
        amount: amt,
        rate: '5%',
        commissionAmount: amt * 0.05,
        status: o.status
      });
      if (emersonIsReseller(profiles?.find(p => p.id === userId))) {
        breakdown.push({
          orderNumber: `#${o.id}`,
          date: new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR'),
          customerName: o.customer_name,
          origin: 'Venda Direta / Polo Regional (10%)',
          amount: amt,
          rate: '10%',
          commissionAmount: amt * 0.10,
          status: o.status
        });
        breakdown.push({
          orderNumber: `#${o.id}`,
          date: new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR'),
          customerName: o.customer_name,
          origin: 'Provisão Anual Polo Regional (2%)',
          amount: amt,
          rate: '2%',
          commissionAmount: amt * 0.02,
          status: o.status
        });
      }
    } else if (isG1) {
      breakdown.push({
        orderNumber: `#${o.id}`,
        date: new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR'),
        customerName: o.customer_name,
        origin: 'Comissão de Rede MMN (Nível G1 - 7%)',
        amount: amt,
        rate: '7%',
        commissionAmount: amt * 0.07,
        status: o.status
      });
      if (emersonIsReseller(profiles?.find(p => p.id === userId))) {
        breakdown.push({
          orderNumber: `#${o.id}`,
          date: new Date(o.order_date || o.created_at).toLocaleDateString('pt-BR'),
          customerName: o.customer_name,
          origin: 'Venda Polo Regional (10%)',
          amount: amt,
          rate: '10%',
          commissionAmount: amt * 0.10,
          status: o.status
        });
      }
    }
  });

  console.log('Generated Breakdown:', breakdown);
  const total = breakdown.reduce((s, b) => s + b.commissionAmount, 0);
  console.log('Total Commissions:', total);
}

function emersonIsReseller(p: any) {
  return p?.role === 'regional_reseller' || p?.role === 'reseller' || p?.reseller_id;
}

testOrdersDiscovery();
