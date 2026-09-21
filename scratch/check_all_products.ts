import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('id, name, plan_type, price, is_subscription, status');

  console.log("All products in database:");
  console.table(allProducts);
}

main().catch(console.error);
