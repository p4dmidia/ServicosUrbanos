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
  console.log("Fetching whatsapp_config...");
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .single();
    
  if (error) {
    console.error("Error config:", error.message);
  } else {
    console.log("whatsapp_config contents:", JSON.stringify(data, null, 2));
  }
}

run().catch(console.error);
