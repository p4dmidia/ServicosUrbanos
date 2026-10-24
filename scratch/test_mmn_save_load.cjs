const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  console.log('Testing MMN config and levels retrieval...');
  const { data: config, error: cErr } = await supabase.from('mmn_config').select('*').single();
  console.log('mmn_config:', config, cErr);

  const { data: levels, error: lErr } = await supabase.from('mmn_levels').select('*').order('level');
  console.log('mmn_levels:', levels, lErr);

  // Test computing totals
  const depth = config.depth;
  const active = levels.filter(l => l.level <= depth);
  const sem = active.reduce((s, l) => s + Number(l.cashback_semanal || 0), 0);
  const anu = active.reduce((s, l) => s + Number(l.cashback_anual || 0), 0);
  const tot = sem + anu;
  const margin = 100 - tot;

  console.log('\n--- CALCULATED TOTALS ---');
  console.log('Profundidade da Rede:', depth, `(G0 a G${depth - 1})`);
  console.log('Total Cashback Semanal:', `${sem}%`, `(R$ ${(48 * sem / 100).toFixed(2)})`);
  console.log('Total Cashback Anual:', `${anu}%`, `(R$ ${(48 * anu / 100).toFixed(2)})`);
  console.log('Total MMN Distribuído:', `${tot}%`, `(R$ ${(48 * tot / 100).toFixed(2)})`);
  console.log('Margem Empresa Retida:', `${margin}%`, `(R$ ${(48 * margin / 100).toFixed(2)})`);
}

test();
