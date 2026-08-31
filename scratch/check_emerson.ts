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

  console.log("=== Emerson Profiles ===");
  const { data: emersons } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%emerson%');
  console.log(JSON.stringify(emersons, null, 2));

  console.log("=== Silvana Profiles ===");
  const { data: silvanas } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%silvana%');
  console.log(JSON.stringify(silvanas, null, 2));

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
