import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Buscando informações do banco sobre os triggers...');
  
  // Como não podemos rodar SQL arbitrário diretamente, vamos tentar criar uma função temporária
  // ou consultar através de uma query via REST (não suportado)
  // Mas espera! Há alguma RPC disponível? Vamos listar os RPCs ou criar um temporariamente?
  // Espera, nós não temos acesso para criar funções via REST sem permissões de admin (anon key não permite criar funções/triggers)
  
  // Vamos rodar uma query usando a anon key para ver se conseguimos ler alguma view de sistema?
  // Geralmente pg_catalog não é exposto via PostgREST, a menos que haja um schema público ou RPC de consulta.
  
  // Vamos fazer uma consulta simples na tabela transactions para ver todas as transações criadas recentemente
  // para verificar se comissões de outros pedidos estão sendo criadas!
  const { data: latestTxs, error: txError } = await supabase
    .from('transactions')
    .select('created_at, profile_id, type, amount, status, description, order_id')
    .order('created_at', { ascending: false })
    .limit(30);
  
  if (txError) {
    console.error('Erro ao buscar transações:', txError);
    return;
  }
  
  console.log('\nÚltimas 30 transações no banco de dados:');
  console.log(JSON.stringify(latestTxs, null, 2));
}

run().catch(console.error);
