import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  console.log('Testing get_upline_chain(max_depth, start_user_id):');
  const res = await supabase.rpc('get_upline_chain', {
    max_depth: 5,
    start_user_id: emersonId
  });
  console.log('Result:', res);
}

main().catch(console.error);
