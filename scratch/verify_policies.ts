import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Verifying Configuration Tables RLS Access ---');
  
  // 1. Check marketplace_config
  console.log('\nChecking marketplace_config...');
  const { data: marketData, error: marketError } = await supabase
    .from('marketplace_config')
    .select('*');

  if (marketError) {
    console.error('❌ Failed to fetch marketplace_config:', marketError.message);
  } else {
    console.log('✅ Successfully fetched marketplace_config:', marketData);
  }

  // 2. Check finance_config
  console.log('\nChecking finance_config...');
  const { data: finData, error: finError } = await supabase
    .from('finance_config')
    .select('*');

  if (finError) {
    console.error('❌ Failed to fetch finance_config:', finError.message);
  } else {
    console.log('✅ Successfully fetched finance_config:', finData);
  }
}

run().catch(console.error);
