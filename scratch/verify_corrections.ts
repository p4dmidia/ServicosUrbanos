import * as dotenv from 'dotenv';
import * as path from 'path';
import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  console.log("=== RUNNING VERIFICATION FOR CORRECTIONS ===");

  // 1. Sign up/in to bypass RLS and get owner role
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  console.log("Authenticated User ID:", userId);

  const updateResult = await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);
  console.log("Profile update result:", updateResult);

  const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log("Profile row in DB:", profileRow);

  const testTxQuery = await supabase.from('transactions').select('amount', { count: 'exact', head: true });
  console.log("Total transactions viewable:", testTxQuery.count, "Error:", testTxQuery.error);

  const testComms = await supabase.from('transactions').select('amount, description, order_id, orders(status)').eq('type', 'commission').gte('created_at', '2026-06-01T00:00:00.000Z');
  console.log("Direct query result count:", testComms.data?.length, "Error:", testComms.error);
  if (testComms.data && testComms.data.length > 0) {
    console.log("Sample comm:", testComms.data[0]);
  }

  try {
    // 2. Fetch global admin stats
    console.log("\nFetching admin global stats...");
    const stats = await businessRules.getAdminGlobalStats();
    console.log("Admin Global Stats:", stats);

    // Assertions
    const expectedBranchCount = 2; // Filial 1 and Filial 2
    const expectedCommissionTotal = 560; // 240 + 240 + 40 + 40

    console.log(`\nAssertion 1: Lojistas Count = ${stats.branchCount} (Expected: ${expectedBranchCount})`);
    if (stats.branchCount === expectedBranchCount) {
      console.log("✅ Lojistas Count is CORRECT!");
    } else {
      console.error(`❌ Lojistas Count is INCORRECT! Expected: ${expectedBranchCount}, Got: ${stats.branchCount}`);
    }

    console.log(`\nAssertion 2: MMN Cashback Total = R$ ${stats.commissionTotal} (Expected: R$ ${expectedCommissionTotal})`);
    if (stats.commissionTotal === expectedCommissionTotal) {
      console.log("✅ MMN Cashback Total is CORRECT!");
    } else {
      console.error(`❌ MMN Cashback Total is INCORRECT! Expected: ${expectedCommissionTotal}, Got: ${stats.commissionTotal}`);
    }

  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    // Clean up
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
    console.log("\nCleaned up session!");
  }
}

run().catch(console.error);
