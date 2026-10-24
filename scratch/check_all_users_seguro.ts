import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

import { businessRules } from '../src/lib/businessRules';

async function run() {
  const email = `diag-all-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  // Get all subscriptions
  const { data: subs } = await supabase.from('subscriptions').select('profile_id, plan_type, status, end_date');
  console.log(`Total de subscriptions no banco: ${subs?.length}`);

  // Get all segurados
  const { data: segs } = await supabase.from('segurados').select('profile_id, nome_completo, status');
  console.log(`Total de segurados no banco: ${segs?.length}`);

  // Test getSeguradoData for each subscription profile
  for (const sub of (subs || [])) {
    const res = await businessRules.getSeguradoData(sub.profile_id);
    console.log(`User ${sub.profile_id} (sub: ${sub.plan_type}, status: ${sub.status}) -> isPolicyActive: ${res?.isPolicyActive}, isSegurado: ${res?.isSegurado}`);
  }

  await supabase.from('profiles').delete().eq('id', uid);
}

run().catch(console.error);
