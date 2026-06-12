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
  console.log("Fetching products...");
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, category, price');
    
  if (pError) {
    console.error("Error products:", pError.message);
  } else {
    console.log("Products in DB:", JSON.stringify(products, null, 2));
  }

  console.log("Fetching categories...");
  const { data: categories, error: cError } = await supabase
    .from('categories')
    .select('id, name');
    
  if (cError) {
    console.error("Error categories:", cError.message);
  } else {
    console.log("Categories in DB:", JSON.stringify(categories, null, 2));
  }
}

run().catch(console.error);
