import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.error('Error fetching transactions:', error);
  } else if (data && data.length > 0) {
    console.log('Last 10 transactions:', data);
  } else {
    console.log('No transactions found');
  }
}

check();
