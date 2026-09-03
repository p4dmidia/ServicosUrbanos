import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function getNetworkSummary(userId: string) {
  const { data: config } = await supabase.from('mmn_config').select('depth').single();
  const rawDepth = config?.depth || 3;
  const depth = Math.min(rawDepth > 2 ? rawDepth - 1 : rawDepth, 2);

  const levels: { [key: string]: number } = {};
  const allSeenIds = new Set([userId]);
  let currentParentIds = [userId];
  let total = 0;

  for (let i = 1; i <= depth; i++) {
    levels[`g${i}`] = 0;
  }

  for (let i = 1; i <= depth; i++) {
    if (currentParentIds.length === 0) break;

    const { data: levelMembers, error: levelError } = await supabase
      .from('profiles')
      .select('id, full_name, referred_by')
      .in('referred_by', currentParentIds);

    if (levelError || !levelMembers || levelMembers.length === 0) {
      currentParentIds = [];
      continue;
    }

    const newIds: string[] = [];
    levelMembers.forEach(p => {
      if (!allSeenIds.has(p.id)) {
        newIds.push(p.id);
        allSeenIds.add(p.id);
      }
    });

    levels[`g${i}`] = newIds.length;
    total += newIds.length;
    currentParentIds = newIds;
  }

  return { ...levels, total };
}

async function test() {
  const email = `debugger-${Date.now()}@test.com`;
  await supabase.auth.signUp({ email, password: 'SuperDebugPassword123!' });
  await supabase.auth.signInWithPassword({ email, password: 'SuperDebugPassword123!' });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const weiderId = 'e8ae8253-6bca-4e18-9576-eac9bbe5cef5';

  console.log('=== Emerson Network Summary ===');
  const emersonSummary = await getNetworkSummary(emersonId);
  console.log('Emerson Summary:', emersonSummary);

  console.log('=== Weider Network Summary ===');
  const weiderSummary = await getNetworkSummary(weiderId);
  console.log('Weider Summary:', weiderSummary);

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

test().catch(console.error);
