import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Import businessRules logic directly to see what fails
import { businessRules } from '../src/lib/businessRules';

const jaoId = '863bb224-a6be-41c9-931a-aaf53f5e3114';

async function run() {
  console.log('Testing businessRules for jao...');
  try {
    const statsData = await businessRules.getAffiliateStats(jaoId);
    console.log('statsData:', statsData);

    const activityData = await businessRules.getEcosystemActivity(jaoId);
    console.log('activityData:', activityData);

    const rpaStatus = await businessRules.checkAffiliateRPALockStatus(jaoId);
    console.log('rpaStatus:', rpaStatus);

    const mfRes = await businessRules.getMicrofranqueadoData(jaoId);
    console.log('mfRes:', mfRes);

    const segRes = await businessRules.getSeguradoData(jaoId);
    console.log('segRes:', segRes);

    const pjReq = await businessRules.checkMicrofranqueadoPjRequirement(jaoId);
    console.log('pjReq:', pjReq);
  } catch (e) {
    console.error('CRASH IN BUSINESS RULES:', e);
  }
}

run();
