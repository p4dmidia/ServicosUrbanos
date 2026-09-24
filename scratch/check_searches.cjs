const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOtherTables() {
  const tables = ['subscriptions', 'orders', 'branches', 'mmn_levels'];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(5);
      console.log(`Table ${t}: count = ${data ? data.length : 0}, error = ${error ? error.message : 'none'}`);
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }

  // Check if there are profiles with search
  const searches = ['Mikael', 'Rosangela', 'Miguel', 'Jeyssiane', '15141286916', '41274318220', '70409850632', '13424915645'];
  for (const s of searches) {
    const { data } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${s}%,cpf.ilike.%${s}%,description.ilike.%${s}%`);
    console.log(`Search '${s}' in profiles: found ${data ? data.length : 0}`);
  }
}

checkOtherTables();
