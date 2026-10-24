import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'admin_exec_1792691526579@test.com';
  const password = 'SuperDebugPassword123!';
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    console.error('Sign in error:', signInErr);
    process.exit(1);
  }

  const sql = `
    DROP POLICY IF EXISTS "Microfranqueados visiveis para autenticados" ON public.microfranqueados;
    DROP POLICY IF EXISTS "Microfranqueados visiveis publicamente" ON public.microfranqueados;
    CREATE POLICY "Microfranqueados visiveis publicamente" ON public.microfranqueados
    FOR SELECT
    USING (true);

    DROP POLICY IF EXISTS "Licencas MMN visiveis para autenticados" ON public.licencas_mmn;
    DROP POLICY IF EXISTS "Licencas MMN visiveis publicamente" ON public.licencas_mmn;
    CREATE POLICY "Licencas MMN visiveis publicamente" ON public.licencas_mmn
    FOR SELECT
    USING (true);
  `;

  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  if (error) {
    console.error('Error executing policy update:', error);
  } else {
    console.log('Successfully updated policies for public SELECT:', data);
  }
}

run();
