import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debug9685() {
  const email = `debugger-9685-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  const { data: order } = await supabase.from('orders').select('*').eq('id', '9685').single();
  console.log('Order 9685:', order);

  const { data: customer } = await supabase.from('profiles').select('*').eq('id', order.customer_id).single();
  console.log('Customer profile:', customer);

  const { data: reseller } = await supabase.from('profiles').select('*').eq('id', order.reseller_id).single();
  console.log('Reseller profile:', reseller);

  // Let's test updating status to 'Concluído'
  const { error: errConcluido } = await supabase.from('orders').update({ status: 'Concluído' }).eq('id', '9685');
  console.log('Update to Concluído:', errConcluido);

  // Let's test updating status to 'Pago, Aguardando Retirada'
  const { error: errPagoRetirada } = await supabase.from('orders').update({ status: 'Pago, Aguardando Retirada' }).eq('id', '9685');
  console.log('Update to Pago, Aguardando Retirada:', errPagoRetirada);

  // Let's test updating status to 'Pago'
  const { error: errPago } = await supabase.from('orders').update({ status: 'Pago' }).eq('id', '9685');
  console.log('Update to Pago:', errPago);
}

debug9685();
