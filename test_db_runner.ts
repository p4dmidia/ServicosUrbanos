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
  console.log('--- DB DEBUGGING ---');
  
  // 1. Fetch managers
  const { data: managers, error: err1 } = await supabase
    .from('profiles')
    .select('id, full_name, role, branch_id, merchant_id')
    .eq('role', 'manager');
  console.log('Managers:', managers || err1?.message);

  // 2. Fetch branches
  const { data: branches, error: err2 } = await supabase
    .from('branches')
    .select('id, name, merchant_id');
  console.log('Branches:', branches || err2?.message);

  // 3. Fetch orders
  const { data: orders, error: err3 } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, branch_id, order_date')
    .limit(10);
  console.log('Recent Orders:', orders || err3?.message);
}

run().catch(console.error);
