import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-owner-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Modifier Owner' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  // Define como owner
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('Substituindo mmn_levels como owner...');
  
  // 1. Deletar todos
  const { error: deleteError } = await supabase
    .from('mmn_levels')
    .delete()
    .neq('level', 0);

  if (deleteError) {
    console.error('Erro ao deletar mmn_levels:', deleteError);
    return;
  }

  // 2. Inserir os novos
  const { data, error: insertError } = await supabase
    .from('mmn_levels')
    .insert([
      { level: 1, value: 6 },
      { level: 2, value: 6 },
      { level: 3, value: 6 }
    ])
    .select();

  if (insertError) {
    console.error('Erro ao inserir mmn_levels:', insertError);
  } else {
    console.log('mmn_levels recriados com sucesso:', data);
  }

  // Reverte
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
