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

  console.log("=== calculating commission total ===");
  const now = new Date("2026-06-02T10:13:21-03:00"); // current local time from metadata
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  console.log("firstDayCurrentMonth:", firstDayCurrentMonth.toISOString());

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'commission')
    .gte('created_at', firstDayCurrentMonth.toISOString());

  if (txError) {
    console.error(txError);
  } else {
    console.log("Commissions count (June):", txs.length);
    let total = 0;
    for (const t of txs) {
      console.log(`ID: ${t.id} | Desc: ${t.description} | Amt: ${t.amount} | Created: ${t.created_at}`);
      total += Number(t.amount);
    }
    console.log("SUM OF MMN CASHBACKS (June):", total);
  }

  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
