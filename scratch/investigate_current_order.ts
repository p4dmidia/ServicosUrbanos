import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  console.log('--- INVESTIGAÇÃO DO NOVO PEDIDO E CÁLCULOS ---');
  const email = `debugger-calc-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Calc Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Pedidos recentes
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n=== PEDIDOS RECENTES ===');
  orders?.forEach(o => {
    console.log(`Pedido #${o.id} | Amount: ${o.amount} | Status: ${o.status} | Customer: ${o.customer_name} (${o.customer_id}) | Items:`, o.items);
  });

  // 2. Transações recentes
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('\n=== TRANSAÇÕES RECENTES ===');
  txs?.forEach(t => {
    console.log(`TX #${t.id} | Profile: ${t.profile_id} | Type: ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Desc: "${t.description}"`);
  });

  // 3. mmn_config e mmn_levels
  const { data: config } = await supabase.from('mmn_config').select('*').single();
  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level', { ascending: true });

  console.log('\n=== MMN_CONFIG ===', config);
  console.log('\n=== MMN_LEVELS ===', levels);

  // 4. Assinatura do Emerson Mines Antunes
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const { data: emersonProfile } = await supabase.from('profiles').select('*').eq('id', emersonId).single();
  const { data: emersonSubs } = await supabase.from('subscriptions').select('*').eq('profile_id', emersonId);

  console.log('\n=== PERFIL DO EMERSON ===');
  console.log(`Nome: ${emersonProfile?.full_name} | Role: ${emersonProfile?.role} | Status: ${emersonProfile?.status}`);
  console.log('Assinaturas do Emerson:', emersonSubs);

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
