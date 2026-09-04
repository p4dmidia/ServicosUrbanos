import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-orders-1237-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Investigator 1237' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // Buscar todos os pedidos
  const { data: allOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(15);
  console.log('=== ÚLTIMOS 15 PEDIDOS ===');
  allOrders?.forEach(o => {
    console.log(`ID: ${o.id} | Desc/Number: ${o.order_number || o.id} | Customer: ${o.customer_name} (${o.customer_id}) | Total: ${o.amount || o.total} | Affiliate: ${o.affiliate_id} | Reseller: ${o.regional_reseller_id}`);
  });

  // Perfis 33b4bdfe e a71e33d7
  const ids = ['33b4bdfe-e9b0-4c9a-af7f-a0b2fd044196', 'a71e33d7-a47d-4e47-9636-b3dc18d37c4c', 'b105a4ae-10c4-4b50-af0c-db0e3252331d'];
  for (const id of ids) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('profile_id', id);
    console.log(`\nPerfil [${id}]:`, p?.full_name, '| Role:', p?.role, '| Status:', p?.status, '| Sponsor:', p?.referred_by || p?.sponsor_id);
    console.log('  Subs:', subs);
  }

  // Pedidos 1237 e 1240
  const targetOrders = allOrders?.filter(o => String(o.id).includes('1237') || String(o.id).includes('1240') || String(o.order_number).includes('1237') || String(o.order_number).includes('1240'));
  console.log('\n=== DETALHES PEDIDOS 1237 E 1240 ===');
  for (const o of targetOrders || []) {
    console.log(JSON.stringify(o, null, 2));
    const { data: cust } = await supabase.from('profiles').select('*').eq('id', o.customer_id).maybeSingle();
    console.log(`  Comprador [${cust?.id}]: ${cust?.full_name}, sponsor=${cust?.referred_by}, role=${cust?.role}`);
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
