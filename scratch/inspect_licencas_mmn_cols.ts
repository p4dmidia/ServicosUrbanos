import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const testCols = [
  'id', 'microfranqueado_id', 'profile_id', 'tipo_licenca', 'valor', 'status', 'data_inicio', 'data_fim', 'created_at'
];

async function run() {
  for (const col of testCols) {
    const { error } = await supabase
      .from('licencas_mmn')
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
