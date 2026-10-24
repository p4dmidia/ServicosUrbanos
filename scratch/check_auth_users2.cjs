const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const { data } = await supabase.rpc('execute_sql', {
    query: `
      SELECT json_agg(u) FROM (
        SELECT id, email, created_at, last_sign_in_at
        FROM auth.users
        ORDER BY last_sign_in_at DESC NULLS LAST
        LIMIT 10
      ) u;
    `
  });
  console.log('Result:', JSON.stringify(data, null, 2));
}

check();
