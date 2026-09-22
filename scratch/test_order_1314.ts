import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Fetching order 1314 ---');
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .or('id.eq.1314,id.ilike.%1314%');
  
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  console.log('Orders found:', JSON.stringify(orders, null, 2));

  if (orders && orders.length > 0) {
    const order = orders[0];
    console.log('\n--- Checking user profile for customer_id:', order.customer_id);
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.customer_id);
    console.log('Profile:', profile, profErr);

    console.log('\n--- Simulating update status to Concluído for order id:', order.id);
    const { data: updateData, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'Concluído' })
      .eq('id', order.id)
      .select();
    
    console.log('Update result:', updateData);
    console.error('Update error (full details):', JSON.stringify(updateErr, null, 2));
  }
}

main();
