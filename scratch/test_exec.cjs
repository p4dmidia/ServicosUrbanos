const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const sql = `
    INSERT INTO public.transactions (profile_id, type, description, amount, status, order_id)
    VALUES ('194e5265-cdb6-431f-9f77-8888b1ee74ae', 'commission', 'Test SQL Insert', 1.00, 'pending', '1337');
  `;
  const res = await supabase.rpc('execute_sql', { query: sql });
  console.log('Insert SQL transaction res:', res);
}
test().catch(console.error);
