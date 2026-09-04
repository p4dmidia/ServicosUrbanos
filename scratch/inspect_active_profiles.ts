import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  const email = `debugger-profiles-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Profiles Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('status', 'active');

  console.log(`Perfis com status 'active' no banco: ${activeProfiles?.length}`);
  activeProfiles?.forEach(p => {
    console.log(`- ${p.full_name} (${p.email}) | ID: ${p.id} | Role: ${p.role}`);
  });

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
