import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Inspecting orders table ---');
  
  // To get orders, we might need to authenticate as owner
  // Let's create a temp user or query directly if public read is allowed, 
  // or authenticate as owner using a sign-up and elevation pattern like debug_db.ts
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    // Elevate role to owner
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: transactions, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .ilike('description', '%Estorno%');

  if (txErr) {
    console.error('Failed to fetch transactions:', txErr.message);
  } else {
    console.log('Transactions containing Estorno:', JSON.stringify(transactions, null, 2));
  }

  // Clean up
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
