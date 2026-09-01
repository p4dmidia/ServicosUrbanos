import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkProfilesColumns() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profile columns:', data ? Object.keys(data[0] || {}) : error);
}

checkProfilesColumns();
