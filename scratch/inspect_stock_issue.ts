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
  console.log("=== CHECKING PRODUCTS ===");
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, stock, sales, branch_id, merchant_id')
    .ilike('name', '%xips%');
    
  if (pError) {
    console.error("Error products:", pError.message);
  } else {
    console.log("Products:", JSON.stringify(products, null, 2));
  }

  console.log("\n=== CHECKING BRANCHES ===");
  const { data: branches, error: bError } = await supabase
    .from('branches')
    .select('id, name, merchant_id, status');
    
  if (bError) {
    console.error("Error branches:", bError.message);
  } else {
    console.log("Branches:", JSON.stringify(branches, null, 2));
  }

  if (products && products.length > 0) {
    console.log("\n=== CHECKING PRODUCT STOCKS ===");
    const productIds = products.map(p => p.id);
    const { data: stocks, error: sError } = await supabase
      .from('product_stocks')
      .select('product_id, branch_id, stock')
      .in('product_id', productIds);
      
    if (sError) {
      console.error("Error product_stocks:", sError.message);
    } else {
      console.log("Product Stocks:", JSON.stringify(stocks, null, 2));
    }
  }

  console.log("\n=== CHECKING RECENT ORDERS ===");
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, branch_id, items, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (oError) {
    console.error("Error orders:", oError.message);
  } else {
    console.log("Orders:", JSON.stringify(orders, null, 2));
  }
}

run().catch(console.error);
