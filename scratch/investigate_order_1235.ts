import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-investigate-1235-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Investigator 1235' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Pedido 1235
  const { data: order1235 } = await supabase
    .from('orders')
    .select('*')
    .or('order_number.eq.1235,id.eq.1235')
    .maybeSingle();

  console.log('=== PEDIDO 1235 ===');
  console.log(order1235);

  // 2. Transações do Pedido 1235
  const { data: txs1235 } = await supabase
    .from('transactions')
    .select('*')
    .or(`order_id.eq.${order1235?.id || 1235},description.ilike.%1235%`)
    .order('created_at', { ascending: true });

  console.log(`\n=== TRANSAÇÕES DO PEDIDO 1235 (${txs1235?.length}) ===`);
  const profileIds = [...new Set(txs1235?.map(t => t.profile_id) || [])];

  for (const t of txs1235 || []) {
    console.log(`TX ${t.id} | Profile: ${t.profile_id} | Amount: ${t.amount} | Desc: "${t.description}" | Status: ${t.status}`);
  }

  // 3. Perfis e suas assinaturas
  console.log('\n=== PERFIS RECEBEDORES DO PEDIDO 1235 ===');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, sponsor_id, referred_by')
    .in('id', profileIds);

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .in('profile_id', profileIds);

  profiles?.forEach(p => {
    const userSubs = subs?.filter(s => s.profile_id === p.id) || [];
    console.log(`Perfil: ${p.full_name} (${p.id}) | Role: ${p.role} | Status: ${p.status}`);
    console.log(`  Assinaturas (${userSubs.length}):`, userSubs.map(s => ({ status: s.status, end_date: s.end_date, plan: s.plan_type })));
  });

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
