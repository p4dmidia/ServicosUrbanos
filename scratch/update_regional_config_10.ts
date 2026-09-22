import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  const { data: config } = await supabase.from('mmn_config').select('*').single();
  console.log("Current mmn_config in DB:", config);

  // Update commission_regional_mensal to 10.00 if it isn't
  if (config) {
    const { data: updated, error } = await supabase
      .from('mmn_config')
      .update({
        commission_regional_mensal: 10.00,
        commission_regional_anual: 2.00
      })
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating mmn_config:", error);
    } else {
      console.log("Updated mmn_config in DB:", updated);
    }
  }

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
