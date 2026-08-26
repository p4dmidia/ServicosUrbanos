import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'jose@gmail.com';
  const password = '12345678';
  
  console.log(`Authenticating as: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error("Authentication failed:", authError.message);
    return;
  }

  const profileId = authData.user.id;
  console.log(`Successfully authenticated! Profile ID = ${profileId}`);

  // Check if subscription exists
  const { data: sub, error: sError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', profileId)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sError) {
    console.error("Error checking subscription:", sError.message);
    return;
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // active for 1 year

  if (sub) {
    console.log(`Updating existing subscription ID=${sub.id}...`);
    const { error: uError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: 'mensal',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: 21
      })
      .eq('id', sub.id);

    if (uError) {
      console.error("Error updating subscription:", uError.message);
    } else {
      console.log(`Subscription successfully activated/renewed for ${email}!`);
    }
  } else {
    console.log(`Creating new active subscription...`);
    const { error: iError } = await supabase
      .from('subscriptions')
      .insert([{
        profile_id: profileId,
        plan_type: 'mensal',
        amount: 21,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }]);

    if (iError) {
      console.error("Error inserting subscription:", iError.message);
    } else {
      console.log(`New active subscription successfully created and activated for ${email}!`);
    }
  }
}

run().catch(console.error);
