const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role');
  console.log(`Found ${profiles.length} profiles.`);

  for (const p of profiles) {
    console.log(`\nChecking profile: ${p.full_name} (${p.email}) - ID: ${p.id} - Role: ${p.role}`);
    
    // microfranqueados
    const { data: mf, error: mfErr } = await supabase.from('microfranqueados').select('*').eq('profile_id', p.id);
    if (mfErr) console.error('  mfErr:', mfErr);

    // subscriptions
    const { data: subs, error: subErr } = await supabase.from('subscriptions').select('*').eq('profile_id', p.id);
    if (subErr) console.error('  subErr:', subErr);

    // orders
    const { data: ord, error: ordErr } = await supabase.from('orders').select('*').eq('customer_id', p.id);
    if (ordErr) console.error('  ordErr:', ordErr);

    // transactions
    const { data: txs, error: txErr } = await supabase.from('transactions').select('*').eq('profile_id', p.id);
    if (txErr) console.error('  txErr:', txErr);
  }
}

check();
