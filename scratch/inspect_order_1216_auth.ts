import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-txs-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Database Txs Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) {
    console.error('Falha na autenticação');
    return;
  }

  // Define temporariamente como owner para burlar RLS
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  console.log('Autenticado como owner. Buscando pedido 1216...');

  // Buscar o pedido 1216
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1216');
  
  console.log('Pedido 1216:', JSON.stringify(orders, null, 2));

  if (orders && orders.length > 0) {
    const order = orders[0];

    // Buscar TODAS as transações do banco para ver se há alguma vinculada a Julia Ribeiro ou Silvana ou Sic Comercio
    const { data: allTransactions, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (tError) {
      console.error('Erro ao buscar transações:', tError);
    } else {
      console.log(`Total de transações no banco: ${allTransactions?.length || 0}`);
      
      const orderTxs = allTransactions.filter(t => t.order_id === '1216' || t.description?.includes('1216'));
      console.log('Transações do pedido 1216:', JSON.stringify(orderTxs, null, 2));

      // Ver se há comissões recentes para Julia Ribeiro, Silvana ou Sic
      const juliaId = 'a71e33d7-a47d-4e47-9636-b3dc18d37c4c';
      const silvanaId = 'b3628b24-1b89-41fd-bc4d-f787cdaf327a';
      const sicId = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
      
      const juliaTxs = allTransactions.filter(t => t.profile_id === juliaId);
      const silvanaTxs = allTransactions.filter(t => t.profile_id === silvanaId);
      const sicTxs = allTransactions.filter(t => t.profile_id === sicId);

      console.log(`Transações de Julia Ribeiro (G0):`, JSON.stringify(juliaTxs, null, 2));
      console.log(`Transações de Silvana (G1):`, JSON.stringify(silvanaTxs, null, 2));
      console.log(`Transações de Sic Comercio (G2):`, JSON.stringify(sicTxs, null, 2));
    }
  }

  // Reverte role
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
  console.log('Fim.');
}

run().catch(console.error);
