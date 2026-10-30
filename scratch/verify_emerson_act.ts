import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'admin_exec_1792691526579@test.com',
    password: 'SuperDebugPassword123!'
  });

  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const act = await businessRules.getEcosystemActivity(emersonId);

  console.log('=== Emerson Activity ===');
  console.table(act.map(a => ({
    orderId: a.orderId,
    affiliateName: a.affiliateName,
    cashbackType: a.cashbackType,
    level: a.level,
    amount: a.amount,
    status: a.status
  })));
}

main().catch(console.error);

