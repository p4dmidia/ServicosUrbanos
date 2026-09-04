import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-investigate-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Investigator' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  console.log('--- BUSCANDO PEDIDOS ---');
  // Buscar pedidos com id ou sequence_id ou order_number ou similar
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (ordersErr) console.error('Erro ao buscar orders:', ordersErr);
  console.log(`Total orders encontradas: ${orders?.length}`);
  
  // Imprimir campos essenciais dos últimos 10 pedidos
  orders?.slice(0, 10).forEach(o => {
    console.log(`Pedido ID: ${o.id}, Number: ${o.order_number || o.sequence_number || 'N/A'}, Customer: ${o.customer_name || o.customer_id}, Total: ${o.total || o.amount}, Status: ${o.status}, Created: ${o.created_at}, Affiliate: ${o.affiliate_id}, Reseller: ${o.regional_reseller_id}`);
  });

  // Identificar os IDs dos pedidos 1234, 1235, 1236, 1237, 1240
  // Pode ser que o id seja UUID e order_number seja 1234, ou o id seja '1234'
  const targetOrders = orders?.filter(o => {
    const num = String(o.order_number || o.sequence_number || o.id || '');
    return ['1234', '1235', '1236', '1237', '1240'].some(t => num.includes(t));
  }) || [];

  console.log('\n--- TARGET ORDERS IDENTIFICADAS ---');
  targetOrders.forEach(o => console.log(JSON.stringify(o, null, 2)));

  const orderIds = targetOrders.map(o => o.id);

  console.log('\n--- BUSCANDO TRANSAÇÕES DESSES PEDIDOS ---');
  let { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  const relevantTxs = txs?.filter(t => orderIds.includes(t.order_id) || ['1234', '1235', '1236', '1237', '1240'].some(n => t.description?.includes(n))) || [];
  console.log(`Transações relevantes encontradas: ${relevantTxs.length}`);
  relevantTxs.forEach(t => {
    console.log(`TX [${t.id}] Order: ${t.order_id} | Profile: ${t.profile_id} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Desc: "${t.description}" | Created: ${t.created_at}`);
  });

  console.log('\n--- BUSCANDO PERFIS SILVANA, GUSTAVO, PAULO, SIC COMERCIO ---');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, sponsor_id, referral_code, cpf_cnpj');
  
  const keyProfiles = profiles?.filter(p => {
    const n = (p.full_name || '').toLowerCase();
    return n.includes('silvana') || n.includes('gustavo') || n.includes('paulo') || n.includes('sic');
  }) || [];

  keyProfiles.forEach(p => {
    console.log(`Profile: ${p.full_name} | ID: ${p.id} | Role: ${p.role} | Status: ${p.status} | Sponsor: ${p.sponsor_id} | Code: ${p.referral_code}`);
    // Saques e transações recentes desse perfil
    const userTxs = txs?.filter(t => t.profile_id === p.id) || [];
    console.log(`  Total TXs: ${userTxs.length}`);
    userTxs.slice(0, 10).forEach(ut => {
      console.log(`    TX ${ut.id}: ${ut.type} | ${ut.amount} | status: ${ut.status} | desc: "${ut.description}"`);
    });
  });

  // Reverte debugger user
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
