import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkOrderCurrent() {
  const { data: order } = await supabase.from('orders').select('id, status, amount, customer_id, reseller_id').eq('id', '9685').single();
  console.log('Order 9685 current state:', order);
}

checkOrderCurrent();
