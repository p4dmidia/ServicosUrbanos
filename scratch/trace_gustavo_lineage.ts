import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function traceGustavo() {
  const email = `debugger-trace-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // 1. Gustavo Profile
  const { data: gustavo } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Gustavo%')
    .single();

  console.log('--- GUSTAVO RIBEIRO (G0) ---');
  console.log('ID:', gustavo?.id);
  console.log('Name:', gustavo?.full_name);
  console.log('Role:', gustavo?.role);
  console.log('Referred By:', gustavo?.referred_by);
  console.log('Branch ID:', gustavo?.branch_id);
  console.log('Merchant ID:', gustavo?.merchant_id);

  // 2. Trace referred_by lineage upwards
  console.log('\n--- ÁRVORE DE INDICAÇÃO (UPLINES) ---');
  let currId = gustavo?.referred_by;
  let level = 1;
  while (currId && level <= 10) {
    const { data: parent } = await supabase
      .from('profiles')
      .select('id, full_name, role, referred_by, branch_id, merchant_id')
      .eq('id', currId)
      .single();
    
    if (!parent) {
      console.log(`Nível ${level} (ID: ${currId}): NÃO ENCONTRADO NO BANCO`);
      break;
    }
    console.log(`G${level}: ${parent.full_name} | Role: ${parent.role} | ID: ${parent.id} | Parent: ${parent.referred_by}`);
    currId = parent.referred_by;
    level++;
  }

  // 3. Check all regional resellers in database
  console.log('\n--- TODOS OS REGIONAL RESELLERS ---');
  const { data: regionals } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by, branch_id, merchant_id')
    .eq('role', 'regional_reseller');
  
  regionals?.forEach(r => {
    console.log(`Regional: ${r.full_name} | ID: ${r.id} | Branch: ${r.branch_id} | Merchant: ${r.merchant_id} | Referred: ${r.referred_by}`);
  });

  // 4. Check Order 1218
  console.log('\n--- PEDIDO 1218 ---');
  const { data: o1218 } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1218')
    .single();
  console.log('Order 1218 branch_id:', o1218?.branch_id);
  console.log('Order 1218 customer_id:', o1218?.customer_id);

  // 5. Check how the trigger in update_handle_order_payment_final.sql finds the regional reseller
  console.log('\n--- TODAS AS TRANSAÇÕES GERADAS PARA 1218 ---');
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, profile_id, type, amount, description, status, profiles(full_name, role)')
    .or('order_id.eq.1218,description.ilike.%1218%');
  
  txs?.forEach(t => {
    console.log(`TX: ${t.id} | To: ${(t as any).profiles?.full_name} (${(t as any).profiles?.role}) | Amount: ${t.amount} | Desc: ${t.description}`);
  });
}

traceGustavo();
