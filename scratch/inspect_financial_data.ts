import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { businessRules } from '../src/lib/businessRules';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables missing!');
  process.exit(1);
}

async function run() {
  console.log('=== TESTING BUSINESS RULES MERCHANT ORDERS ===');
  
  // 1. Log in
  const { data: signInData, error: signInError } = await createClient(supabaseUrl, supabaseKey).auth.signInWithPassword({
    email: 'admin@p4d.com.br', // Using admin credentials or custom
    password: 'Password123!'
  });
  
  const mId = 'matriz'; // Or fetch using profile
  const orders = await businessRules.getMerchantOrders(mId);
  console.log('Merchant Orders count:', orders.length);
  console.log('First 5 orders with payoutStatus:', JSON.stringify(orders.slice(0, 5), null, 2));
}

run().catch(console.error);
