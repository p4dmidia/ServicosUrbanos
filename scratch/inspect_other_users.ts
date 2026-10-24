import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const email = `diag-inspect-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const u1 = 'e7ea0ff7-454e-4e68-942c-71c4ec6ce4aa';
  const u2 = '863bb224-a6be-41c9-931a-aaf53f5e3114';

  const { data: s1 } = await supabase.from('subscriptions').select('*').in('profile_id', [u1, u2]);
  console.log('Subscriptions:', s1);

  const { data: p } = await supabase.from('profiles').select('id, full_name, email, role, description').in('id', [u1, u2]);
  console.log('Profiles:', p);

  const { data: seg } = await supabase.from('segurados').select('*, apolices(*)').in('profile_id', [u1, u2]);
  console.log('Segurados:', JSON.stringify(seg, null, 2));

  await supabase.from('profiles').delete().eq('id', uid);
}
test().catch(console.error);
