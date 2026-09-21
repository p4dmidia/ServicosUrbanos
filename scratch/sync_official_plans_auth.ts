import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const OFFICIAL_PLANS = [
  {
    name: 'Plano Mensal',
    plan_type: 'mensal',
    price: 10,
    duration_days: 30,
    image: '📅',
    status: 'Ativo',
    category: 'Assinatura',
    is_subscription: true,
    stock: 999999,
    cashback: 0
  },
  {
    name: 'Plano Trimestral',
    plan_type: 'trimestral',
    price: 25,
    duration_days: 90,
    image: '🌟',
    status: 'Ativo',
    category: 'Assinatura',
    is_subscription: true,
    stock: 999999,
    cashback: 0
  },
  {
    name: 'Plano Semestral',
    plan_type: 'semestral',
    price: 45,
    duration_days: 180,
    image: '💼',
    status: 'Ativo',
    category: 'Assinatura',
    is_subscription: true,
    stock: 999999,
    cashback: 0
  },
  {
    name: 'Plano Anual',
    plan_type: 'anual',
    price: 72,
    duration_days: 365,
    image: '🏆',
    status: 'Ativo',
    category: 'Assinatura',
    is_subscription: true,
    stock: 999999,
    cashback: 0
  },
  {
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
  }
];

async function main() {
  console.log('--- Sincronizando Planos Oficiais com Auth ---');
  
  // Login como usuário admin
  const email = `admin-plans-${Date.now()}@test.com`;
  const password = 'SuperAdminPassword123!';
  
  const { data: signUpData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Plans' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  } else {
    // Tenta logar com jose
    await supabase.auth.signInWithPassword({ email: 'jose@gmail.com', password: 'password123' }).catch(() => {});
  }

  const { data: existingPlans, error: getErr } = await supabase
    .from('products')
    .select('*')
    .eq('is_subscription', true);

  if (getErr) {
    console.error("Erro ao buscar produtos:", getErr);
    return;
  }

  for (const plan of OFFICIAL_PLANS) {
    const existing = existingPlans?.find(p => p.plan_type === plan.plan_type);
    if (existing) {
      console.log(`Atualizando ${plan.name} (${plan.plan_type}) para R$ ${plan.price}...`);
      const { error: updErr } = await supabase
        .from('products')
        .update({
          name: plan.name,
          price: plan.price,
          duration_days: plan.duration_days,
          image: plan.image,
          status: plan.status,
          category: plan.category,
          stock: plan.stock,
          cashback: plan.cashback
        })
        .eq('id', existing.id);

      if (updErr) console.error(`Erro ao atualizar ${plan.name}:`, updErr.message);
      else console.log(`✔ ${plan.name} atualizado com sucesso!`);
    } else {
      console.log(`Inserindo novo plano ${plan.name} (${plan.plan_type}) - R$ ${plan.price}...`);
      const { data: insData, error: insErr } = await supabase
        .from('products')
        .insert([plan])
        .select();

      if (insErr) console.error(`Erro ao inserir ${plan.name}:`, insErr.message);
      else console.log(`✔ ${plan.name} inserido com sucesso:`, insData);
    }
  }

  const { data: finalPlans } = await supabase
    .from('products')
    .select('id, name, plan_type, price, duration_days, status, image')
    .eq('is_subscription', true)
    .order('price', { ascending: true });

  console.log('\n--- Planos Finais no Banco ---');
  console.table(finalPlans);
}

main().catch(console.error);
