import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('Total profiles:', profiles?.length);
  const emerson = profiles?.find(p => p.full_name?.toLowerCase().includes('emerson'));
  console.log('Emerson profile:', emerson ? { id: emerson.id, name: emerson.full_name, cpf: emerson.cpf } : 'Not found');

  if (emerson) {
    const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', emerson.id);
    console.log('Transactions for Emerson:', txs);
    
    const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', emerson.id);
    console.log('Orders where Emerson is customer:', orders);
  }

  const { data: allTxs } = await supabase.from('transactions').select('*');
  console.log('All transactions in DB:', allTxs?.length);
  allTxs?.forEach(t => console.log('Tx:', t.id, t.profile_id, t.type, t.amount, t.description, t.created_at));

  const { data: allOrders } = await supabase.from('orders').select('*');
  console.log('All orders in DB:', allOrders?.length);
  allOrders?.forEach(o => console.log('Order:', o.id, o.customer_name, o.customer_id, o.amount, o.created_at));
}

inspect();
