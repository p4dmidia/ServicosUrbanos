import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const { data } = await supabase.from('profiles').select('id, email, role').eq('id', '3d11cfe4-7e11-4fc2-a01c-87dbe84cfe0b').single();
  console.log('Role is:', data);
}

test().catch(console.error);
