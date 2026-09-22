import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Checking profiles with missing reseller_id ---');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by, reseller_id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const missing = profiles.filter(p => !p.reseller_id);
  console.log(`Found ${missing.length} profiles without reseller_id out of ${profiles.length}:`, missing);

  // For any regional_reseller, reseller_id should be their own id
  for (const p of profiles) {
    if (p.role === 'regional_reseller' && !p.reseller_id) {
      console.log(`Fixing reseller_id for regional reseller ${p.full_name}...`);
      await supabase.from('profiles').update({ reseller_id: p.id }).eq('id', p.id);
    }
  }

  // Also check orders with missing reseller_id
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, reseller_id, status');

  const ordersMissing = orders?.filter(o => !o.reseller_id) || [];
  console.log(`Found ${ordersMissing.length} orders without reseller_id:`, ordersMissing);

  for (const o of ordersMissing) {
    const prof = profiles.find(p => p.id === o.customer_id);
    const targetResellerId = prof?.reseller_id || (prof?.role === 'regional_reseller' ? prof.id : null);
    if (targetResellerId) {
      console.log(`Fixing order #${o.id} with reseller_id ${targetResellerId}...`);
      await supabase.from('orders').update({ reseller_id: targetResellerId }).eq('id', o.id);
    }
  }
}

main().catch(console.error);
