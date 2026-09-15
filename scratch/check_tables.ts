import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('notifications table error:', error?.message || 'OK');

  const { data: inv, error: errInv } = await supabase.from('affiliate_invoices').select('*').limit(1);
  console.log('affiliate_invoices table error:', errInv?.message || 'OK');
}

run();
