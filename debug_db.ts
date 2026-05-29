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

  // Sign in to establish session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }

  // Elevate role to owner
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to elevate role:', updateError.message);
    return;
  }

  console.log('Role elevated to owner! Calculating balances...');

  // 1. Fetch profiles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email');
  
  if (pError) {
    console.error("Profiles fetch error:", pError.message);
    return;
  }

  // 2. Fetch transactions
  const { data: transactions, error: tError } = await supabase
    .from('transactions')
    .select('*');

  if (tError) {
    console.error("Transactions fetch error:", tError.message);
    return;
  }

  console.log(`\nTotal profiles: ${profiles.length}`);
  console.log(`Total transactions: ${transactions.length}`);

  // Calculate balances per profile
  console.log("\n--- Balances Per Profile ---");
  let totalM = 0;
  let totalA = 0;
  let totalD = 0;

  for (const p of profiles) {
    const userTx = transactions.filter(t => t.profile_id === p.id);
    if (userTx.length === 0) continue;

    const monthlyBonus = userTx
      .filter(t => t.type === 'commission' && t.description?.includes('Mensal') && (t.status === 'completed' || t.status === 'pago'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const annualBonus = userTx
      .filter(t => t.type === 'commission' && t.description?.includes('Anual') && (t.status === 'completed' || t.status === 'pago'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const walletBonus = userTx
      .filter(t => (t.description?.includes('Digital') || t.description?.includes('(CD)')) && (t.status === 'completed' || t.status === 'pago'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const monthlyPaid = userTx
      .filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Mensal') && (t.status === 'completed' || t.status === 'pago'))
      .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

    const annualPaid = userTx
      .filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Anual') && (t.status === 'completed' || t.status === 'pago'))
      .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

    const totalWithdrawn = userTx
      .filter(t => t.type === 'withdrawal' && !t.description?.includes('Mensal') && !t.description?.includes('Anual'))
      .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

    const monthlyPending = Math.max(0, monthlyBonus - monthlyPaid);
    const annualPending = Math.max(0, annualBonus - annualPaid);
    const digitalPending = Math.max(0, walletBonus - totalWithdrawn);

    totalM += monthlyPending;
    totalA += annualPending;
    totalD += digitalPending;

    if (monthlyPending > 0 || annualPending > 0 || digitalPending > 0) {
      console.log(`\nUser: ${p.full_name} (${p.email})`);
      console.log(`  Monthly: Earned R$ ${monthlyBonus} - Paid R$ ${monthlyPaid} = Pending R$ ${monthlyPending}`);
      console.log(`  Annual:  Earned R$ ${annualBonus} - Paid R$ ${annualPaid} = Pending R$ ${annualPending}`);
      console.log(`  Digital: Earned R$ ${walletBonus} - Withdrawn/Paid R$ ${totalWithdrawn} = Pending R$ ${digitalPending}`);
      
      console.log("  Digital detail transactions:");
      userTx.filter(t => t.description?.includes('Digital') || t.description?.includes('(CD)') || (t.type === 'withdrawal' && !t.description?.includes('Mensal') && !t.description?.includes('Anual'))).forEach(t => {
        console.log(`    - [${t.type}] [${t.status}] ${t.description}: R$ ${t.amount}`);
      });
    }
  }

  console.log("\n--- GRAND TOTALS ---");
  console.log(`Monthly Total Pending: R$ ${totalM}`);
  console.log(`Annual Total Pending:  R$ ${totalA}`);
  console.log(`Digital Total Pending: R$ ${totalD}`);

  // Clean up: delete/reset profile or just leave it
  console.log('Cleaning up: restoring role to customer...');
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', user.id);
    
  console.log('Done!');
}

run().catch(console.error);
