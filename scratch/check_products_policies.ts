import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const email = `admin-test-${Date.now()}@test.com`;
  const password = 'SuperAdminPassword123!';

  const { data: signUpData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Test' } }
  });

  if (signError) {
    console.error('Erro no signUp:', signError);
    return;
  }

  const userId = signUpData.user!.id;
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  const checkSql = `
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'products';
  `;

  const { data, error } = await supabase.rpc('execute_sql', { query: checkSql });
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('Current policies on products:', data);
  }

  await supabase.from('profiles').delete().eq('id', userId);
}

main().catch(console.error);
