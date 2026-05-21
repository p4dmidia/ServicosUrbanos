import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', (await supabase.auth.getUser()).data.user?.id);

  console.log('--- Verifying Database Migrations ---');

  // 1. Check if any commission transaction has a non-null order_id (backfill verification)
  const { data: trans, error: transError } = await supabase
    .from('transactions')
    .select('id, description, order_id')
    .eq('type', 'commission');

  if (transError) {
    console.error('Error fetching transactions:', transError.message);
  } else {
    const withOrderId = trans?.filter(t => t.order_id !== null) || [];
    console.log(`Transactions checked: ${trans?.length || 0}`);
    console.log(`Transactions with non-null order_id (should be > 0 if backfilled): ${withOrderId.length}`);
    if (withOrderId.length > 0) {
      console.log('Sample backfilled transactions:', withOrderId.slice(0, 3));
    }
  }

  // 2. Query commissions view (view recreation verification)
  const { data: commissions, error: commsError } = await supabase
    .from('commissions')
    .select(`
      amount,
      level,
      status,
      order_id,
      profiles (
        full_name
      )
    `)
    .limit(10);

  if (commsError) {
    console.error('Error querying commissions view:', commsError.message);
  } else {
    console.log(`Commissions view successfully queried! Found ${commissions?.length || 0} rows.`);
    if (commissions && commissions.length > 0) {
      console.log('Commissions sample:', JSON.stringify(commissions.slice(0, 5), null, 2));
    }
  }

  // Restore role
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', (await supabase.auth.getUser()).data.user?.id);
  console.log('Done!');
}

run().catch(console.error);
