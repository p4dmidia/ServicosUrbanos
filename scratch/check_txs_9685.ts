import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTxs() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .or(`description.ilike.%9685%,order_id.eq.9685`);
  
  console.log('Transactions for order 9685:', txs);
}

checkTxs();
