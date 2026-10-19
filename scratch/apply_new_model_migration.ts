import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `debugger-mmn-model-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  console.log("1. Signing up debug runner user...");
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Database Migration Runner',
      }
    }
  });

  if (signUpErr && !signUpErr.message.includes('already registered')) {
    console.error("Signup error:", signUpErr.message);
  }

  console.log("2. Signing in debug runner user...");
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInErr) {
    console.error("Sign in failed:", signInErr.message);
    process.exit(1);
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  console.log("3. Promoting temporarily to owner...");
  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', userId);

  const sqlFilePath = path.resolve('migration_novo_modelo_mmn_e_seguro.sql');
  const sqlQuery = fs.readFileSync(sqlFilePath, 'utf-8');

  console.log("4. Executing migration_novo_modelo_mmn_e_seguro.sql via RPC execute_sql...");
  const { data, error } = await supabase.rpc('execute_sql', {
    query: sqlQuery
  });

  if (error) {
    console.error("RPC Error:", error.message);
    process.exit(1);
  } else {
    console.log("Success! Migration executed successfully.");
  }

  console.log("5. Verifying new tables existence...");
  const tablesToCheck = [
    'microfranqueados',
    'licencas_mmn',
    'rede_mmn',
    'comissoes_mmn',
    'cashback_mmn',
    'inadimplencia_mmn',
    'aceites_mmn',
    'segurados',
    'modalidade_pagamento',
    'apolices',
    'numeros_da_sorte',
    'sorteios',
    'telemedicina_acesso',
    'sinistros',
    'documentos_sinistro',
    'aceites_seguro'
  ];

  for (const table of tablesToCheck) {
    const { count, error: tableErr } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (tableErr) {
      console.error(`❌ Table ${table}: ${tableErr.message}`);
    } else {
      console.log(`✅ Table ${table}: Verified (count: ${count})`);
    }
  }

  console.log("6. Verifying modalidade_pagamento rows...");
  const { data: plans } = await supabase
    .from('modalidade_pagamento')
    .select('*')
    .order('valor', { ascending: true });
  console.table(plans);

  console.log("7. Cleaning up debug user role...");
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', userId);
    
  console.log("--- ETAPA 1 COMPLETED SUCCESSFULLY ---");
}

run().catch(console.error);
