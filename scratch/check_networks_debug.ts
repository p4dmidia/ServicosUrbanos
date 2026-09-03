import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const email = `debugger-${Date.now()}@test.com`;
  await supabase.auth.signUp({ email, password: 'SuperDebugPassword123!' });
  await supabase.auth.signInWithPassword({ email, password: 'SuperDebugPassword123!' });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const { data: config } = await supabase.from('mmn_config').select('*').single();
  console.log('MMN Config:', config);

  const { data: levelsConfig } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('MMN Levels:', levelsConfig);

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, referred_by, referral_code, role');
  console.log('Total profiles in DB:', profiles?.length);

  for (const p of (profiles || [])) {
    const g1 = profiles?.filter(x => x.referred_by === p.id) || [];
    if (g1.length > 0) {
      const g1Ids = g1.map(x => x.id);
      const g2 = profiles?.filter(x => g1Ids.includes(x.referred_by)) || [];
      const g2Ids = g2.map(x => x.id);
      const g3 = profiles?.filter(x => g2Ids.includes(x.referred_by)) || [];
      const g3Ids = g3.map(x => x.id);
      const g4 = profiles?.filter(x => g3Ids.includes(x.referred_by)) || [];
      const g4Ids = g4.map(x => x.id);
      const g5 = profiles?.filter(x => g4Ids.includes(x.referred_by)) || [];
      
      console.log(`\nUser: "${p.full_name}" (${p.id}) [Role: ${p.role}]`);
      console.log(`  G1: ${g1.length} | G2: ${g2.length} | G3: ${g3.length} | G4: ${g4.length} | G5: ${g5.length}`);
      console.log(`  Total (G1..G5): ${g1.length + g2.length + g3.length + g4.length + g5.length}`);
      console.log(`  Total (G1+G2): ${g1.length + g2.length}`);
    }
  }
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

test().catch(console.error);
