import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const email = `test-merchant-${Date.now()}@example.com`;
  const password = 'MerchantPassword123!';

  console.log(`1. Signing up user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Merchant Owner',
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    console.error('No user returned');
    return;
  }

  console.log('2. Signing in...');
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError);
    return;
  }

  console.log('3. Elevating role to admin...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to elevate role:', updateError);
    return;
  }

  console.log('4. Trying to upsert as admin...');
  const { data: upsertData, error: upsertError } = await supabase
    .from('marketplace_config')
    .upsert({ id: 1, commission_rate: 18 })
    .select();

  if (upsertError) {
    console.error('Upsert as admin error:', upsertError);
  } else {
    console.log('Upsert as admin success:', upsertData);
  }

  console.log('5. Querying marketplace_config as admin...');
  const { data, error } = await supabase
    .from('marketplace_config')
    .select('*');

  if (error) {
    console.error('Query error:', error);
  } else {
    console.log('Query result as owner:', data);
  }

  console.log('5. Querying mmn_config as owner...');
  const { data: mmnData, error: mmnError } = await supabase
    .from('mmn_config')
    .select('*');
  console.log('MMN config result as owner:', mmnError || mmnData);

  console.log('6. Querying finance_config as owner...');
  const { data: finData, error: finError } = await supabase
    .from('finance_config')
    .select('*');
  console.log('Finance config result as owner:', finError || finData);

  // Clean up
  console.log('Cleaning up: restoring role...');
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', user.id);
  console.log('Done!');
}

run().catch(console.error);
