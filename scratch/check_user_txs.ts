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

  const targetUser = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  console.log(`=== Transactions for ${targetUser} ===`);
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', targetUser);

  if (error) console.error(error);
  else {
    for (const t of txs) {
      console.log(`Type: ${t.type} | Desc: ${t.description} | Status: ${t.status} | Amount: ${t.amount}`);
    }
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
