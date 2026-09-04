import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-investigate2-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Investigator2' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Perfis específicos
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, sponsor_id, referral_code, cpf_cnpj');

  const silvana = profiles?.find(p => p.full_name?.toLowerCase().includes('silvana'));
  const sic = profiles?.find(p => p.full_name?.toLowerCase().includes('sic comercio') || p.email?.includes('xipsdapraia'));
  const gustavo = profiles?.find(p => p.full_name?.toLowerCase().includes('gustavo'));
  const paulo = profiles?.find(p => p.full_name?.toLowerCase().includes('paulo'));

  console.log('=== PERFIS ENVOLVIDOS ===');
  [silvana, sic, gustavo, paulo].forEach(p => {
    if (p) console.log(`[${p.id}] ${p.full_name} | Role: ${p.role} | Status: ${p.status} | Sponsor: ${p.sponsor_id} | Code: ${p.referral_code}`);
  });

  // 2. Pedidos 1234, 1235, 1236, 1237, 1240
  console.log('\n=== PEDIDOS 1234, 1235, 1236, 1237, 1240 ===');
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .or('order_number.in.(1234,1235,1236,1237,1240),id.in.(1234,1235,1236,1237,1240)');

  orders?.forEach(o => {
    console.log(`Pedido ID: ${o.id}, Order#: ${o.order_number}, Customer: ${o.customer_name} (${o.customer_id}), Total: ${o.total}, Status: ${o.status}, AffiliateID: ${o.affiliate_id}, ResellerID: ${o.regional_reseller_id}, PaymentMethod: ${o.payment_method}`);
  });

  // 3. Todas as transações desses usuários e desses pedidos
  const targetUserIds = [silvana?.id, sic?.id, gustavo?.id, paulo?.id].filter(Boolean);
  const targetOrderIds = orders?.map(o => String(o.id)) || ['1234', '1235', '1236', '1237', '1240'];

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .or(`order_id.in.(${targetOrderIds.join(',')}),profile_id.in.(${targetUserIds.join(',')})`)
    .order('created_at', { ascending: true });

  console.log(`\n=== TRANSAÇÕES VINCULADAS (${txs?.length || 0}) ===`);
  txs?.forEach(t => {
    const pName = profiles?.find(p => p.id === t.profile_id)?.full_name || t.profile_id;
    console.log(`TX #${t.id} | Order: ${t.order_id} | Profile: ${pName} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Desc: "${t.description}" | Created: ${t.created_at}`);
  });

  // Reverte debugger user
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
