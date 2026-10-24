const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  console.log('1. Adding columns to mmn_levels...');
  const alterRes = await supabase.rpc('execute_sql', {
    query: `
      ALTER TABLE public.mmn_levels ADD COLUMN IF NOT EXISTS cashback_semanal numeric DEFAULT 0;
      ALTER TABLE public.mmn_levels ADD COLUMN IF NOT EXISTS cashback_anual numeric DEFAULT 0;
      
      -- Insert / update default levels 1 to 6
      INSERT INTO public.mmn_levels (level, cashback_semanal, cashback_anual, value)
      VALUES 
        (1, 21.00, 2.00, 23.00),
        (2, 3.00, 2.00, 5.00),
        (3, 3.00, 2.00, 5.00),
        (4, 0.00, 0.00, 0.00),
        (5, 0.00, 0.00, 0.00),
        (6, 0.00, 0.00, 0.00)
      ON CONFLICT (level) DO UPDATE SET
        cashback_semanal = EXCLUDED.cashback_semanal,
        cashback_anual = EXCLUDED.cashback_anual,
        value = EXCLUDED.value,
        updated_at = now();
        
      -- Update mmn_config
      UPDATE public.mmn_config
      SET 
        depth = 3,
        cashback_mensal = 27.00,
        cashback_anual = 6.00,
        commission_regional_mensal = 0.00,
        commission_regional_anual = 0.00,
        updated_at = now()
      WHERE id = 1;
    `
  });
  console.log('Alter / upsert result:', alterRes);

  const { data: levels, error: lErr } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('Updated mmn_levels:', levels, lErr);

  const { data: config, error: cErr } = await supabase.from('mmn_config').select('*');
  console.log('Updated mmn_config:', config, cErr);
}

run();
