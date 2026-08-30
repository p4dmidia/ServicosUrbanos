import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Buscando pedido contendo 1216 ou Anselmo...');
  
  // Buscar o pedido 1216
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .select('*')
    .or('id.eq.1216,customer_name.ilike.%Anselmo%,id.ilike.%1216%');
  
  if (oError) {
    console.error('Erro ao buscar pedidos:', oError);
    return;
  }

  console.log(`Pedidos encontrados: ${orders?.length || 0}`);
  console.log(JSON.stringify(orders, null, 2));

  if (orders && orders.length > 0) {
    const order = orders[0];
    const customerId = order.customer_id;
    
    // Buscar perfil do comprador
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();
    
    console.log('\nPerfil do Comprador:', JSON.stringify(profile, null, 2));

    // Buscar patrocinadores (cadeia de upline)
    if (profile && profile.referred_by) {
      console.log('\nCadeia de Patrocinadores:');
      let currentId = profile.referred_by;
      let depth = 1;
      while (currentId && depth <= 5) {
        const { data: upline } = await supabase
          .from('profiles')
          .select('id, full_name, role, referred_by')
          .eq('id', currentId)
          .single();
        if (upline) {
          console.log(`  Nível ${depth}: ${upline.full_name} (${upline.role}) - ID: ${upline.id}`);
          currentId = upline.referred_by;
          depth++;
        } else {
          break;
        }
      }
    }

    // Buscar transações relacionadas ao pedido
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', order.id);
    
    if (tError) {
      console.error('Erro ao buscar transações por order_id:', tError);
    } else {
      console.log(`\nTransações encontradas com order_id = ${order.id}:`, JSON.stringify(transactions, null, 2));
    }

    // Buscar transações por descrição
    const { data: transactionsDesc } = await supabase
      .from('transactions')
      .select('*')
      .like('description', `%${order.id}%`);
    console.log(`\nTransações encontradas com descrição contendo "${order.id}":`, JSON.stringify(transactionsDesc, null, 2));
  }
}

run().catch(console.error);
