import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspect() {
  const { data: config } = await supabase.from('mmn_config').select('*');
  console.log('mmn_config:', config);

  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('mmn_levels:', levels);

  const { data: txs, count } = await supabase
    .from('transactions')
    .select('id, type, description, amount, status, created_at', { count: 'exact' })
    .or('description.ilike.%semanal%,description.ilike.%(CD)%');

  console.log('Total weekly transactions found:', count);
  console.log('Sample weekly transactions:', txs?.slice(0, 10));
}

inspect().catch(console.error);
