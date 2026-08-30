import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-trigger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Trigger Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) {
    console.error('Falha na autenticação');
    return;
  }

  // Configura como owner para ter acesso total via RLS
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  // 1. Limpar transações anteriores do pedido 1216 se houver (para garantir teste limpo)
  await supabase.from('transactions').delete().eq('order_id', '1216');

  // 2. Buscar o pedido atual
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1216')
    .single();

  if (!order) {
    console.error('Pedido 1216 não encontrado');
    return;
  }

  console.log(`Pedido encontrado. Status atual: ${order.status}`);

  // 3. Mudar status para 'Pendente' para simularmos a transição de status de volta para 'Pago, Aguardando Retirada'
  console.log('Atualizando status para Pendente...');
  const { error: err1 } = await supabase
    .from('orders')
    .update({ status: 'Pendente' })
    .eq('id', '1216');
  
  if (err1) {
    console.error('Erro ao atualizar para Pendente:', err1);
    return;
  }

  // 4. Mudar status para 'Pago, Aguardando Retirada' para disparar o trigger
  console.log('Atualizando status para Pago, Aguardando Retirada...');
  const { data: updatedOrder, error: err2 } = await supabase
    .from('orders')
    .update({ status: 'Pago, Aguardando Retirada' })
    .eq('id', '1216')
    .select();

  if (err2) {
    console.error('ERRO AO SIMULAR DISPARO DO TRIGGER:', err2);
  } else {
    console.log('Status atualizado com sucesso! Verificando transações geradas...');
    
    // 5. Verificar transações
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', '1216');
    
    console.log('Transações geradas:', JSON.stringify(txs, null, 2));
  }

  // Limpeza
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
  console.log('Concluído.');
}

run().catch(console.error);
