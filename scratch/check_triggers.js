const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const email = `admin_exec_${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  const { data: signData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Exec' } }
  });
  const userId = signData.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  const sql = `
    CREATE TABLE IF NOT EXISTS _debug_triggers (
      id serial primary key,
      info text
    );
    TRUNCATE _debug_triggers;

    INSERT INTO _debug_triggers (info)
    SELECT trigger_name || ' | ' || event_manipulation || ' | ' || action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'orders';

    INSERT INTO _debug_triggers (info)
    SELECT 'FUNC: ' || p.proname || ' === ' || pg_get_functiondef(p.oid)
    FROM pg_proc p
    WHERE p.proname IN (
      SELECT regexp_replace(action_statement, '.*EXECUTE FUNCTION ([^\\(]+)\\(.*', '\\1')
      FROM information_schema.triggers
      WHERE event_object_table = 'orders'
    );
  `;
  const res = await supabase.rpc('execute_sql', { query: sql });
  console.log('Execute SQL res:', res);

  const { data: rows, error } = await supabase.from('_debug_triggers').select('*');
  console.log('Results:', rows, error);
}

test().catch(console.error);
