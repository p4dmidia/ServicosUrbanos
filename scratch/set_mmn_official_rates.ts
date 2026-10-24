import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Atualizando mmn_levels para as taxas oficiais...');
  
  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@teste.com',
    password: 'password123'
  });
  
  if (authError) {
    console.log('Tentando com admin master...');
  }

  const levelsToUpdate = [
    { level: 1, cashback_semanal: 21, cashback_anual: 2, value: 23 },
    { level: 2, cashback_semanal: 3, cashback_anual: 2, value: 5 },
    { level: 3, cashback_semanal: 3, cashback_anual: 2, value: 5 }
  ];

  for (const l of levelsToUpdate) {
    const { data, error } = await supabase
      .from('mmn_levels')
      .update({
        cashback_semanal: l.cashback_semanal,
        cashback_anual: l.cashback_anual,
        value: l.value,
        updated_at: new Date().toISOString()
      })
      .eq('level', l.level)
      .select();

    console.log(`Update level ${l.level}:`, data, error);
  }

  // Update mmn_config
  const { data: cfgData, error: cfgError } = await supabase
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

  console.log('Update mmn_config:', cfgData, cfgError);
}

run();
