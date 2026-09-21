import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSilvana() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, description')
    .ilike('full_name', '%silvana%')
    .maybeSingle();

  console.log("Silvana profile:", profile);

  if (profile) {
    const { data: invoices } = await supabase
      .from('affiliate_invoices')
      .select('*')
      .eq('profile_id', profile.id);

    console.log("Silvana invoices:", invoices);

    const { data: txs } = await supabase
      .from('transactions')
      .select('id, description, amount, status, created_at')
      .eq('profile_id', profile.id);

    console.log("Silvana transactions:");
    console.table(txs);
  }
}

checkSilvana().catch(console.error);
