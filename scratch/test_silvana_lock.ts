import * as dotenv from 'dotenv';
dotenv.config();

import { businessRules } from '../src/lib/businessRules';
import { supabase } from '../src/lib/supabase';

async function test() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%silvana%')
    .maybeSingle();

  console.log("Silvana profile:", profile?.id, profile?.full_name);

  if (!profile) return;

  const rpaStatus = await businessRules.checkAffiliateRPALockStatus(profile.id);
  console.log("RPALock status result:", rpaStatus);
}

test().catch(console.error);
