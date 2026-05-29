import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching profiles and transactions...");
  
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email');
  
  if (pError) {
    console.error("Profiles fetch error:", pError.message);
    return;
  }

  const { data: transactions, error: tError } = await supabase
    .from('transactions')
    .select('*');

  if (tError) {
    console.error("Transactions fetch error:", tError.message);
    return;
  }

  console.log(`\nTotal profiles: ${profiles.length}`);
  console.log(`Total transactions: ${transactions.length}`);

  // Print all transaction types & status frequencies
  const typeFreq: Record<string, number> = {};
  const statusFreq: Record<string, number> = {};
  const descriptionSamples: string[] = [];

  for (const t of transactions) {
    typeFreq[t.type] = (typeFreq[t.type] || 0) + 1;
    statusFreq[t.status] = (statusFreq[t.status] || 0) + 1;
    if (descriptionSamples.length < 50 && t.description && !descriptionSamples.includes(t.description)) {
      descriptionSamples.push(`${t.type} | ${t.status} | ${t.description} | R$ ${t.amount}`);
    }
  }

  console.log("\nTransaction Types Frequency:", typeFreq);
  console.log("Transaction Status Frequency:", statusFreq);
  console.log("\nTransaction Description Samples:");
  descriptionSamples.forEach(s => console.log(`  - ${s}`));

  // Calculate balances per profile
  console.log("\n--- Balances Per Profile ---");
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

    const monthlyPending = monthlyBonus - monthlyPaid;
    const annualPending = annualBonus - annualPaid;
    const digitalPending = walletBonus - totalWithdrawn;

    console.log(`\nUser: ${p.full_name} (${p.email})`);
    console.log(`  Monthly: Earned R$ ${monthlyBonus} - Paid R$ ${monthlyPaid} = Pending R$ ${monthlyPending}`);
    console.log(`  Annual:  Earned R$ ${annualBonus} - Paid R$ ${annualPaid} = Pending R$ ${annualPending}`);
    console.log(`  Digital: Earned R$ ${walletBonus} - Withdrawn/Paid R$ ${totalWithdrawn} = Pending R$ ${digitalPending}`);
    
    console.log("  Transactions list:");
    userTx.forEach(t => {
      console.log(`    - [${t.type}] [${t.status}] ${t.description}: R$ ${t.amount}`);
    });
  }
}

run().catch(console.error);
