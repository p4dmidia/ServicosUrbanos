import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: orders, error: oErr } = await supabase.from('orders').select('id, amount, status, branch_id');
  console.log('Orders:', orders);

  const { data: branches, error: bErr } = await supabase.from('branches').select('id, name, merchant_id');
  console.log('Branches:', branches);

  const { data: managers, error: mErr } = await supabase.from('profiles').select('id, full_name, role, branch_id, commission_rate');
  console.log('Managers/Profiles:', managers?.filter(p => p.role === 'manager' || p.role === 'owner'));
}

check();
