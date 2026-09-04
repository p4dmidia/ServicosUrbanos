import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  console.log('--- VERIFICANDO TABELA AFFILIATE_INVOICES ---');
  const email = `debugger-invoices-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Invoices Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: invoices, error } = await supabase
    .from('affiliate_invoices')
    .select('*');

  if (error) {
    console.error('Erro ao consultar affiliate_invoices:', error);
  } else {
    console.log(`Total de notas fiscais encontradas no banco: ${invoices?.length}`);
    invoices?.forEach(inv => {
      console.log(`- ID: ${inv.id} | Profile: ${inv.profile_id} | Mês: ${inv.reference_month} | Bruto: R$ ${inv.amount_gross} | Status: ${inv.status} | Nº: ${inv.invoice_number} | Arquivo: ${inv.file_url} | Link: ${inv.invoice_link} | Criado: ${inv.created_at}`);
    });
  }

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
