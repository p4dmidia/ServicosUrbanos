import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  console.log('Last 30 transactions:', JSON.stringify(txs, null, 2));

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('Last 10 orders:', JSON.stringify(orders, null, 2));
}

main().catch(console.error);

