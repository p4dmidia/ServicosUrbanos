import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all orders with null branch_id...');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, items, branch_id');

  if (error) {
    console.error('Error fetching orders:', error.message);
    return;
  }

  console.log(`Found ${orders.length} total orders.`);

  for (const order of orders) {
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      console.log(`Order #${order.id} has no items.`);
      continue;
    }

    const firstItem = order.items[0];
    
    // Resolve branch_id from the item itself
    let branchId = firstItem.branchId || firstItem.branch_id;
    
    // If not found, query the product from the products database table
    if (!branchId && firstItem.id) {
      const { data: product } = await supabase
        .from('products')
        .select('branch_id')
        .eq('id', firstItem.id)
        .maybeSingle();
      
      if (product?.branch_id) {
        branchId = product.branch_id;
      }
    }

    // If still not found, check if there is a branch we can fallback to (like Sic Comercio)
    if (!branchId) {
      // Find the first branch of the merchant
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .limit(1);
      if (branches && branches.length > 0) {
        branchId = branches[0].id;
      }
    }

    if (branchId) {
      console.log(`Updating Order #${order.id} with branch_id: ${branchId}`);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ branch_id: branchId })
        .eq('id', order.id);
      
      if (updateError) {
        console.error(`Failed to update Order #${order.id}:`, updateError.message);
      }
    } else {
      console.log(`Could not resolve branch_id for Order #${order.id}`);
    }
  }
  
  console.log('Script execution finished!');
}

run().catch(console.error);
