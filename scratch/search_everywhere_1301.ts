import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  // 1. Transactions
  const { data: txs } = await supabase.from('transactions').select('*');
  console.log(`Total transactions in DB: ${txs?.length || 0}`);
  if (txs && txs.length > 0) console.table(txs);

  // 2. Orders
  const { data: orders } = await supabase.from('orders').select('id, customer_name, customer_id, amount, status, created_at').order('id', { ascending: false }).limit(10);
  console.log("Recent orders in DB:");
  console.table(orders);

  // 3. Subscriptions
  const { data: subs } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("Recent subscriptions in DB:");
  console.table(subs);
}

search().catch(console.error);
