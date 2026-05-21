import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  console.log(`1. Signing up user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Database Debugger',
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    console.error('No user returned from signup');
    return;
  }

  console.log(`Sign up successful. User ID: ${user.id}`);

  // Sign in to establish session
  console.log('2. Signing in...');
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }

  console.log('Sign in successful. Elevating role to owner...');
  
  // Elevate role to owner
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to elevate role:', updateError.message);
    return;
  }

  console.log('Role elevated to owner! Querying transactions and commissions...');

  // 3. Query transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('*')
    .limit(20);

  if (transError) {
    console.error('Error fetching transactions:', transError.message);
  } else {
    console.log(`Found ${transactions?.length || 0} transactions.`);
    console.log('Transactions sample:', transactions);
  }

  // 4. Query commissions
  const { data: commissions, error: commsError } = await supabase
    .from('commissions')
    .select('*')
    .limit(20);

  if (commsError) {
    console.error('Error fetching commissions:', commsError.message);
  } else {
    console.log(`Found ${commissions?.length || 0} commissions.`);
    console.log('Commissions sample:', commissions);
  }

  // Clean up: delete/reset profile or just leave it
  console.log('Cleaning up: restoring role to customer...');
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', user.id);
    
  console.log('Done!');
}

run().catch(console.error);
