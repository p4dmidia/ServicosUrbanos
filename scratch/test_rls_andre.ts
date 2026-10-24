import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
import { businessRules } from '../src/lib/businessRules';

async function test() {
  const u1 = 'e7ea0ff7-454e-4e68-942c-71c4ec6ce4aa';
  
  // Without login (anon)
  const rAnon = await businessRules.getSeguradoData(u1);
  console.log('Anon result for Andre:', rAnon?.isPolicyActive);

  // Now let's see what anon query to subscriptions returns:
  const { data: subAnon, error: errAnon } = await supabase.from('subscriptions').select('*').eq('profile_id', u1);
  console.log('subAnon:', subAnon, 'errAnon:', errAnon);
}

test().catch(console.error);
