import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log('Orders count:', orders?.length, oErr);
  console.log('Orders:', JSON.stringify(orders, null, 2));

  const { data: txs, error: tErr } = await supabase.from('transactions').select('*');
  console.log('Total transactions in DB:', txs?.length, tErr);
  console.log('All transactions:', JSON.stringify(txs, null, 2));

  const { data: comms } = await supabase.from('comissoes_mmn').select('*');
  console.log('Total comissoes_mmn in DB:', comms?.length);
  console.log('All comissoes_mmn:', JSON.stringify(comms, null, 2));

  const { data: cashbacks } = await supabase.from('cashback_mmn').select('*');
  console.log('Total cashback_mmn in DB:', cashbacks?.length);
  console.log('All cashback_mmn:', JSON.stringify(cashbacks, null, 2));
}

main().catch(console.error);
