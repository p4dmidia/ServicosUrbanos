import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve('.env') });

import { businessRules } from '../src/lib/businessRules';

async function test() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const anaId = 'ec35306f-b3ac-4a87-8746-a04c3b771e86';

  console.log('=== Emerson Network ===');
  const emersonNet = await businessRules.getAffiliateNetwork(emersonId);
  console.log('Emerson MMN members count:', emersonNet.length);
  emersonNet.forEach(m => console.log(`- ${m.name} | Level: G${m.level} | Status: ${m.status}`));

  const emersonSummary = await businessRules.getNetworkSummary(emersonId);
  console.log('Emerson summary:', emersonSummary);

  console.log('\n=== Ana Lisboa Network ===');
  const anaNet = await businessRules.getAffiliateNetwork(anaId);
  console.log('Ana MMN members count:', anaNet.length);
  anaNet.forEach(m => console.log(`- ${m.name} | Level: G${m.level} | Status: ${m.status}`));

  const anaSummary = await businessRules.getNetworkSummary(anaId);
  console.log('Ana summary:', anaSummary);
}

test();
