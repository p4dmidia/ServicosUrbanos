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

  console.log("=== Order 1217 ===");
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1217')
    .single();
  console.log(JSON.stringify(order, null, 2));

  console.log("=== Buyer profile for order 1217 ===");
  if (order) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.customer_id)
      .single();
    console.log(JSON.stringify(profile, null, 2));

    if (profile && profile.referred_by) {
      console.log("=== Referrer (Silvana?) ===");
      const { data: referrer } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.referred_by)
        .single();
      console.log(JSON.stringify(referrer, null, 2));
    }
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
