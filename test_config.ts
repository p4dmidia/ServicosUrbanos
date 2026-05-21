import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Checking MMN Config and Levels ---');
  
  // 1. Fetch mmn_config
  const { data: config, error: configError } = await supabase
    .from('mmn_config')
    .select('*');
    
  if (configError) {
    console.error('Error fetching mmn_config:', configError.message);
  } else {
    console.log('mmn_config rows:', config);
  }

  // 2. Fetch mmn_levels
  const { data: levels, error: levelsError } = await supabase
    .from('mmn_levels')
    .select('*')
    .order('level', { ascending: true });
    
  if (levelsError) {
    console.error('Error fetching mmn_levels:', levelsError.message);
  } else {
    console.log('mmn_levels rows:', levels);
  }
}

run().catch(console.error);
