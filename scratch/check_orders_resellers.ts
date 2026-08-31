import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `debugger-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  console.log("=== Querying pending orders and their regional reseller ===");
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, branch_id')
    .eq('payout_status', 'pending');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by');

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  function findRegionalReseller(customerId: string): any {
    let current = profileMap.get(customerId);
    let depth = 0;
    while (current && current.referred_by && depth < 10) {
      const parent = profileMap.get(current.referred_by);
      if (parent) {
        if (parent.role === 'regional_reseller') {
          return parent;
        }
        current = parent;
      } else {
        break;
      }
      depth++;
    }
    return null;
  }

  for (const o of orders || []) {
    const regional = findRegionalReseller(o.customer_id);
    console.log(`Order: #${o.id} | Buyer: ${o.customer_name} | Branch ID: ${o.branch_id} | Regional Reseller: ${regional ? regional.full_name : 'None'}`);
  }

  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
