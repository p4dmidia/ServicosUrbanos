import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: cols, error } = await supabase.from('segurados').select('*').limit(1);
  console.log('segurados sample:', cols, error);

  const { data: apCols, error: apErr } = await supabase.from('apolices').select('*').limit(1);
  console.log('apolices sample:', apCols, apErr);
}

run();
