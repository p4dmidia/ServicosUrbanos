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
  const email = `debugger-status-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log("=== Inspecting distinct profile status values ===");
  const { data: profiles } = await supabase
    .from('profiles')
    .select('status');

  const uniqueStatuses = Array.from(new Set(profiles?.map(p => p.status)));
  console.log("Existing distinct status values in profiles:", uniqueStatuses);

  // Test updating status to 'pending'
  const { error: testPending } = await supabase
    .from('profiles')
    .update({ status: 'pending' })
    .eq('id', userId);
  console.log("Update to 'pending' result:", testPending ? testPending.message : "SUCCESS");

  // Test updating status to 'blocked'
  const { error: testBlocked } = await supabase
    .from('profiles')
    .update({ status: 'blocked' })
    .eq('id', userId);
  console.log("Update to 'blocked' result:", testBlocked ? testBlocked.message : "SUCCESS");

  // Test updating status to 'Inativo'
  const { error: testInativo } = await supabase
    .from('profiles')
    .update({ status: 'Inativo' })
    .eq('id', userId);
  console.log("Update to 'Inativo' result:", testInativo ? testInativo.message : "SUCCESS");

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
