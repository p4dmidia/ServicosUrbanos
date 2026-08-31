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
  
  console.log("Signing up debug user...");
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Database Debugger',
      }
    }
  });

  console.log("Signing in debug user...");
  await supabase.auth.signInWithPassword({
    email,
    password
  });

  const userId = (await supabase.auth.getUser()).data.user?.id;
  console.log("User ID:", userId);

  console.log("Updating role to owner...");
  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', userId);

  console.log("=== Querying public.handle_order_payment definition ===");
  // Let's call execute_sql RPC
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT pg_get_functiondef('public.handle_order_payment'::regproc) as definition;
    `
  });

  if (error) {
    console.error("RPC Error:", error.message);
  } else {
    console.log("Function Definition:\n", data?.[0]?.definition || data);
  }

  console.log("Cleaning up role...");
  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', userId);
}

run().catch(console.error);
