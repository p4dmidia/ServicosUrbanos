import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .ilike('full_name', '%silvana%')
    .maybeSingle();

  console.log("Silvana profile:", profile);

  if (!profile) return;

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  console.log(`Transactions for Silvana (${txs?.length || 0}):`);
  console.table(txs);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, created_at, order_date')
    .in('id', [1300, 1301, 1297, 1298, 1299]);

  console.log("Orders found:");
  console.table(orders);
}

inspect().catch(console.error);
