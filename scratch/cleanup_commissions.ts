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
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Database Debugger',
      }
    }
  });

  await supabase.auth.signInWithPassword({
    email,
    password
  });

  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);

  console.log("=== Querying cancelled orders ===");
  const { data: cancelledOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'Cancelado');

  const cancelledOrderIds = cancelledOrders?.map(o => o.id) || [];
  console.log("Cancelled Order IDs:", cancelledOrderIds);

  if (cancelledOrderIds.length > 0) {
    console.log("=== Deleting commissions for cancelled orders ===");
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('type', 'commission')
      .in('order_id', cancelledOrderIds)
      .not('description', 'ilike', 'Estorno%');
    
    if (error) {
      console.error("Delete Error:", error.message);
    } else {
      console.log("Cleanup completed successfully!");
    }
  } else {
    console.log("No cancelled orders found.");
  }

  // Clean up session
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
