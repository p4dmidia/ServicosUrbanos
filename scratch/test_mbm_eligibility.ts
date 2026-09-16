import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionRepasseCycle, isCnpj } from '../src/lib/businessRules';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkMBM() {
  console.log('--- BUSCANDO ASSINATURAS ---');
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select(`
      id,
      profile_id,
      plan_type,
      amount,
      start_date,
      end_date,
      status,
      profiles (
        id,
        full_name,
        cpf,
        cnpj,
        birth_date,
        gender,
        description,
        store_name,
        status,
        person_type
      )
    `);

  console.log('Subs count:', subs?.length);
  for (const s of subs || []) {
    console.log('Sub:', {
      id: s.id,
      plan: s.plan_type,
      start: s.start_date,
      end: s.end_date,
      sub_status: s.status,
      user_name: (s.profiles as any)?.full_name,
      user_cpf: (s.profiles as any)?.cpf,
      user_status: (s.profiles as any)?.status,
      person_type: (s.profiles as any)?.person_type
    });
  }

  console.log('\n--- BUSCANDO PEDIDOS ---');
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_id, amount, status, created_at, order_date, items')
    .order('created_at', { ascending: false })
    .limit(5);

  for (const o of orders || []) {
    console.log('Order:', {
      id: o.id,
      customer_id: o.customer_id,
      amount: o.amount,
      status: o.status,
      created_at: o.created_at,
      items: o.items
    });
  }
}

checkMBM();
