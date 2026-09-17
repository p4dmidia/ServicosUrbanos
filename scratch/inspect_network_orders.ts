import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const emerson = profiles?.find(p => p.full_name?.toLowerCase().includes('emerson'));
  console.log('Emerson ID:', emerson?.id);

  // find who was referred by Emerson or who referred Emerson
  console.log('Emerson profile:', emerson);

  const { data: orders } = await supabase.from('orders').select('*');
  console.log('Orders:');
  orders?.forEach(o => {
    const buyer = profiles?.find(p => p.id === o.customer_id);
    console.log(`Order #${o.id}: amount=${o.amount}, customer=${o.customer_name} (${buyer?.email}), referred_by=${buyer?.referred_by}, status=${o.status}`);
  });
}

run();
