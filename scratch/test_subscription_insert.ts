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
  console.log("Testing insert with plan_type = mensal...");
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      profile_id: 'd9e03ad9-2be8-4228-a400-349f2b8a7c2b', // dummy uuid format
      plan_type: 'mensal',
      amount: 20,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString()
    }]);

  if (error) {
    console.log("Insert result (error):", error.message);
  } else {
    console.log("Insert succeeded!", data);
    // Cleanup if succeeded
    await supabase.from('subscriptions').delete().eq('plan_type', 'mensal');
  }
}

run().catch(console.error);
