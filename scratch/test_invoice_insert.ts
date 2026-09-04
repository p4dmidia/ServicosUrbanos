import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  console.log('--- TESTANDO INSERÇÃO NA TABELA AFFILIATE_INVOICES ---');
  const email = `debugger-test-inv-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Test Invoice User' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  const userId = signUpData?.user?.id;
  if (!userId) return;

  const payload = {
    profile_id: userId,
    reference_month: '2026-09',
    amount_gross: 1500,
    invoice_number: '123456',
    invoice_link: 'https://exemplo.com/nf-123456.pdf',
    file_url: null,
    notes: 'Nota fiscal de teste',
    status: 'pending'
  };

  const { data: inserted, error } = await supabase
    .from('affiliate_invoices')
    .insert([payload])
    .select();

  console.log('Resultado do insert como usuário comum autenticado:', error ? error : inserted);

  // Agora vamos testar ler como owner / admin
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  const { data: readAdmin, error: readErr } = await supabase
    .from('affiliate_invoices')
    .select('*');

  console.log('Leitura como admin:', readErr ? readErr : readAdmin);

  // Limpeza
  await supabase.from('affiliate_invoices').delete().eq('profile_id', userId);
  await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
}

run().catch(console.error);
