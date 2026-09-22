import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Inspecting Viviane Santos ---');
  const { data: prof } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Viviane%');
  console.log('Profile:', prof);

  if (prof && prof.length > 0) {
    const vivId = prof[0].id;

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', vivId);
    console.log('Subscriptions:', subs);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', vivId);
    console.log('Orders:', orders);
  }
}

main().catch(console.error);
