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
  console.log("Updating WhatsApp numbers to '71992102042' for all profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .update({ whatsapp: '71992102042' })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Matches all valid profile ids
    
  if (error) {
    console.error("Error updating:", error.message);
  } else {
    console.log("Successfully updated profiles. Fetching updated list...");
    const { data: updated, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, whatsapp');
      
    if (fetchError) {
      console.error("Error fetching updated:", fetchError.message);
    } else {
      console.log("Updated profiles:", JSON.stringify(updated, null, 2));
    }
  }
}

run().catch(console.error);
