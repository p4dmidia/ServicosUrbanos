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

  console.log("\n=== querying all transactions ===");
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (txError) {
    console.error("Transactions error:", txError);
  } else {
    console.log("Total transactions:", txs.length);
    for (const t of txs) {
      console.log(`ID: ${t.id} | Profile ID: ${t.profile_id} | Type: ${t.type} | Status: ${t.status} | Description: ${t.description} | Amount: ${t.amount} | Order ID: ${t.order_id} | Created: ${t.created_at}`);
    }
  }

  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
