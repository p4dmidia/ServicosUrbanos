import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTxs() {
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('Total transactions:', txs?.length);
  const byType: Record<string, number> = {};
  txs?.forEach(t => {
    byType[t.type] = (byType[t.type] || 0) + Number(t.amount || 0);
  });
  console.log('Totals by type:', byType);

  const commissionTxs = txs?.filter(t => t.type === 'commission');
  console.log('Commission txs count:', commissionTxs?.length);
  commissionTxs?.forEach(t => {
    console.log(`Tx #${t.id}: amount=${t.amount}, desc=${t.description}, order_id=${t.order_id}, created_at=${t.created_at}`);
  });
}

checkTxs();
