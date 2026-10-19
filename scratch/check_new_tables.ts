import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tables = [
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

  console.log("=== VERIFYING NEW TABLES IN SUPABASE ===");
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists (rows: ${count})`);
    }
  }
}

run().catch(console.error);
