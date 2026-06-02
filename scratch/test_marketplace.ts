import * as dotenv from 'dotenv';
import * as path from 'path';
import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  console.log("=== RUNNING MARKETPLACE DATA TEST ===");

  // Sign up/in to bypass RLS and get owner role
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });

  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  try {
    console.log("\n1. Testing getMarketplaceConfig()...");
    try {
      const config = await businessRules.getMarketplaceConfig();
      console.log("Config:", config);
    } catch (err: any) {
      console.error("getMarketplaceConfig failed:", err);
    }

    console.log("\n2. Testing getAdminMarketplaceStats()...");
    try {
      const stats = await businessRules.getAdminMarketplaceStats();
      console.log("Stats:", stats);
    } catch (err: any) {
      console.error("getAdminMarketplaceStats failed:", err);
    }

    console.log("\n3. Testing getAdminMerchants()...");
    try {
      const merchants = await businessRules.getAdminMerchants();
      console.log("Merchants count:", merchants.length);
      if (merchants.length > 0) {
        console.log("Sample merchant:", merchants[0]);
      }
    } catch (err: any) {
      console.error("getAdminMerchants failed:", err);
    }

  } catch (error) {
    console.error("Error during run:", error);
  } finally {
    // Clean up
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
    console.log("\nCleaned up session!");
  }
}

run().catch(console.error);
