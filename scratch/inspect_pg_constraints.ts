import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkPgConstraint() {
  const { data: config } = await supabase.from('mmn_config').select('*');
  console.log('MMN Config:', config);
}

checkPgConstraint();
