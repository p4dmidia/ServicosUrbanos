import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching distinct roles in public.profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('role');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const roles = new Set(data.map(r => (r as any).role));
  console.log('Distinct roles in database:', Array.from(roles));
}

run().catch(console.error);
