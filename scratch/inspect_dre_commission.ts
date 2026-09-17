import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: config } = await supabase.from('mmn_config').select('*');
  console.log('CONFIG:', config);

  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level', { ascending: true });
  console.log('LEVELS:', levels);

  const { data: orders } = await supabase.from('orders').select('*');
  console.log('ORDERS count:', orders?.length);
  orders?.forEach(o => {
    console.log(`Order ${o.id}: amount=${o.amount}, cashback_amount=${o.cashback_amount}, status=${o.status}, date=${o.order_date || o.created_at}`);
  });

  const { data: transactions } = await supabase.from('transactions').select('*').eq('type', 'commission');
  console.log('COMMISSIONS count:', transactions?.length);
  transactions?.forEach(t => {
    console.log(`Tx ${t.id}: amount=${t.amount}, desc=${t.description}, order_id=${t.order_id}`);
  });
}

run();
