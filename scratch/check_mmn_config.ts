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
  
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Database Debugger',
      }
    }
  });

  await supabase.auth.signInWithPassword({
    email,
    password
  });

  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);

  console.log("=== mmn_config ===");
  const { data: config, error: cError } = await supabase.from('mmn_config').select('*').single();
  if (cError) console.error(cError);
  else console.log(config);

  console.log("=== mmn_levels ===");
  const { data: levels, error: lError } = await supabase.from('mmn_levels').select('*').order('level');
  if (lError) console.error(lError);
  else console.log(levels);

  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
