import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: extras, error } = await supabase.from('order_extras').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${extras.length} order extras:`);
  extras.forEach(e => {
    console.log(`ID: ${e.id}, Status: ${e.status}, UpdatedAt: ${e.updated_at}`);
  });
}

check();
