import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').in('role', ['manager', 'owner']);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles:', profiles.map(p => ({ id: p.id, full_name: p.full_name, role: p.role, commission_rate: p.commission_rate, branch_id: p.branch_id })));
  }

  const { data: team, error: teamError } = await supabase.from('profiles').select('*');
  console.log('All profiles count:', team?.length);
}

check();
