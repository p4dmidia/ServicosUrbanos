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

  // 3. Create a test order
  const testOrderId = `TEST-CANCEL-${Date.now().toString().substring(6)}`;
  console.log(`\n3. Creating test order: ${testOrderId}...`);
  
  const testItems = [
    {
      id: productId,
      name: product.name,
      price: 50.00,
      quantity: 2
    }
  ];

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      id: testOrderId,
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

  if (orderError || !order) {
    console.error('Failed to create test order:', orderError?.message);
    return;
  }
  console.log('Test order created in state: "Aguardando Pagamento"');

  // 4. Simulate client-side stock decrement during checkout
  console.log('4. Simulating checkout stock decrement (2 units)...');
  
  // Decrement main product stock
  await supabase
    .from('products')
    .update({
      stock: Math.max(0, initialStock - 2),
      sales: initialSales + 2
    })
    .eq('id', productId);

  if (branchId) {
    await supabase
      .from('product_stocks')
      .update({
        stock: Math.max(0, initialBranchStock - 2)
      })
      .eq('product_id', productId)
      .eq('branch_id', branchId);
  }

  // Verify decrement
  const { data: prodAfterCheckout } = await supabase.from('products').select('stock, sales').eq('id', productId).single();
  console.log(`Stock after checkout - Global: ${prodAfterCheckout?.stock} (Expected: ${initialStock - 2}), Sales: ${prodAfterCheckout?.sales} (Expected: ${initialSales + 2})`);

  // 5. Update order to paid state to trigger commissions
  console.log('\n5. Updating order to "Pago, Aguardando Retirada" to distribute commissions...');
  const { error: payError } = await supabase
    .from('orders')
    .update({ status: 'Pago, Aguardando Retirada' })
    .eq('id', testOrderId);

  if (payError) {
    console.error('Failed to mark order as Paid:', payError.message);
    return;
  }

  // Wait a moment for trigger execution
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Assert monthly consumption count for paid order
  const { data: consumptionPaid } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', userId)
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);
  
  const consumptionCountPaid = consumptionPaid?.length || 0;
  console.log(`Monthly consumption count (Paid order): ${consumptionCountPaid} (Expected: 1)`);

  // Check if commission transactions were generated
  const { data: commissions, error: commsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', testOrderId)
    .eq('type', 'commission');

  if (commsError) {
    console.error('Error checking commissions:', commsError.message);
  } else {
    console.log(`Commissions generated: ${commissions?.length || 0} rows found.`);
    commissions?.forEach(c => {
      console.log(`  - To Affiliate ${c.profile_id}: R$ ${c.amount} [${c.description}]`);
    });
  }

  // 6. CANCEL the order!
  console.log('\n6. CANCELLING the order...');
  const { error: cancelError } = await supabase
    .from('orders')
    .update({ status: 'Cancelado' })
    .eq('id', testOrderId);

  if (cancelError) {
    console.error('Failed to cancel order:', cancelError.message);
    return;
  }

  // Wait a moment for trigger execution
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Assert monthly consumption count after cancellation
  const { data: consumptionCancelled } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', userId)
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);
  
  const consumptionCountCancelled = consumptionCancelled?.length || 0;
  console.log(`Monthly consumption count (Cancelled order): ${consumptionCountCancelled} (Expected: 0)`);

  // 7. VERIFY RESULTS
  console.log('\n======================================================');
  console.log('VERIFYING TRIGGER SIDE EFFECTS AFTER CANCELLATION');
  console.log('======================================================');

  // A. Check Product Stock Restoration
  const { data: prodFinal } = await supabase.from('products').select('stock, sales').eq('id', productId).single();
  const expectedRestoredStock = Math.max(0, initialStock - 2) + 2;
  const stockRestored = prodFinal?.stock === expectedRestoredStock;
  const salesRestored = prodFinal?.sales === initialSales;
  console.log(`Stock restored to expected (${expectedRestoredStock})? ${stockRestored ? '✅ YES' : '❌ NO'} (Current: ${prodFinal?.stock})`);
  console.log(`Sales restored to initial (${initialSales})? ${salesRestored ? '✅ YES' : '❌ NO'} (Current: ${prodFinal?.sales})`);

  if (branchId) {
    const { data: branchFinal } = await supabase
      .from('product_stocks')
      .select('stock')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle();
    const expectedRestoredBranchStock = Math.max(0, initialBranchStock - 2) + 2;
    const branchRestored = branchFinal?.stock === expectedRestoredBranchStock;
    console.log(`Branch stock restored to expected (${expectedRestoredBranchStock})? ${branchRestored ? '✅ YES' : '❌ NO'} (Current: ${branchFinal?.stock})`);
  }

  // B. Check Commissions Deletion
  const { data: commissionsFinal } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', testOrderId)
    .eq('type', 'commission')
    .not('description', 'ilike', 'Estorno%');
  
  const commissionsDeleted = !commissionsFinal || commissionsFinal.length === 0;
  console.log(`Upline commissions deleted? ${commissionsDeleted ? '✅ YES' : '❌ NO'} (Current count: ${commissionsFinal?.length || 0})`);

  // C. Check Buyer Refund Transaction
  const { data: refundTx } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', testOrderId)
    .eq('type', 'commission')
    .ilike('description', 'Estorno%')
    .single();

  const refundSuccess = !!refundTx && Number(refundTx.amount) === 100.00 && refundTx.profile_id === userId;
  console.log(`Buyer wallet refund generated? ${refundSuccess ? '✅ YES' : '❌ NO'}`);
  if (refundTx) {
    console.log(`  - Refund Tx: R$ ${refundTx.amount} to Client ${refundTx.profile_id} [${refundTx.description}]`);
  }

  console.log('======================================================');
  const consumptionSuccess = consumptionCountPaid === 1 && consumptionCountCancelled === 0;
  const allTestsPassed = stockRestored && salesRestored && commissionsDeleted && refundSuccess && consumptionSuccess;
  if (allTestsPassed) {
    console.log('🎉 SUCCESS: All cancellation and monthly consumption side effects executed perfectly!');
  } else {
    console.log('⚠️ WARNING: Some cancellation side effects failed to run. Check if trigger is applied.');
  }
  console.log('======================================================\n');

  // 8. CLEANUP TEST DATA
  console.log('8. Cleaning up verification database records...');
  // Delete transactions
  await supabase.from('transactions').delete().eq('order_id', testOrderId);
  // Delete order
  await supabase.from('orders').delete().eq('id', testOrderId);
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
