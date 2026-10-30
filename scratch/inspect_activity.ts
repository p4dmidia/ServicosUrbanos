import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .or('full_name.ilike.%Emerson%,full_name.ilike.%Ana Lisboa%');

  console.log('Profiles found:', profiles);

  for (const p of profiles || []) {
    console.log(`\n=== Activity for ${p.full_name} (${p.id}) ===`);
    const act = await businessRules.getEcosystemActivity(p.id);
    console.log('Activity count:', act.length);
    console.log('Activity items:', JSON.stringify(act, null, 2));
  }
}

main().catch(console.error);

