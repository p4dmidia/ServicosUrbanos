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
  const email = `debugger-cleanup-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log("=== Finding G2 commission transactions ===");
  const { data: g2Txs, error: fetchError } = await supabase
    .from('transactions')
    .select('id, profile_id, description, amount, profiles(full_name)')
    .like('description', '%G2%');

  if (fetchError) {
    console.error("Error fetching transactions:", fetchError.message);
  } else {
    console.log(`Found ${g2Txs?.length || 0} G2 transactions:`, JSON.stringify(g2Txs, null, 2));
    
    if (g2Txs && g2Txs.length > 0) {
      console.log("Deleting G2 transactions...");
      const ids = g2Txs.map(t => t.id);
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.error("Error deleting transactions:", deleteError.message);
      } else {
        console.log("Deleted G2 transactions successfully!");
      }
    }
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
