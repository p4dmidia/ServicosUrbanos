import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testSicStatus() {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', '194e5265-cdb6-431f-9f77-8888b1ee74ae');
  
  console.log('Subscriptions for Sic Comercio:', sub);
}

testSicStatus();
