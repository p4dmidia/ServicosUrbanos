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
  const email = `debugger-txs-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log("=== Fetching all commission transactions ===");
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, description, profile_id, order_id, profiles(full_name)')
    .eq('type', 'commission');

  if (error) {
    console.error("Error fetching transactions:", error);
    return;
  }

  console.log(`Found ${txs?.length || 0} commission transactions:`);
  console.log(JSON.stringify(txs, null, 2));

  // First, convert any G1 to G2 for 2nd level uplines (e.g. Julia Ribeiro)
  // And convert G0 to G1 for 1st level uplines (e.g. Anselmo Ribeiro)
  for (const t of txs || []) {
    let newDesc = t.description;
    if (t.description?.includes('G1')) {
      newDesc = t.description.replace('G1', 'G2');
    } else if (t.description?.includes('G0')) {
      newDesc = t.description.replace('G0', 'G1');
    }

    if (newDesc !== t.description) {
      console.log(`Updating #${t.id}: "${t.description}" -> "${newDesc}"`);
      await supabase
        .from('transactions')
        .update({ description: newDesc })
        .eq('id', t.id);
    }
  }

  console.log("Finished updating transaction descriptions.");

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
