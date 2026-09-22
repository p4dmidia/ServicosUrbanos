import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function test() {
  const email = `auth-tester-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const signRes = await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', signRes.data?.user?.id);

  const { data: allTxs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, description, amount, status, order_id, created_at')
    .order('id', { ascending: true });

  console.log(`Total transactions in DB: ${allTxs?.length}`);

  // Find all duplicates by (profile_id, order_id, amount, and broad description category)
  const map = new Map<string, any[]>();
  allTxs?.forEach(t => {
    const orderMatch = t.description?.match(/Pedido\s*#?\s*([0-9]+)/i);
    const ordId = t.order_id || (orderMatch ? orderMatch[1] : null);
    if (ordId) {
      const isMensal = t.description?.toLowerCase().includes('mensal');
      const isAnual = t.description?.toLowerCase().includes('anual');
      const isReseller = t.description?.toLowerCase().includes('revendedor') || t.description?.toLowerCase().includes('regional');
      const key = `${t.profile_id}_${ordId}_${isReseller ? 'REG' : 'MMN'}_${isMensal ? 'M' : isAnual ? 'A' : 'O'}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
  });

  console.log("\nDuplicates found:");
  let dupCount = 0;
  for (const [k, list] of map.entries()) {
    if (list.length > 1) {
      dupCount++;
      console.log(`Key: ${k} (${list.length} rows):`);
      console.table(list.map(t => ({ id: t.id, profile_id: t.profile_id, desc: t.description, amount: t.amount, created_at: t.created_at })));
    }
  }

  console.log(`Total duplicate groups: ${dupCount}`);

  if (signRes.data?.user?.id) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signRes.data.user.id);
  }
}

test().catch(console.error);
