import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-orders-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Orders Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  // Buscar pedidos com status Pago, Aguardando Retirada ou Concluído após 1º de julho de 2026
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, amount, status, order_date')
    .gte('order_date', '2026-07-01T00:00:00+00:00')
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);

  console.log(`Pedidos pagos desde 01/07/2026: ${orders?.length || 0}`);
  console.log(JSON.stringify(orders, null, 2));

  // Reverte
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
