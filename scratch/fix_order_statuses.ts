import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `debugger-fix-status-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('--- Atualizando status antigos de pedidos para "Pago" ---');
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'Pago' })
    .eq('status', 'Pago, Aguardando Retirada')
    .select('id, status');

  if (error) {
    console.error('Erro ao atualizar pedidos:', error);
  } else {
    console.log(`Atualizados ${data?.length || 0} pedidos com sucesso!`, data);
  }
}

run();
