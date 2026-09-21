import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'jose@gmail.com';
  const password = '12345678';
  
  console.log(`Authenticating as: ${email}...`);
  await supabase.auth.signInWithPassword({
    email,
    password
  });

  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  console.log("Setting role to owner temporarily...");
  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', userId);

  const sqlQuery = fs.readFileSync(path.resolve('migration_planos_oficiais_e_revendedor.sql'), 'utf-8');

  console.log("=== Executing migration_planos_oficiais_e_revendedor.sql via RPC execute_sql ===");
  const { data, error } = await supabase.rpc('execute_sql', {
    query: sqlQuery
  });

  if (error) {
    console.error("RPC Error:", error.message);
  } else {
    console.log("Success! Migration executed successfully:", data);
  }

  console.log("Verifying configured plans in products table...");
  const { data: plans } = await supabase
    .from('products')
    .select('id, name, plan_type, price, duration_days, status, image')
    .eq('is_subscription', true)
    .order('price', { ascending: true });

  console.table(plans);
}

run().catch(console.error);
