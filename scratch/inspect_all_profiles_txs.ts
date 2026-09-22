import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAll() {
  const { data: allTxs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id, created_at');

  console.log(`Total transactions in DB: ${allTxs?.length || 0}`);
  console.table(allTxs);

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role');

  console.log(`Total profiles in DB: ${allProfiles?.length || 0}`);
  console.table(allProfiles);
}

inspectAll().catch(console.error);
