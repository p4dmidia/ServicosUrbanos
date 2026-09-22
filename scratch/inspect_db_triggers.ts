import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  console.log("Signing up debug user...");
  const { data: signData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Debugger' } }
  });

  const userId = signData.user?.id;
  if (!userId) {
    console.error("Failed to get user id");
    return;
  }

  console.log("Making user owner...");
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  // Inspect all triggers on orders, subscriptions, profiles
  const inspectTriggersQuery = `
    SELECT 
      event_object_table, 
      trigger_name, 
      action_statement,
      action_timing,
      event_manipulation
    FROM information_schema.triggers
    WHERE event_object_table IN ('orders', 'subscriptions', 'profiles', 'transactions')
    ORDER BY event_object_table, trigger_name;
  `;

  const { data: triggers, error: trgErr } = await supabase.rpc('execute_sql', {
    query: inspectTriggersQuery
  });

  console.log("Triggers:", JSON.stringify(triggers, null, 2), trgErr);

  // Inspect function source for handle_order_payment and any other trigger functions
  const inspectFunctions = `
    SELECT 
      p.proname,
      pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname IN ('handle_order_payment', 'check_and_promote_to_reseller', 'trg_career_plan_on_order', 'trg_career_plan_on_subscription', 'handle_new_user');
  `;

  const { data: funcs, error: funcErr } = await supabase.rpc('execute_sql', {
    query: inspectFunctions
  });

  console.log("Functions defs:", JSON.stringify(funcs, null, 2), funcErr);

  // Clean up
  await supabase.from('profiles').delete().eq('id', userId);
}

run().catch(console.error);
