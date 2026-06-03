import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${profiles.length} profiles:`);
  profiles.forEach(p => {
    console.log(`ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, StoreName: ${p.store_name}, BranchId: ${p.branch_id}`);
  });
}

check();
