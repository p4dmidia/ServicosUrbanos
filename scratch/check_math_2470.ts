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

async function check() {
  const { data: config } = await supabase.from('mmn_config').select('*').single();
  const { data: levels } = await supabase.from('mmn_levels').select('*').order('level');
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: profiles } = await supabase.from('profiles').select('*');

  console.log('MMN Config:', config);
  console.log('MMN Levels:', levels);

  const emerson = profiles?.find(p => p.full_name?.toLowerCase().includes('emerson'));
  console.log('Emerson:', emerson?.id);

  // Let's see: Orders in DB:
  // Order 1293: Emerson own order -> 85
  // Order 1294: Cleide da Silva -> 45 (referred by Emerson)
  // Let's see how much 85 * 0.05 = 4.25
  // 85 * 0.12 (reseller) = 10.20
  // 85 * 0.10 (reseller mensal) = 8.50
  // 85 * 0.02 (reseller anual) = 1.70
  // 45 * 0.10 (level 1) = 4.50
  // Total of all 6 orders:
  // 85 + 85 + 45 + 25 + 85 + 45 = 370.
  // 370 * 0.06675 = 24.70! (Wait: 370 * 0.0667567 = 24.70 or something?)
  // Wait! Let's check 24.70:
  // How is 24.70 formed?
  // Let's check if 24.70 is in localStorage or DB!
}

check();
