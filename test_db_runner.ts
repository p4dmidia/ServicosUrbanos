import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Checking Transactions Row Count ---');
  
  // Count transactions
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error counting transactions:', error.message);
  } else {
    console.log('Transactions total count:', count);
  }
}

run().catch(console.error);
