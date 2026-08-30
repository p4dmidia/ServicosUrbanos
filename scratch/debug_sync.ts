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
    .select('*')
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${orders?.length} paid orders.`);

  for (const o of (orders || [])) {
    const items = Array.isArray(o.items) ? o.items : [];
    console.log(`\nOrder #${o.id} by ${o.customer_name}:`);
    for (const item of items) {
      console.log(`- Item name: "${item.name}"`);
      console.log(`  is_subscription (raw):`, item.is_subscription);
      console.log(`  is_subscription (type):`, typeof item.is_subscription);
      
      const isSubCondition = item.is_subscription === true || item.is_subscription === 'true';
      console.log(`  Matches is_subscription condition?`, isSubCondition);
      
      if (isSubCondition) {
        console.log(`  plan_type:`, item.plan_type);
        console.log(`  price:`, item.price);
      }
    }
  }
}

run().catch(console.error);
