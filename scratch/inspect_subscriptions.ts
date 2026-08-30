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
  console.log("Fetching all subscriptions...");
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      profile_id,
      plan_type,
      amount,
      status,
      start_date,
      end_date
    `);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${subs?.length} subscriptions:`);
  console.log(JSON.stringify(subs, null, 2));
}

run().catch(console.error);
