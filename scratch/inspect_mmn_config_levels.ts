import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkMMNConfig() {
  const { data: config, error: cErr } = await supabase.from('mmn_config').select('*');
  console.log('--- MMN CONFIG ---', config, cErr);

  const { data: levels, error: lErr } = await supabase.from('mmn_levels').select('*').order('level', { ascending: true });
  console.log('--- MMN LEVELS ---', levels, lErr);
}

checkMMNConfig();
