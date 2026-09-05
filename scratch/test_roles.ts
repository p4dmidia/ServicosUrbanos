import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const { data: sic, error: sicErr } = await supabase.from('profiles').select('id, email, role, status').eq('email', 'xipsdapraia23@gmail.com');
  console.log('Sic profile:', sic, sicErr);

  const { data: allRoles } = await supabase.from('profiles').select('role').limit(50);
  const uniqueRoles = [...new Set(allRoles?.map(r => r.role))];
  console.log('Unique roles in DB:', uniqueRoles);

  const { data: mmnConfig } = await supabase.from('mmn_config').select('*');
  console.log('mmnConfig current:', mmnConfig);

  const { data: mmnLevels } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('mmnLevels current:', mmnLevels);
}

test().catch(console.error);
