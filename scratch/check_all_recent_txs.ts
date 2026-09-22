import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  console.log(`Total recent transactions: ${txs?.length || 0}`);
  console.table(txs);

  if (txs && txs.length > 0) {
    const profIds = [...new Set(txs.map(t => t.profile_id))];
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', profIds);

    console.log("Profiles:");
    console.table(profs);
  }
}

checkAll().catch(console.error);
