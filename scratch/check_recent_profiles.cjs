const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, updated_at, created_at, referred_by')
    .order('updated_at', { ascending: false })
    .limit(10);
  console.log('Recent profiles:', users, error);
}

check();
