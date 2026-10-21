import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, cpf')
    .limit(3);

  console.log("Profiles:", profiles, error);
}

run().catch(console.error);
