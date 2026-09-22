import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id, created_at')
    .or('description.ilike.%1301%,description.ilike.%1300%');

  console.log("Transactions for 1300/1301:");
  console.table(txs);

  if (txs && txs.length > 0) {
    const profIds = [...new Set(txs.map(t => t.profile_id))];
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', profIds);

    console.log("Profiles for these transactions:");
    console.table(profs);
  }
}

check().catch(console.error);
