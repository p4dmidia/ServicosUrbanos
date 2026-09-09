import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve('.env') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data } = await supabase.from('transactions').select('*').limit(1);
  if (data && data[0]) {
    console.log('Transaction columns:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  }

  if (uid) await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
