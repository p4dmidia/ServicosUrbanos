import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-role-check-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Role Checker' } }
  });

  const uid = signUpData.user?.id;
  if (!uid) {
    console.error('Falha ao registrar');
    return;
  }

  await supabase.auth.signInWithPassword({ email, password });
  
  // 1. Verificar role inicial
  let { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
  console.log('Role inicial:', profile?.role);

  // 2. Tentar atualizar para owner
  const { data: updateRes, error: updateErr } = await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', uid)
    .select();
  
  if (updateErr) {
    console.error('Erro ao atualizar role:', updateErr);
  } else {
    console.log('Role atualizado com sucesso:', updateRes);
  }

  // 3. Verificar role final
  let { data: profileFinal } = await supabase.from('profiles').select('role').eq('id', uid).single();
  console.log('Role final na tabela profiles:', profileFinal?.role);
}

run().catch(console.error);
