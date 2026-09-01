import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testProfiles() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, referred_by, reseller_id').limit(5);
  if (error) {
    console.log('Error querying reseller_id:', error.message);
  } else {
    console.log('Success querying profiles with reseller_id:', data);
  }
}

testProfiles();
