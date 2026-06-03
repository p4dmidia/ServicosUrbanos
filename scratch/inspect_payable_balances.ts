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

  // 1. Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name');

  // 2. Fetch all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*');

  // 3. Fetch all orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status');

  const ordersMap = new Map(orders?.map(o => [o.id, o.status]) || []);

  console.log('\n--- Profiles and their transactions ---');
  profiles?.forEach(profile => {
    const userTransactions = transactions?.filter(t => t.profile_id === profile.id) || [];
    if (userTransactions.length === 0) return;

    console.log(`\nUser: ${profile.full_name} (${profile.id})`);
    
    // Separate category elements
    const monthlyBonusTxs = userTransactions.filter(t => t.type === 'commission' && t.description?.includes('Mensal') && (t.status === 'completed' || t.status === 'pago'));
    const annualBonusTxs = userTransactions.filter(t => t.type === 'commission' && t.description?.includes('Anual') && (t.status === 'completed' || t.status === 'pago'));
    const walletBonusTxs = userTransactions.filter(t => (t.description?.includes('Digital') || t.description?.includes('(CD)')) && (t.status === 'completed' || t.status === 'pago'));
    
    const monthlyPaidTxs = userTransactions.filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Mensal') && (t.status === 'completed' || t.status === 'pago'));
    const annualPaidTxs = userTransactions.filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Anual') && (t.status === 'completed' || t.status === 'pago'));
    const totalWithdrawnTxs = userTransactions.filter(t => t.type === 'withdrawal' && !t.description?.includes('Mensal') && !t.description?.includes('Anual'));

    const monthlyBonus = monthlyBonusTxs.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const annualBonus = annualBonusTxs.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const walletBonus = walletBonusTxs.reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const monthlyPaid = monthlyPaidTxs.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
    const annualPaid = annualPaidTxs.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
    const totalWithdrawn = totalWithdrawnTxs.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

    const monthlyPending = Math.max(0, monthlyBonus - monthlyPaid);
    const annualPending = Math.max(0, annualBonus - annualPaid);
    const digitalPending = Math.max(0, walletBonus - totalWithdrawn);

    if (monthlyPending > 0 || annualPending > 0 || digitalPending > 0) {
      console.log(`  Saldos: Mensal: ${monthlyPending}, Anual: ${annualPending}, Digital: ${digitalPending}`);
      
      console.log('  Transactions detail:');
      userTransactions.forEach(t => {
        const orderStatus = t.order_id ? ordersMap.get(t.order_id) : 'N/A';
        console.log(`    - ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount}, Status: ${t.status}, Description: "${t.description}", OrderID: ${t.order_id}, OrderStatus: ${orderStatus}`);
      });
    }
  });

  // clean up
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
