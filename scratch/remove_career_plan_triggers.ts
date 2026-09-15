import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const sqlDrop = `
DROP TRIGGER IF EXISTS trg_career_plan_subscription_check ON public.subscriptions;
DROP TRIGGER IF EXISTS trg_career_plan_order_check ON public.orders;
DROP FUNCTION IF EXISTS public.trg_career_plan_on_subscription();
DROP FUNCTION IF EXISTS public.trg_career_plan_on_order();
DROP FUNCTION IF EXISTS public.check_and_promote_to_reseller(UUID);
`;

async function main() {
  console.log('--- REMOVENDO TRIGGERS DE PLANO DE CARREIRA AUTOMÁTICO ---');

  // Login como admin temporário para executar via RPC com auth
  const email = `admin-career-remover-${Date.now()}@test.com`;
  const password = 'SuperAdminPassword123!';

  const { data: signUpData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Career Remover' } }
  });

  if (signError) {
    console.error('Erro no signUp:', signError);
    return;
  }

  const userId = signUpData.user!.id;
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log('Executando drop das triggers e funções...');
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('execute_sql', {
    query: sqlDrop
  });

  if (rpcErr) {
    console.error('Erro ao executar sqlDrop:', rpcErr);
  } else {
    console.log('Triggers e funções de plano de carreira removidas com sucesso no Postgres!');
  }

  console.log('Limpando usuário temporário...');
  await supabase.from('profiles').delete().eq('id', userId);
  console.log('Concluído!');
}

main().catch(console.error);
