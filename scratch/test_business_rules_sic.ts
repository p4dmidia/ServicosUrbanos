import { businessRules } from '../src/lib/businessRules';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function testStats() {
  const stats = await businessRules.getAffiliateStats('194e5265-cdb6-431f-9f77-8888b1ee74ae');
  console.log('Stats for Sic Comercio:', {
    isEligible: stats.isEligible,
    activeSubscription: stats.activeSubscription,
    rank: stats.rank
  });
}

testStats();
