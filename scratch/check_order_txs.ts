import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  // Let's check transactions for order 1277
  const { data: txs } = await supabase.from('transactions').select('*').eq('order_id', '1277');
  console.log('Txs for order 1277:', txs);

  // Let's check txs for order 1276
  const { data: txs1276 } = await supabase.from('transactions').select('*').eq('order_id', '1276');
  console.log('Txs for order 1276:', txs1276);
}

run();
