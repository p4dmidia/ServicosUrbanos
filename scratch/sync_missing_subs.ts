import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionRepasseCycle } from '../src/lib/businessRules';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function syncSubscriptionsFromOrders() {
  console.log('--- SINCRONIZANDO ASSINATURAS A PARTIR DOS PEDIDOS PAGOS ---');
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada']);

  for (const o of paidOrders || []) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const item of items) {
      if (item.is_subscription) {
        const planType = item.plan_type || 'anual';
        const orderDate = o.order_date || o.created_at;
        const cycle = calculateSubscriptionRepasseCycle(orderDate, planType);
        
        // Verifica se já existe assinatura ativa
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('profile_id', o.customer_id)
          .eq('status', 'active');

        if (!existing || existing.length === 0) {
          console.log(`Criando assinatura ativa para perfil ${o.customer_id} (Plano ${planType})...`);
          const { error: insErr } = await supabase.from('subscriptions').insert([{
            profile_id: o.customer_id,
            plan_type: planType,
            amount: item.price || o.amount,
            status: 'active',
            start_date: orderDate,
            end_date: cycle.cycleEndDate.toISOString()
          }]);
          console.log('Resultado inserção:', insErr || 'Sucesso!');

          // Atualiza o perfil para 'active'
          await supabase.from('profiles').update({ status: 'active' }).eq('id', o.customer_id);
        }
      }
    }
  }

  const { data: finalSubs } = await supabase.from('subscriptions').select('*');
  console.log('\nAssinaturas finais no banco:', finalSubs);
}

syncSubscriptionsFromOrders();
