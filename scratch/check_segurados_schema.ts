import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `diag-seg-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  // Check columns by querying segurados
  const { data: segData, error: segError } = await supabase.from('segurados').select('*').limit(5);
  console.log('segurados rows:', segData, 'error:', segError);

  const { data: apoliceData, error: apoliceError } = await supabase.from('apolices').select('*').limit(5);
  console.log('apolices rows:', apoliceData, 'error:', apoliceError);

  const { data: numsData, error: numsError } = await supabase.from('numeros_da_sorte').select('*').limit(5);
  console.log('numeros_da_sorte rows:', numsData, 'error:', numsError);

  const { data: teleData, error: teleError } = await supabase.from('telemedicina_acesso').select('*').limit(5);
  console.log('telemedicina_acesso rows:', teleData, 'error:', teleError);

  await supabase.from('profiles').delete().eq('id', uid);
}

run().catch(console.error);
