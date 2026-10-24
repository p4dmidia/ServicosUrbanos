import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

import { businessRules } from '../src/lib/businessRules';

async function run() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const result = await businessRules.getSeguradoData(emersonId);
  console.log('Result for Emerson getSeguradoData:', JSON.stringify(result, null, 2));
}

run().catch(console.error);
