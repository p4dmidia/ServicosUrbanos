import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting subscriptions synchronization from paid orders...");
  
  // 1. Buscar todos os pedidos pagos ou concluídos
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, status, items, order_date, created_at')
    .in('status', ['Pago, Aguardando Retirada', 'Concluído']);

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return;
  }

  console.log(`Found ${orders?.length} paid/completed orders.`);

  // 2. Buscar assinaturas existentes para evitar duplicados
  const { data: existingSubs, error: subsError } = await supabase
    .from('subscriptions')
    .select('profile_id, plan_type, status, end_date');

  if (subsError) {
    console.error("Error fetching subscriptions:", subsError);
    return;
  }

  const existingMap = new Set(existingSubs?.map(s => `${s.profile_id}-${s.plan_type}`) || []);

  const inserted = [];

  for (const order of (orders || [])) {
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const isSub = item.is_subscription === true || item.is_subscription === 'true';
      if (isSub && item.plan_type) {
        const key = `${order.customer_id}-${item.plan_type}`;
        
        // Se a assinatura já existir no banco, pulamos
        if (existingMap.has(key)) {
          console.log(`Subscription for user ${order.customer_name} (${item.plan_type}) already exists. Skipping.`);
          continue;
        }

        console.log(`Creating active subscription for user ${order.customer_name} from Order #${order.id}...`);
        
        const startDate = new Date(order.order_date || order.created_at || new Date());
        let days = 30;
        if (item.plan_type === 'trimestral') days = 90;
        else if (item.plan_type === 'semestral') days = 180;
        else if (item.plan_type === 'anual') days = 365;

        const endDate = new Date(startDate.getTime());
        endDate.setDate(endDate.getDate() + days);

        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert([{
            profile_id: order.customer_id,
            plan_type: item.plan_type,
            amount: Number(item.price || 0),
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }])
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to insert subscription for ${order.customer_name}:`, insertError.message);
        } else {
          console.log(`Successfully created subscription ID ${newSub.id} for ${order.customer_name}.`);
          inserted.push(newSub);
        }
      }
    }
  }

  console.log(`Done! Created ${inserted.length} missing subscriptions in the database.`);
}

run().catch(console.error);
