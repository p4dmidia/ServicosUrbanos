import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: subs } = await supabase.from('subscriptions').select('*');
  console.log('All subscriptions in DB:', subs);

  const { data: orders } = await supabase.from('orders').select('id, customer_id, customer_name, status, created_at, items');
  console.log('All orders in DB:', orders);
}

run();
