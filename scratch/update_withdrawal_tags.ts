import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = `debugger-tx-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  // 1. Silvio Gonçalves (id: 1316)
  // Bruto: 10000.00, INSS: 932.31, IRRF: 1597.61, Líquido: 7470.08
  const { error: err1 } = await supabase
    .from('transactions')
    .update({
      description: 'Pagamento Cashback Rede Digital (Líq. R$ 7.470,08 | INSS: -R$ 932,31 | IRRF: -R$ 1.597,61) [BRUTO:10000.00] [INSS:932.31] [IRRF:1597.61] [LIQ:7470.08] - setembro de 2026'
    })
    .eq('id', 1316);
  console.log('Update 1316 (Silvio):', err1 || 'SUCCESS');

  // 2. Emerson Mines Antunes (id: 1267, 1266)
  // Bruto: 20.00, INSS: 2.20, IRRF: 0.00, Líquido: 17.80
  const { error: err2 } = await supabase
    .from('transactions')
    .update({
      description: 'Pagamento Cashback Rede Mensal (Líq. R$ 17,80 | INSS: -R$ 2,20 | IRRF: R$ 0,00) [BRUTO:20.00] [INSS:2.20] [IRRF:0.00] [LIQ:17.80] - setembro de 2026'
    })
    .eq('id', 1267);
  console.log('Update 1267 (Emerson Mensal):', err2 || 'SUCCESS');

  const { error: err3 } = await supabase
    .from('transactions')
    .update({
      description: 'Pagamento Cashback Rede Digital (Líq. R$ 17,80 | INSS: -R$ 2,20 | IRRF: R$ 0,00) [BRUTO:20.00] [INSS:2.20] [IRRF:0.00] [LIQ:17.80] - setembro de 2026'
    })
    .eq('id', 1266);
  console.log('Update 1266 (Emerson Digital):', err3 || 'SUCCESS');

  // 3. Serviços Urbanos Tecnologia Ltda. (id: 1265, 1264)
  // Bruto: 20.00, INSS: 0.00, IRRF: 0.00, Líquido: 20.00 (PJ Isento)
  const { error: err4 } = await supabase
    .from('transactions')
    .update({
      description: 'Pagamento Cashback Rede Mensal (PJ Isento) [BRUTO:20.00] [INSS:0.00] [IRRF:0.00] [LIQ:20.00] - setembro de 2026'
    })
    .eq('id', 1265);
  console.log('Update 1265 (PJ Mensal):', err4 || 'SUCCESS');

  const { error: err5 } = await supabase
    .from('transactions')
    .update({
      description: 'Pagamento Cashback Rede Digital (PJ Isento) [BRUTO:20.00] [INSS:0.00] [IRRF:0.00] [LIQ:20.00] - setembro de 2026'
    })
    .eq('id', 1264);
  console.log('Update 1264 (PJ Digital):', err5 || 'SUCCESS');

  // Cleanup test user
  await supabase.from('profiles').delete().eq('id', userId);
}

main();
