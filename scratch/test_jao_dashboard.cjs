const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

const userId = '863bb224-a6be-41c9-931a-aaf53f5e3114';

async function testJao() {
  console.log('Testing for jao:', userId);
  
  // 1. Profile
  const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log('Profile:', profile?.full_name, profile?.role, pErr);

  // 2. Microfranqueado
  const { data: mf, error: mfErr } = await supabase.from('microfranqueados').select('*').eq('profile_id', userId);
  console.log('Microfranqueado:', mf, mfErr);

  // 3. Subscriptions / Segurado
  const { data: subs, error: sErr } = await supabase.from('subscriptions').select('*').eq('profile_id', userId);
  console.log('Subscriptions:', subs, sErr);

  // 4. Licenças
  if (mf && mf.length > 0) {
    const { data: lic, error: lErr } = await supabase.from('licencas_mmn').select('*').eq('microfranqueado_id', mf[0].id);
    console.log('Licencas:', lic, lErr);
  }

  // 5. Apólices / Segurados
  const { data: seg, error: segErr } = await supabase.from('segurados_mbm').select('*').eq('profile_id', userId);
  console.log('Segurados MBM:', seg, segErr);

  // 6. Números da sorte
  const { data: sorte, error: sorteErr } = await supabase.from('numeros_sorte').select('*').eq('profile_id', userId);
  console.log('Numeros Sorte:', sorte, sorteErr);

  // 7. Orders
  const { data: orders, error: oErr } = await supabase.from('orders').select('*').eq('customer_id', userId);
  console.log('Orders:', orders, oErr);

  // 8. Transactions
  const { data: txs, error: txErr } = await supabase.from('transactions').select('*').eq('profile_id', userId);
  console.log('Transactions:', txs, txErr);
}

testJao();
