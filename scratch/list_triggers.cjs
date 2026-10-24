const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const sql = `
    TRUNCATE _debug_triggers;
    INSERT INTO _debug_triggers (info)
    SELECT tgname || ' | ' || proname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'public.orders'::regclass;
  `;
  await supabase.rpc('execute_sql', { query: sql });
  const { data: rows } = await supabase.from('_debug_triggers').select('*');
  console.log('Triggers on orders:');
  (rows || []).forEach(r => console.log(r.info));
}

test().catch(console.error);
