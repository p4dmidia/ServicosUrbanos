import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const productId = "985c90de-198b-426d-a67d-5c722c95f162"; // Xips de Banana
  const branchId = "69dd0f13-ef66-431b-92e4-bed79b4e45eb";  // Unijorge
  const quantity = 1;

  console.log("Before decrement:");
  const { data: stockBefore } = await supabase
    .from('product_stocks')
    .select('*')
    .eq('product_id', productId)
    .eq('branch_id', branchId);
  console.log("Branch stock:", stockBefore);

  const { data: productBefore } = await supabase
    .from('products')
    .select('stock, sales')
    .eq('id', productId);
  console.log("Global product stock:", productBefore);

  console.log("\nCalling decrement_stock RPC...");
  const { data, error } = await supabase.rpc('decrement_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_branch_id: branchId
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success:", data);
  }

  console.log("\nAfter decrement:");
  const { data: stockAfter } = await supabase
    .from('product_stocks')
    .select('*')
    .eq('product_id', productId)
    .eq('branch_id', branchId);
  console.log("Branch stock:", stockAfter);

  const { data: productAfter } = await supabase
    .from('products')
    .select('stock, sales')
    .eq('id', productId);
  console.log("Global product stock:", productAfter);
}

run().catch(console.error);
