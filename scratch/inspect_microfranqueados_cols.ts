import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const testCols = [
  'id', 'profile_id', 'status', 'limit_100_free', 'is_primeiros_100',
  'registration_fee_amount', 'registration_fee_status', 'cobranca_dezembro',
  'razao_social', 'nome_fantasia', 'cnpj', 'cpf', 'is_pj_obrigatorio', 'data_migracao_pj',
  'created_at', 'updated_at'
];

async function run() {
  for (const col of testCols) {
    const { error } = await supabase
      .from('microfranqueados')
      .select(col)
      .limit(1);
    if (error) {
      console.log(`Column '${col}': DOES NOT EXIST (${error.message})`);
    } else {
      console.log(`Column '${col}': EXISTS`);
    }
  }
}

run().catch(console.error);
