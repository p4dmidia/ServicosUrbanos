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
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admins:', error.message);
    return;
  }

  console.log('Admins in DB:', JSON.stringify(admins, null, 2));
}

run().catch(console.error);
