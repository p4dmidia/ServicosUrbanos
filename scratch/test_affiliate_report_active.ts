import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testAffiliateReport() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, profile_id, amount, created_at, status, type, description')
    .in('status', ['completed', 'pago', 'pending'])
    .in('type', ['commission', 'withdrawal']);

  const affiliateIds = [...new Set(transactions?.map(t => t.profile_id).filter(Boolean))];

  const [{ data: profiles }, { data: subs }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, pix_key, pix_type, cpf, whatsapp, role').in('id', affiliateIds),
    supabase.from('subscriptions').select('*').in('profile_id', affiliateIds),
    supabase.from('orders').select('id, customer_id, status, created_at, order_date, items').in('customer_id', affiliateIds).in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído'])
  ]);

  const now = new Date();

  affiliateIds.forEach(id => {
    const prof = profiles?.find(p => p.id === id);
    const userSubs = subs?.filter(s => s.profile_id === id) || [];
    const userOrders = orders?.filter(o => o.customer_id === id) || [];

    const hasActiveSub = userSubs.some(s => s.status === 'active' && new Date(s.end_date) >= now);
    
    let hasPaidSubOrder = false;
    let planName = '';
    userOrders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(item => {
        if (item.is_subscription) {
          const oDate = new Date(o.order_date || o.created_at);
          let days = 365;
          if (item.plan_type === 'mensal') days = 30;
          else if (item.plan_type === 'trimestral') days = 90;
          else if (item.plan_type === 'semestral') days = 180;
          const expDate = new Date(oDate.getTime() + days * 24 * 60 * 60 * 1000);
          if (expDate >= now) {
            hasPaidSubOrder = true;
            planName = item.name || `Plano ${item.plan_type}`;
          }
        }
      });
    });

    const isRegional = prof?.role === 'regional_reseller';
    const isActive = hasActiveSub || hasPaidSubOrder || isRegional;

    console.log(`Affiliate: ${prof?.full_name} (${id})`);
    console.log(`  Role: ${prof?.role}`);
    console.log(`  HasActiveSub: ${hasActiveSub}, HasPaidSubOrder: ${hasPaidSubOrder}, IsRegional: ${isRegional}`);
    console.log(`  => IS_ACTIVE: ${isActive} (Plan: ${planName || 'Nenhum'})\n`);
  });
}

testAffiliateReport();
