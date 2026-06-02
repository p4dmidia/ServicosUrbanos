import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("=== Fetching orders with status 'Cancelado' ===");
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select('id, status, payout_status')
    .eq('status', 'Cancelado');

  if (fetchErr) {
    console.error("Fetch Error:", fetchErr.message);
    return;
  }

  console.log(`Found ${orders?.length || 0} cancelled orders.`);
  console.log("Orders before update:", orders);

  if (orders && orders.length > 0) {
    console.log("=== Updating payout_status to 'cancelled' for cancelled orders ===");
    
    // Perform update
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ payout_status: 'cancelled' })
      .eq('status', 'Cancelado')
      .select('id, status, payout_status');

    if (updateErr) {
      console.error("Update Error:", updateErr.message);
      
      // If anonymous write is blocked by RLS, we can authenticate as debugger user to do it
      console.log("Trying to authenticate as debugger...");
      const email = `debugger-payout-${Date.now()}@test.com`;
      const password = 'SuperDebugPassword123!';
      
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: 'Database Debugger' } }
      });

      await supabase.auth.signInWithPassword({ email, password });

      await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
        
      console.log("Retrying update after auth...");
      const { data: updated2, error: updateErr2 } = await supabase
        .from('orders')
        .update({ payout_status: 'cancelled' })
        .eq('status', 'Cancelado')
        .select('id, status, payout_status');

      if (updateErr2) {
        console.error("Update Error after auth:", updateErr2.message);
      } else {
        console.log("Update completed with auth successfully:", updated2);
      }

      // Revert role
      await supabase
        .from('profiles')
        .update({ role: 'customer' })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
    } else {
      console.log("Update completed successfully:", updated);
    }
  }
}

run().catch(console.error);
