import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

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

async function syncPlans() {
  console.log("=== Sincronizando Planos Oficiais no Supabase ===");
  
  // 1. Obter planos existentes
  const { data: existingPlans, error: getErr } = await supabase
    .from('products')
    .select('*')
    .eq('is_subscription', true);

  if (getErr) {
    console.error("Erro ao buscar planos:", getErr);
    return;
  }

  for (const plan of OFFICIAL_PLANS) {
    const existing = existingPlans?.find(p => p.plan_type === plan.plan_type);
    if (existing) {
      console.log(`Atualizando plano existente: ${plan.name} (${plan.plan_type}) - R$ ${plan.price}`);
      const { error: updateErr } = await supabase
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
      
      if (updateErr) console.error(`Erro ao atualizar ${plan.name}:`, updateErr.message);
      else console.log(`✔ ${plan.name} atualizado com sucesso!`);
    } else {
      console.log(`Inserindo novo plano: ${plan.name} (${plan.plan_type}) - R$ ${plan.price}`);
      const { error: insertErr } = await supabase
        .from('products')
        .insert([plan]);
      
      if (insertErr) console.error(`Erro ao inserir ${plan.name}:`, insertErr.message);
      else console.log(`✔ ${plan.name} inserido com sucesso!`);
    }
  }

  // Verificar resultado final
  const { data: finalPlans } = await supabase
    .from('products')
    .select('id, name, plan_type, price, duration_days, status, image')
    .eq('is_subscription', true)
    .order('price', { ascending: true });

  console.log("\n=== Planos Ativos Configurados no Banco ===");
  console.table(finalPlans);
}

syncPlans().catch(console.error);
