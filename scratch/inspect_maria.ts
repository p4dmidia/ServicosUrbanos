import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('--- Inspecting Maria Rodrigues and Jose ---');
  const { data: jose } = await supabase.from('profiles').select('*').ilike('full_name', '%jose005%');
  console.log('Jose:', jose);

  const { data: maria } = await supabase.from('profiles').select('*').ilike('full_name', '%maria%');
  console.log('Maria:', maria);

  if (maria && maria.length > 0) {
    const mariaId = maria[0].id;
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('profile_id', mariaId);
    console.log('Maria subscriptions:', subs);

    const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', mariaId);
    console.log('Maria orders:', orders);
  }
}

run();
