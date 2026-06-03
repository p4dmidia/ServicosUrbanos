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
  console.log('\n======================================================');
  console.log('STARTING ORDER CANCELLATION FLOW VERIFICATION');
  console.log('======================================================');
  console.log('NOTE: Make sure you have executed migration_order_cancellation.sql');
  console.log('in your Supabase SQL Editor before running this script.');
  console.log('======================================================\n');

  // 1. Create a temp session with owner elevation (to bypass RLS for checking/cleanup)
  const email = `verifier-${Date.now()}@test.com`;
  const password = 'SuperVerifierPassword123!';
  
  console.log('1. Signing up verification user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Cancellation Verifier' } }
  });

  if (signUpError || !signUpData.user) {
    console.error('Sign up failed:', signUpError?.message);
    return;
  }

  const userId = signUpData.user.id;
  await supabase.auth.signInWithPassword({ email, password });
  
  // Elevate to owner
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);
  console.log(`User created and elevated to owner: ${userId}`);

  // 2. Fetch a product to use in the test order
  console.log('2. Fetching a product for testing...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (prodError || !products || products.length === 0) {
    console.error('No products found to run verification:', prodError?.message);
    return;
  }

  const product = products[0];
  const productId = product.id;
  const initialStock = product.stock || 0;
  const initialSales = product.sales || 0;
  console.log(`Product: "${product.name}"`);
  console.log(`Initial global stock: ${initialStock}, sales: ${initialSales}`);

  // Check branch stock if product is linked to a branch or has filial entries
  let branchId = product.branch_id;
  let initialBranchStock = 0;
  
  if (branchId) {
    const { data: stockData } = await supabase
      .from('product_stocks')
      .select('stock')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle();
    initialBranchStock = stockData?.stock || 0;
    console.log(`Initial branch stock (Branch ${branchId}): ${initialBranchStock}`);
  }

  // 3. Scenario A: Wallet Payment (should generate a wallet refund equal to the withdrawal amount)
  const testOrderIdWallet = `TEST-CANCEL-W-${Date.now().toString().substring(6)}`;
  console.log(`\n3. [Wallet Scenario] Creating test order: ${testOrderIdWallet}...`);
  
  const testItems = [
    {
      id: productId,
      name: product.name,
      price: 50.00,
      quantity: 2
    }
  ];

  const { data: orderWallet, error: orderWalletError } = await supabase
    .from('orders')
    .insert([{
      id: testOrderIdWallet,
      customer_id: userId,
      customer_name: 'Cancellation Verifier',
      customer_initial: 'C',
      amount: 100.00,
      status: 'Aguardando Pagamento',
      items: testItems,
      branch_id: branchId,
      cashback_amount: 5.00,
      payment_method: 'Carteira Digital'
    }])
    .select()
    .single();

  if (orderWalletError || !orderWallet) {
    console.error('Failed to create test order (Wallet Scenario):', orderWalletError?.message);
    return;
  }
  console.log('Test order created in state: "Aguardando Pagamento"');

  // 4. Simulate client-side stock decrement during checkout
  console.log('4. Simulating checkout stock decrement (2 units)...');
  await supabase.from('products').update({
    stock: Math.max(0, initialStock - 2),
    sales: initialSales + 2
  }).eq('id', productId);

  if (branchId) {
    await supabase.from('product_stocks').update({
      stock: Math.max(0, initialBranchStock - 2)
    }).eq('product_id', productId).eq('branch_id', branchId);
  }

  // 4.1 Insert the withdrawal transaction to simulate digital wallet usage
  console.log('4.1 Inserting withdrawal transaction of R$ 100.00 for the order...');
  const { error: txWithdrawError } = await supabase
    .from('transactions')
    .insert([{
      profile_id: userId,
      type: 'withdrawal',
      amount: -100.00,
      description: `Pagamento de Pedido #${testOrderIdWallet.substring(0, 8)}`,
      status: 'completed',
      order_id: testOrderIdWallet
    }]);

  if (txWithdrawError) {
    console.error('Failed to insert simulated withdrawal transaction:', txWithdrawError.message);
    return;
  }

  // 5. Update order to paid state to trigger commissions
  console.log('\n5. Updating order to "Pago, Aguardando Retirada"...');
  await supabase.from('orders').update({ status: 'Pago, Aguardando Retirada' }).eq('id', testOrderIdWallet);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 6. CANCEL the order!
  console.log('\n6. CANCELLING the order...');
  await supabase.from('orders').update({ status: 'Cancelado' }).eq('id', testOrderIdWallet);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 7. VERIFY WALLET SCENARIO RESULTS
  console.log('\n======================================================');
  console.log('VERIFYING TRIGGER SIDE EFFECTS FOR WALLET SCENARIO');
  console.log('======================================================');

  // Check Product Stock Restoration
  const { data: prodFinal } = await supabase.from('products').select('stock, sales').eq('id', productId).single();
  const expectedRestoredStock = Math.max(0, initialStock - 2) + 2;
  const stockRestored = prodFinal?.stock === expectedRestoredStock;
  console.log(`Stock restored to expected (${expectedRestoredStock})? ${stockRestored ? '✅ YES' : '❌ NO'} (Current: ${prodFinal?.stock})`);

  // Check Buyer Refund Transaction
  const { data: refundTx } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', testOrderIdWallet)
    .eq('type', 'commission')
    .ilike('description', 'Estorno%')
    .maybeSingle();

  const refundSuccess = !!refundTx && Number(refundTx.amount) === 100.00 && refundTx.profile_id === userId;
  console.log(`Buyer wallet refund generated (Expected: +R$ 100.00)? ${refundSuccess ? '✅ YES' : '❌ NO'}`);
  if (refundTx) {
    console.log(`  - Refund Tx: R$ ${refundTx.amount} to Client ${refundTx.profile_id} [${refundTx.description}]`);
  }

  // Clean up wallet scenario transactions and order (keep stock status for next scenario)
  await supabase.from('transactions').delete().eq('order_id', testOrderIdWallet);
  await supabase.from('orders').delete().eq('id', testOrderIdWallet);

  // 3b. Scenario B: PIX Payment (should NOT generate any wallet refund)
  const testOrderIdPix = `TEST-CANCEL-P-${Date.now().toString().substring(6)}`;
  console.log(`\n3b. [PIX Scenario] Creating test order: ${testOrderIdPix}...`);
  
  const { data: orderPix, error: orderPixError } = await supabase
    .from('orders')
    .insert([{
      id: testOrderIdPix,
      customer_id: userId,
      customer_name: 'Cancellation Verifier',
      customer_initial: 'C',
      amount: 100.00,
      status: 'Aguardando Pagamento',
      items: testItems,
      branch_id: branchId,
      cashback_amount: 5.00,
      payment_method: 'Pix'
    }])
    .select()
    .single();

  if (orderPixError || !orderPix) {
    console.error('Failed to create test order (PIX Scenario):', orderPixError?.message);
    return;
  }

  // Simulate client-side stock decrement
  await supabase.from('products').update({
    stock: Math.max(0, prodFinal?.stock - 2),
    sales: (prodFinal?.sales || 0) + 2
  }).eq('id', productId);

  // Update order to paid
  console.log('Updating order to "Pago, Aguardando Retirada"...');
  await supabase.from('orders').update({ status: 'Pago, Aguardando Retirada' }).eq('id', testOrderIdPix);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Cancel order
  console.log('CANCELLING the order...');
  await supabase.from('orders').update({ status: 'Cancelado' }).eq('id', testOrderIdPix);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify no wallet refund generated
  console.log('\n======================================================');
  console.log('VERIFYING TRIGGER SIDE EFFECTS FOR PIX SCENARIO');
  console.log('======================================================');

  const { data: refundTxPix } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', testOrderIdPix)
    .eq('type', 'commission')
    .ilike('description', 'Estorno%')
    .maybeSingle();

  const noRefundSuccess = !refundTxPix;
  console.log(`Buyer wallet refund generated (Expected: NONE)? ${noRefundSuccess ? '✅ YES (None generated)' : '❌ NO (Refund generated erroneously!)'}`);
  if (refundTxPix) {
    console.log(`  - Erroneous Refund Tx: R$ ${refundTxPix.amount} [${refundTxPix.description}]`);
  }

  // Clean up PIX scenario
  await supabase.from('transactions').delete().eq('order_id', testOrderIdPix);
  await supabase.from('orders').delete().eq('id', testOrderIdPix);

  // Restore product stock back to original
  await supabase.from('products').update({ stock: initialStock, sales: initialSales }).eq('id', productId);
  if (branchId) {
    await supabase.from('product_stocks').update({ stock: initialBranchStock }).eq('product_id', productId).eq('branch_id', branchId);
  }

  console.log('======================================================');
  const allTestsPassed = stockRestored && refundSuccess && noRefundSuccess;
  if (allTestsPassed) {
    console.log('🎉 SUCCESS: Cancellation trigger logic handles wallet refunds and non-wallet orders perfectly!');
  } else {
    console.log('⚠️ WARNING: Some cancellation side effects failed to run or verify.');
  }
  console.log('======================================================\n');

  // 8. CLEANUP TEST DATA
  console.log('8. Cleaning up verification profile...');
  // Delete elevated user
  await supabase.from('profiles').delete().eq('id', userId);
  const { error: userDelError } = await supabase.rpc('admin_update_user_auth', {
    user_id: userId,
    email: email,
    delete_user: true
  });
  if (userDelError) {
    console.log('Note: could not delete auth user from auth.users (requires service role), it will persist in auth but profile was deleted.');
  }

  console.log('Cleanup finished!');
}

run().catch(console.error);
