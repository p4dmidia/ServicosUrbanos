import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `temp-owner-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Modifier Owner' } }
  });

  const uid = signUpData.user?.id;
  if (!uid) {
    console.error('Falha ao criar usuário temporário');
    return;
  }

  // Tenta dar role owner diretamente ou atualizar
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('Atualizando mmn_levels...');
  for (const item of [
    { level: 1, cashback_semanal: 21, cashback_anual: 2, value: 23 },
    { level: 2, cashback_semanal: 3, cashback_anual: 2, value: 5 },
    { level: 3, cashback_semanal: 3, cashback_anual: 2, value: 5 }
  ]) {
    const { data, error } = await supabase
      .from('mmn_levels')
      .update({
        cashback_semanal: item.cashback_semanal,
        cashback_anual: item.cashback_anual,
        value: item.value,
        updated_at: new Date().toISOString()
      })
      .eq('level', item.level)
      .select();
    console.log(`Level ${item.level}:`, data, error);
  }

  console.log('Atualizando mmn_config...');
  const { data: cfg, error: cfgErr } = await supabase
    .from('mmn_config')
    .update({
      depth: 3,
      payment_type: 'percent',
      cashback_mensal: 27,
      cashback_anual: 6,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select();
  console.log('Config:', cfg, cfgErr);

  // Limpeza
  await supabase.from('profiles').delete().eq('id', uid);
}

run().catch(console.error);
