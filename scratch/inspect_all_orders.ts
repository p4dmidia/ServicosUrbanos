import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: orders, error } = await supabase.from('orders').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${orders.length} orders:`);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Amount: ${o.amount}, Status: ${o.status}, PayoutStatus: ${o.payout_status}, Date: ${o.order_date}, Cashback: ${o.cashback_amount}`);
  });
}

check();
