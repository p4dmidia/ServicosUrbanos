import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function findSicComercio() {
  const email = `debugger-sic-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, referral_code, cpf, cnpj, store_name')
    .or('full_name.ilike.%sic%,store_name.ilike.%sic%,email.ilike.%sic%,role.eq.owner,role.eq.admin');

  console.log('Search for sic/owner/admin profiles:', profiles);
}

findSicComercio();
