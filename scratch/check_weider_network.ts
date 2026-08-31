import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log("=== Weider's Profile ===");
  const { data: weider } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Weider%')
    .single();

  console.log(JSON.stringify(weider, null, 2));

  if (weider) {
    console.log("=== Weider's direct referrals (g1) ===");
    const { data: g1 } = await supabase
      .from('profiles')
      .select('*')
      .eq('referred_by', weider.id);
    console.log(JSON.stringify(g1, null, 2));
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
