import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

async function run() {
  const url = `${supabaseUrl}/functions/v1/manage-merchant-team`;
  console.log('Sending request to:', url);
  
  const payload = {
    mode: 'update',
    userId: 'b3628b24-1b89-41fd-bc4d-f787cdaf327a', // sjo16061973@gmail.com
    name: 'Gerente Filial',
    branchId: 'c0435885-23e3-48f1-b25b-5255e622501f', // Teste 1 - Bruno Gonçalves
    merchantId: '194e5265-cdb6-431f-9f77-8888b1ee74ae', // Owner
    commissionRate: 5,
    password: 'GerentePassword123!'
  };

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey || '',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log('Response Status:', response.status);
  console.log('Response Text:', text);
}

run().catch(console.error);
