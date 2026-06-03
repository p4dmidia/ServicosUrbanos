import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: marketplaceConfig, error: err1 } = await supabase.from('marketplace_config').select('*');
  console.log('marketplace_config:', err1 || marketplaceConfig);

  const { data: mmnConfig, error: err2 } = await supabase.from('mmn_config').select('*');
  console.log('mmn_config:', err2 || mmnConfig);
}

check();
