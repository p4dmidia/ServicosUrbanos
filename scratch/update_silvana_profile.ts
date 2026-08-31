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

  console.log("=== Updating Silvana profile ===");
  const { data, error } = await supabase
    .from('profiles')
    .update({ birth_date: '1973-06-16', gender: 'F' })
    .eq('id', 'b3628b24-1b89-41fd-bc4d-f787cdaf327a')
    .select();

  console.log("Updated Silvana:", data, error || "");

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
