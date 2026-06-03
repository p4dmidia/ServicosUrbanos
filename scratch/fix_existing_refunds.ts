import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  console.log('--- Correcting Existing Refund Transactions ---');

  // Fix Order 1095 (no wallet withdrawal, should delete Estorno)
  console.log('Fixing Order 1095...');
  const { error: err1095 } = await supabase
    .from('transactions')
    .delete()
    .eq('order_id', '1095')
    .eq('type', 'commission')
    .ilike('description', 'Estorno%');
  if (err1095) console.error('Error fixing 1095:', err1095.message);
  else console.log('Successfully deleted Estorno for Order 1095 (no wallet used).');

  // Fix Order 1097 (wallet used: 10, update Estorno to 10)
  console.log('Fixing Order 1097...');
  const { error: err1097 } = await supabase
    .from('transactions')
    .update({ amount: 10 })
    .eq('order_id', '1097')
    .eq('type', 'commission')
    .ilike('description', 'Estorno%');
  if (err1097) console.error('Error fixing 1097:', err1097.message);
  else console.log('Successfully updated Estorno for Order 1097 to R$ 10.00.');

  // Fix Order 1100 (wallet used: 30, update Estorno to 30)
  console.log('Fixing Order 1100...');
  const { error: err1100 } = await supabase
    .from('transactions')
    .update({ amount: 30 })
    .eq('order_id', '1100')
    .eq('type', 'commission')
    .ilike('description', 'Estorno%');
  if (err1100) console.error('Error fixing 1100:', err1100.message);
  else console.log('Successfully updated Estorno for Order 1100 to R$ 30.00.');

  // Fix Order 1101 (wallet used: 30, update Estorno to 30)
  console.log('Fixing Order 1101...');
  const { error: err1101 } = await supabase
    .from('transactions')
    .update({ amount: 30 })
    .eq('order_id', '1101')
    .eq('type', 'commission')
    .ilike('description', 'Estorno%');
  if (err1101) console.error('Error fixing 1101:', err1101.message);
  else console.log('Successfully updated Estorno for Order 1101 to R$ 30.00.');

  // clean up
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
  console.log('Done!');
}

run().catch(console.error);
