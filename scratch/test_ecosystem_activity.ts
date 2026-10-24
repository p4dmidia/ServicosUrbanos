import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve('.env') });

import { businessRules } from '../src/lib/businessRules';

async function test() {
  const anaId = 'ec35306f-b3ac-4a87-8746-a04c3b771e86';
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';

  console.log('Testing Ana Activity:');
  const anaActivity = await businessRules.getEcosystemActivity(anaId);
  console.log('Ana activity count:', anaActivity.length);
  anaActivity.forEach(a => console.log('Ana:', a.description, '| Level:', a.level, '| Amount:', a.amount, '| Buyer:', a.affiliateName));

  console.log('Testing Emerson Activity:');
  const emersonActivity = await businessRules.getEcosystemActivity(emersonId);
  console.log('Emerson activity count:', emersonActivity.length);
  emersonActivity.forEach(a => console.log('Emerson:', a.description, '| Level:', a.level, '| Amount:', a.amount, '| Buyer:', a.affiliateName));
}

test();
