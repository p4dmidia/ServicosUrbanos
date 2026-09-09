import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function main() {
  const email = `debugger-tx-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

  const history = await businessRules.getPaymentHistory();
  console.log(`Total history records: ${history.length}`);
  for (const h of history) {
    console.log({
      userName: h.userName,
      cpf: h.cpf,
      isPJ: h.isPJ,
      cycle: h.cycleLabel,
      bruto: h.bruto,
      inss: h.inss,
      irrf: h.irrf,
      liquido: h.liquido
    });
  }

  // Cleanup
  await supabase.from('profiles').delete().eq('id', userId);
}

main();
