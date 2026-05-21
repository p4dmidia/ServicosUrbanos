import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Testing Order #1039 Upline Chain ---');
  
  // Fetch order #1039
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', '1039')
    .single();

  if (orderError) {
    console.error('Error fetching order 1039:', orderError.message);
    return;
  }
  
  console.log('Order 1039 detail:', order);

  // Check customer profile and uplines
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, referred_by')
    .eq('id', order.customer_id)
    .single();

  if (profileError) {
    console.error('Error fetching customer profile:', profileError.message);
  } else {
    console.log(`Customer: "${profile.full_name}" (ID: ${profile.id}, Referred by: ${profile.referred_by})`);
    
    // Call get_upline_chain RPC
    const { data: chain, error: chainError } = await supabase
      .rpc('get_upline_chain', { user_id: order.customer_id, max_depth: 6 });
      
    if (chainError) {
      console.error('get_upline_chain RPC Error:', chainError.message);
    } else {
      console.log('Upline chain:', chain);
    }
  }
}

run().catch(console.error);
