import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve('.env') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  const anaId = 'ec35306f-b3ac-4a87-8746-a04c3b771e86';

  // 1. Fetch active MFs
  const { data: mfList } = await supabase
    .from('microfranqueados')
    .select('profile_id, status')
    .eq('status', 'ativo');
  
  const mfSet = new Set(mfList?.map(m => m.profile_id) || []);
  console.log('Active MF profile IDs in DB:', Array.from(mfSet));

  // Check Emerson's downlines
  const { data: emersonDownlines } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by')
    .eq('referred_by', emersonId);
  console.log('Emerson direct downlines in profiles:', emersonDownlines?.map(p => ({
    name: p.full_name,
    isMF: mfSet.has(p.id)
  })));

  // Check Ana's downlines
  const { data: anaDownlines } = await supabase
    .from('profiles')
    .select('id, full_name, role, referred_by')
    .eq('referred_by', anaId);
  console.log('Ana direct downlines in profiles:', anaDownlines?.map(p => ({
    name: p.full_name,
    isMF: mfSet.has(p.id)
  })));
}

test();
