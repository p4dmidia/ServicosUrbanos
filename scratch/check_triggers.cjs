const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const sql = `
    CREATE TABLE IF NOT EXISTS _debug_triggers (
      id serial primary key,
      info text
    );
    ALTER TABLE _debug_triggers DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON _debug_triggers TO anon, authenticated;
    TRUNCATE _debug_triggers;

    INSERT INTO _debug_triggers (info)
    SELECT tgname || ' | ' || proname || ' | ' || pg_get_functiondef(p.oid)
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'public.orders'::regclass;
  `;
  const res = await supabase.rpc('execute_sql', { query: sql });
  console.log('Execute SQL res:', res);

  const { data: rows, error } = await supabase.from('_debug_triggers').select('*');
  console.log('Results count:', rows ? rows.length : 0, error);
  (rows || []).forEach(r => console.log(r.info));
}

test().catch(console.error);
