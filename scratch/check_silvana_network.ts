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

  console.log("=== Silvana's Profile ===");
  const { data: silvana } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Silvana%')
    .single();

  console.log(JSON.stringify(silvana, null, 2));

  if (silvana) {
    console.log("=== Silvana's direct referrals (g1) ===");
    const { data: g1 } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('referred_by', silvana.id);
    console.log(JSON.stringify(g1, null, 2));

    const g1Ids = g1?.map(x => x.id) || [];
    if (g1Ids.length > 0) {
      console.log("=== Silvana's indirect referrals (g2) ===");
      const { data: g2 } = await supabase
        .from('profiles')
        .select('id, full_name, role, referred_by')
        .in('referred_by', g1Ids);
      console.log(JSON.stringify(g2, null, 2));
    }
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
