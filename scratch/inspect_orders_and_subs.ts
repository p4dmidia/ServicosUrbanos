import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  const email = `debugger-orders-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Orders Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: orders } = await supabase.from('orders').select('id, customer_id, customer_name, status, amount, items');
  console.log(`Total orders: ${orders?.length}`);
  orders?.forEach(o => {
    console.log(`Pedido #${o.id} | Status: ${o.status} | Customer: ${o.customer_name} (${o.customer_id}) | Items: ${JSON.stringify(o.items)}`);
  });

  // Assinaturas
  const { data: subs } = await supabase.from('subscriptions').select('*');
  console.log(`\nTotal subscriptions: ${subs?.length}`);
  subs?.forEach(s => {
    console.log(`Sub #${s.id} | Profile: ${s.profile_id} | Plan: ${s.plan_type} | Status: ${s.status} | End: ${s.end_date}`);
  });

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
