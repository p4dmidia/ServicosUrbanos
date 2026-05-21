import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Fetching Profiles ---');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by, status')
    .limit(50);
    
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log(`Found ${profiles?.length || 0} profiles.`);
    console.log(profiles);
  }
}

run().catch(console.error);
