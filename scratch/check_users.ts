import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Sign up/in to get permissions if needed
  const email = `debugger-users-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'User Debugger',
      }
    }
  });

  await supabase.auth.signInWithPassword({
    email,
    password
  });

  await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);

  console.log("=== Querying User Profiles ===");
  
  // Total user count
  const { count: totalCount, error: err1 } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
    
  // Statuses of profiles
  const { data: allProfiles, error: err2 } = await supabase
    .from('profiles')
    .select('id, status, role, created_at');

  if (err1 || err2) {
    console.error("Errors:", err1, err2);
    return;
  }

  console.log("Total Profiles Count in DB:", totalCount);
  
  const statusCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  
  for (const p of allProfiles || []) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  }
  
  console.log("Status distribution:", statusCounts);
  console.log("Role distribution:", roleCounts);

  // Let's also see what getAdminGlobalStats is calculating for userTrend:
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const { count: currentMonthUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayCurrentMonth.toISOString());

  const { count: lastMonthUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayLastMonth.toISOString())
    .lte('created_at', lastDayLastMonth.toISOString());

  console.log(`Current month new users (from ${firstDayCurrentMonth.toISOString()}):`, currentMonthUsers);
  console.log(`Last month new users (from ${firstDayLastMonth.toISOString()} to ${lastDayLastMonth.toISOString()}):`, lastMonthUsers);

  // Clean up
  await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

run().catch(console.error);
