import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-investigate3-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Investigator3' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Payouts / Saques / Withdrawals
  const { data: withdrawals } = await supabase
    .from('transactions')
    .select('*')
    .in('type', ['withdrawal', 'payout'])
    .order('created_at', { ascending: false });

  console.log(`=== WITHDRAWALS / PAYOUTS (${withdrawals?.length || 0}) ===`);
  withdrawals?.forEach(w => {
    console.log(`ID: ${w.id} | Profile: ${w.profile_id} | Type: ${w.type} | Amount: ${w.amount} | Status: ${w.status} | Desc: "${w.description}" | Created: ${w.created_at}`);
  });

  // 2. Transações de Silvana
  const { data: silvanaProfiles } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%silvana%');

  console.log('\n=== PERFIL SILVANA ===');
  silvanaProfiles?.forEach(s => {
    console.log(s);
  });

  if (silvanaProfiles && silvanaProfiles.length > 0) {
    const sId = silvanaProfiles[0].id;
    const { data: sTxs } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', sId)
      .order('created_at', { ascending: false });

    console.log(`\n=== TODAS TRANSAÇÕES DA SILVANA (${sTxs?.length}) ===`);
    sTxs?.forEach(t => {
      console.log(`TX #${t.id} | Order: ${t.order_id} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Desc: "${t.description}" | Created: ${t.created_at}`);
    });
  }

  // 3. Transações de Sic Comercio
  const { data: sicProfiles } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%sic comercio%,email.ilike.%xipsdapraia%');

  console.log('\n=== PERFIL SIC COMERCIO ===');
  sicProfiles?.forEach(s => {
    console.log(s);
  });

  if (sicProfiles && sicProfiles.length > 0) {
    const sicId = sicProfiles[0].id;
    const { data: sicTxs } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', sicId)
      .order('created_at', { ascending: false });

    console.log(`\n=== TODAS TRANSAÇÕES DA SIC COMÉRCIO (${sicTxs?.length}) ===`);
    sicTxs?.forEach(t => {
      console.log(`TX #${t.id} | Order: ${t.order_id} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Desc: "${t.description}" | Created: ${t.created_at}`);
    });
  }

  // 4. Pedidos 1237 e 1240 - compradores e sponsor
  const { data: ordersInternet } = await supabase
    .from('orders')
    .select('*')
    .in('order_number', [1237, 1240]);

  console.log('\n=== PEDIDOS 1237 e 1240 ===');
  for (const o of ordersInternet || []) {
    console.log(`Pedido ${o.order_number}: Customer: ${o.customer_name} (${o.customer_id}), Affiliate: ${o.affiliate_id}, Reseller: ${o.regional_reseller_id}`);
    const { data: cust } = await supabase.from('profiles').select('*').eq('id', o.customer_id).single();
    console.log(`  Comprador ${cust?.full_name}: sponsor_id=${cust?.sponsor_id}, role=${cust?.role}`);
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
