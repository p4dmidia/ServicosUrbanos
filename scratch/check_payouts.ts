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

  console.log("=== Payouts ===");
  const { data: payouts, error: pErr } = await supabase.from('affiliate_payouts').select('*');
  console.log("Total payouts:", payouts?.length, pErr || "");
  console.log(JSON.stringify(payouts, null, 2));

  console.log("=== Withdrawals ===");
  const { data: withdrawals, error: wErr } = await supabase.from('transactions').select('*').eq('type', 'withdrawal');
  console.log("Total withdrawals:", withdrawals?.length, wErr || "");
  console.log(JSON.stringify(withdrawals, null, 2));

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
