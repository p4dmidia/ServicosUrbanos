import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test(name: string, params: any) {
  console.log(`\nTesting with:`, params);
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    console.log(`Failed:`, error.message);
  } else {
    console.log(`SUCCESS! Data:`, data);
  }
}

async function run() {
  const productId = "985c90de-198b-426d-a67d-5c722c95f162"; // Xips de Banana
  const branchId = "69dd0f13-ef66-431b-92e4-bed79b4e45eb";  // Unijorge
  const quantity = 1;

  // 1. With p_ prefix, all params
  await test('decrement_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_branch_id: branchId
  });

  // 2. With p_ prefix, no branch
  await test('decrement_stock', {
    p_product_id: productId,
    p_quantity: quantity
  });

  // 3. Without p_ prefix, all params
  await test('decrement_stock', {
    product_id: productId,
    quantity: quantity,
    branch_id: branchId
  });

  // 4. Without p_ prefix, no branch
  await test('decrement_stock', {
    product_id: productId,
    quantity: quantity
  });
}

run().catch(console.error);
