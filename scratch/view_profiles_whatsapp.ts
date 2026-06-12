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
  console.log("Fetching profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, whatsapp');
    
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Profiles in DB:", JSON.stringify(data, null, 2));
  }
}

run().catch(console.error);
