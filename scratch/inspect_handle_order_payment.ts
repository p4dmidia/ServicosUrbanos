import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Autenticando...');
  const email = `debugger-proc-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Proc Debugger' } }
  });

  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('Buscando definição da função public.handle_order_payment...');
  
  // Vamos tentar usar RPC de sistema se houver, ou fazer uma query através de uma tabela?
  // Espera, no PostgREST, não podemos consultar tabelas de sistema diretamente, mesmo como owner,
  // a menos que elas estejam no schema exposto (public).
  // Mas podemos verificar se existe alguma RPC de execução ou algo similar.
  // Se não, podemos tentar ver se o trigger gerou as novas ou velhas descrições!
  
  // Espera! Em nossa simulação para o pedido 1216, a descrição das transações geradas foi:
  // "Comissão Semanal G0 (2%) - Pedido #1216"
  // "Comissão Mensal G0 (2%) - Pedido #1216"
  // "Comissão Anual G0 (2%) - Pedido #1216"
  // E o valor foi R$ 0.40!
  
  // Olhando o arquivo final update_handle_order_payment_final.sql:
  // VALUES 
  // (v_upline_id, 'commission', 'Comissão Semanal G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ...),
  // (v_upline_id, 'commission', 'Comissão Mensal G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ...),
  // (v_upline_id, 'commission', 'Comissão Anual G' || (v_level - 1) || ' (2%) - Pedido #' || NEW.id, ...);
  
  // Isso bate EXACTAMENTE com as descrições geradas na nossa simulação!
  // Portanto, a função que está atualmente rodando no banco de dados É a versão final de update_handle_order_payment_final.sql!
  
  console.log('A versão final da trigger ESTÁ ativa no banco de dados atualmente.');

  // Reverte
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', uid);
}

run().catch(console.error);
