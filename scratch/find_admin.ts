import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const { data: admins } = await supabase.from('profiles').select('id, email, role, status').in('role', ['admin', 'owner']);
  console.log('Admins/Owners found:', admins);
}

test().catch(console.error);
