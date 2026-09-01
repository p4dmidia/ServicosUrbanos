import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkConstraint() {
  const email = `debugger-constraint-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (uid) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);
  }

  // Let's test which statuses work:
  // e.g., 'Pago, Aguardando Retirada', 'Concluído', 'Aguardando Pagamento', 'Cancelado', 'Pago'
  const statusesToTest = [
    'Pago, Aguardando Retirada',
    'Concluído',
    'Aguardando Pagamento',
    'Cancelado',
    'Pago',
    'Processando',
    'Entregue'
  ];

  for (const st of statusesToTest) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: st })
      .eq('id', 1223)
      .select();
    console.log(`Status "${st}" result:`, error ? error.message : 'SUCCESS!');
  }
}

checkConstraint();
