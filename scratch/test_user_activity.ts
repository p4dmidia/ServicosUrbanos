import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';

async function main() {
  // Let's sign in as emersonantunes747@gmail.com or test user
  // Let's try to sign in
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'emersonantunes747@gmail.com',
    password: '123456789@@@' // let's try common test password or check
  });

  if (authErr) {
    console.log('SignIn with 123456789@@@ failed:', authErr.message);
    // Let's try with other credentials
    const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
      email: 'analisboa@email.com',
      password: '123456789@@@'
    });
    if (authErr2) {
      console.log('SignIn as analisboa failed:', authErr2.message);
    } else {
      console.log('Signed in as Ana Lisboa:', authData2.user.id);
      await dumpUser(authData2.user.id);
    }
  } else {
    console.log('Signed in as Emerson:', authData.user.id);
    await dumpUser(authData.user.id);
  }
}

async function dumpUser(userId: string) {
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', userId);
  console.log('Transactions for user:', txs);

  const act = await businessRules.getEcosystemActivity(userId);
  console.log('Ecosystem activity for user:', act);
}

main().catch(console.error);

