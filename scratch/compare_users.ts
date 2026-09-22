import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const userIds = [
    { name: 'Emerson', id: 'a00a6bab-5720-4632-a0db-3604b3a9e258' },
    { name: 'Ruana (1306)', id: '32ef3eed-463d-449c-b4ee-c8d331920c14' },
    { name: 'Antonio (1310)', id: '6d0d6163-658a-45fd-9620-9dfa65363680' },
    { name: 'Jose Ribeiro (1315)', id: '01348b59-4fbc-4608-b0a8-1b0b4805d4e2' }
  ];

  for (const u of userIds) {
    console.log(`\n=== Profile for ${u.name} (${u.id}) ===`);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    console.log(p);

    console.log(`Transactions for ${u.name}:`);
    const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', u.id).limit(5);
    console.log(txs);
  }
}

main().catch(console.error);
