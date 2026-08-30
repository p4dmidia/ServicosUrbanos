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
  console.log("Checking if profile Anselmo Ribeiro exists in the database...");
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', '33b4bdfe-e9b0-4c9a-af7f-a0b2fd044196')
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Profile result:", profile);
}

run().catch(console.error);
