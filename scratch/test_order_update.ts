import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testUpdate() {
  // Login as admin/owner or debug user to test with proper role
  const email = `admin-debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  console.log('Testing order 9685 fetch...');
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '9685')
    .single();

  console.log('Order fetch:', { order, fetchErr });

  console.log('Testing update status to Pago...');
  const { data: updateData, error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'Pago' })
    .eq('id', '9685')
    .select();

  console.log('Update result:', { updateData, updateErr });
}

testUpdate();
