import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const ownerId = '0b371ab1-c751-42ff-ade4-2071ccd7cb24';

  // 1. getBranches
  const { data: branches, error: bError } = await supabase
    .from('branches')
    .select('*')
    .eq('merchant_id', ownerId);

  const branchIds = branches?.map(b => b.id) || [];
  console.log('Branch IDs:', branchIds);

  // 2. getMerchantTeam
  const { data: team, error: tError } = await supabase
    .from('profiles')
    .select('*')
    .in('branch_id', branchIds)
    .order('full_name');

  console.log('Team members loaded:', team?.map(t => ({ name: t.full_name, branchId: t.branch_id, role: t.role, commission: t.commission_rate })));

  // 3. getMerchantOrders
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .select('*')
    .or(`branch_id.in.(${branchIds.join(',')}),branch_id.is.null`);

  console.log('Orders loaded count:', orders?.length);

  // Check matching manager for each order
  orders?.forEach(o => {
    const manager = team?.find(m => m.branch_id === o.branch_id && m.role === 'manager');
    console.log(`Order #${o.id}: branch_id=${o.branch_id}, manager found=${manager ? manager.full_name : 'NONE'}, commission_rate=${manager ? manager.commission_rate : 0}`);
  });
}

check();
