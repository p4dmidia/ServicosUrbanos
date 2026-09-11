import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: order } = await supabase.from('orders').select('*').eq('id', '1277').single();
  console.log('Order 1277 items:', JSON.stringify(order?.items, null, 2));
}

run();
