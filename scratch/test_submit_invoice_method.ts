import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function run() {
  console.log('--- TESTANDO SUBMIT E GET AFFILIATE INVOICE VIA BUSINESSRULES ---');
  const email = `debugger-test-submit-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Submit Tester' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  const userId = signUpData?.user?.id;
  if (!userId) return;

  const result = await businessRules.submitAffiliateInvoice({
    profile_id: userId,
    reference_month: '2026-09',
    amount_gross: 2500,
    invoice_number: '998877',
    invoice_link: 'https://exemplo.com/nf-998877.pdf'
  });

  console.log('Resultado do submitAffiliateInvoice:', result);

  // Agora vamos buscar as notas usando getAffiliateInvoices
  const invoices = await businessRules.getAffiliateInvoices(userId, '2026-09');
  console.log('Resultado do getAffiliateInvoices:', invoices);

  // Limpeza
  await supabase.from('affiliate_invoices').delete().eq('profile_id', userId);
  console.log('Teste concluído com sucesso!');
}

run().catch(console.error);
