import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-weider-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data: prof } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, reseller_id, referred_by')
    .eq('id', 'e8ae8253-6bca-4e18-9576-eac9bbe5cef5')
    .single();

  console.log('Profile Weider:', prof);
}

run();
