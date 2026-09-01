import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, cpf');
  const { data: subs } = await supabase.from('subscriptions').select('*');
  const { data: orders } = await supabase.from('orders').select('id, customer_id, status, created_at, items');

  console.log('--- PROFILES ---');
  profiles?.forEach(p => console.log(p.id, p.full_name, p.role));

  console.log('\n--- SUBSCRIPTIONS ---');
  subs?.forEach(s => console.log('Sub:', s.id, 'Profile:', s.profile_id, 'Plan:', s.plan_type, 'Status:', s.status, 'End:', s.end_date));

  console.log('\n--- ORDERS ---');
  orders?.forEach(o => console.log('Order:', o.id, 'Customer:', o.customer_id, 'Status:', o.status, 'Items:', JSON.stringify(o.items)));
}

check();
