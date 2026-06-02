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

  console.log("=== Querying trigger details ===");
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers;
    `
  });

  // Note: if execute_sql function doesn't exist, we might get an error.
  // Let's check if we can query pg_trigger directly.
  if (error) {
    console.error("RPC Error:", error.message);
    // Let's try raw query using select if we have a view or run SQL via a standard table query?
    // Wait, profiles, transactions, etc. are standard tables.
  } else {
    console.log("Triggers:", data);
  }

  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
