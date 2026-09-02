import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function applyTriggerUpdate() {
  const email = `exec-sql-${Date.now()}@test.com`;
  const password = 'ExecSqlPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  const sql = fs.readFileSync('update_handle_new_user_sic_default.sql', 'utf8');
  
  // Test direct subscription insert for Sic Comercio
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      id: '194e5265-0000-0000-0000-000000000001',
      profile_id: '194e5265-cdb6-431f-9f77-8888b1ee74ae',
      plan_type: 'anual',
      amount: 0,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

  console.log('Sic Comercio vitalicio subscription created/updated:', subData, subError);
}

applyTriggerUpdate();
