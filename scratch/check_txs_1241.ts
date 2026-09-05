import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function check() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, amount, status, description')
    .eq('order_id', 1241)
    .order('id');
  console.log('Transações do pedido 1241 no banco:');
  console.table(txs);
}

check().catch(console.error);
