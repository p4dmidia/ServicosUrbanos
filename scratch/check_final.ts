import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkFinal() {
  const { data: order } = await supabase.from('orders').select('*').eq('id', '9685').single();
  console.log('Order 9685 final state:', order.id, order.status, order.customer_name, order.amount);
}

checkFinal();
