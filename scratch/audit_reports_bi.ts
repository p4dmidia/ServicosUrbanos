import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function runAudit() {
  console.log('--- AUDITING BI REPORT (01/09/2026 a 10/09/2026) ---');
  const startDateStr = '2026-09-01';
  const endDateStr = '2026-09-10';

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  // 1. Orders
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']);
  
  const filteredOrders = orders?.filter(o => {
    const d = new Date(o.order_date || o.created_at);
    return d >= start && d <= end;
  }) || [];

  const totalGMV = filteredOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  console.log('Total orders in DB:', orders?.length);
  console.log('Filtered orders in range (01/09 a 10/09):', filteredOrders.length);
  console.log('Total GMV in range:', totalGMV);
  filteredOrders.forEach(o => console.log(` - Order #${o.id}: R$ ${o.amount}, status: ${o.status}, date: ${o.order_date || o.created_at}`));

  // 2. Profiles (User Growth)
  const { data: profiles, count: profilesCount } = await supabase
    .from('profiles')
    .select('id, full_name, created_at', { count: 'exact' })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  console.log('User growth count in range:', profilesCount);

  // 3. Transactions (Commissions)
  const { data: commissions } = await supabase
    .from('transactions')
    .select('id, amount, description, order_id, created_at, type')
    .eq('type', 'commission')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  
  const totalCommissions = commissions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
  console.log('Commissions count in range:', commissions?.length);
  console.log('Total Commissions in range (R$):', totalCommissions);
  commissions?.forEach(t => console.log(` - Commission Tx #${t.id}: R$ ${t.amount}, desc: ${t.description}, order: ${t.order_id}`));

  // 4. MMN Config and Levels
  const { data: mmnConfig } = await supabase.from('mmn_config').select('*').single();
  const { data: mmnLevels } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('MMN Config:', JSON.stringify(mmnConfig, null, 2));
  console.log('MMN Levels:', JSON.stringify(mmnLevels, null, 2));

  // 5. Marketplace Config
  const { data: mktConfig } = await supabase.from('marketplace_config').select('*').single();
  console.log('Marketplace Config:', JSON.stringify(mktConfig, null, 2));
}

runAudit();
