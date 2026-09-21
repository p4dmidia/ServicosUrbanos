import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'admin-plans-1790013394551@test.com';
  const password = 'SuperAdminPassword123!';
  
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  console.log("Logged in as admin user:", authData.user.id);
  
  // Set role to admin
  await supabase.from('profiles').update({ role: 'admin' }).eq('id', authData.user.id);

  const plan = {
    name: 'Revendedor Regional',
    plan_type: 'revendedor',
    price: 85,
    duration_days: 365,
    image: '👑',
    status: 'Ativo',
    category: 'Assinatura',
    is_subscription: true,
    stock: 999999,
    cashback: 0
  };

  console.log("Inserting Revendedor Regional plan...");
  const { data, error } = await supabase
    .from('products')
    .insert([plan])
    .select();

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Inserted plan successfully:", data);
  }

  const { data: allPlans } = await supabase
    .from('products')
    .select('id, name, plan_type, price, duration_days, status, image')
    .eq('is_subscription', true)
    .order('price', { ascending: true });

  console.table(allPlans);
}

main().catch(console.error);
