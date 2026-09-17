import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log('Orders count:', orders?.length);
  if (orders) {
    orders.forEach(o => {
      console.log(`Order ID: ${o.id}, amount: ${o.amount}, status: ${o.status}, order_date: ${o.order_date}, created_at: ${o.created_at}`);
    });
  }

  const { data: txs, error: tErr } = await supabase.from('transactions').select('*').eq('type', 'commission');
  console.log('\nCommissions count:', txs?.length);
  if (txs) {
    txs.forEach(t => {
      console.log(`Tx ID: ${t.id}, amount: ${t.amount}, desc: ${t.description}, order_id: ${t.order_id}, status: ${t.status}, created_at: ${t.created_at}`);
    });
  }
}

run();
