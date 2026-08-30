import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching paid orders...");
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, status, items, created_at')
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${orders?.length} paid orders:`);
  console.log(JSON.stringify(orders, null, 2));
}

run().catch(console.error);
