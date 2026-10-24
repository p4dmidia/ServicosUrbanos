const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const sql = `
    DROP TABLE IF EXISTS _debug_triggers;
    CREATE TABLE _debug_triggers (
      id serial primary key,
      proname text,
      line text
    );
    ALTER TABLE _debug_triggers DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON _debug_triggers TO anon, authenticated;

    INSERT INTO _debug_triggers (proname, line)
    SELECT p.proname, m[1]
    FROM pg_proc p,
    LATERAL regexp_matches(pg_get_functiondef(p.oid), '.*total_amount.*', 'g') m;
  `;
  await supabase.rpc('execute_sql', { query: sql });
  const { data: rows } = await supabase.from('_debug_triggers').select('*');
  console.log('Matches for total_amount:', JSON.stringify(rows, null, 2));
}

test().catch(console.error);
