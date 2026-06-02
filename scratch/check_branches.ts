import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: branches, error } = await supabase.from('branches').select('*');
  if (error) {
    console.error('Error fetching branches:', error);
  } else {
    console.log('Branches:', branches);
  }
}

check();
