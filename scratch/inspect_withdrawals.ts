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

  const { data, error } = await supabase
    .from('transactions')
    .select('id, profile_id, amount, type, description, created_at, profiles:profile_id(id, full_name, cpf, cnpj)')
    .eq('type', 'withdrawal')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log('Transactions found:', data?.length);
  for (const t of (data || [])) {
    console.log({
      id: t.id,
      amount: t.amount,
      desc: t.description,
      name: (t as any).profiles?.full_name,
      cpf: (t as any).profiles?.cpf || (t as any).profiles?.cnpj
    });
  }

  // Cleanup test user
  await supabase.from('profiles').delete().eq('id', userId);
}

main();
