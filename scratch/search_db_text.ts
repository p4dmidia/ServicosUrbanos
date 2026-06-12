import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Searching database for 'madeira' or 'construção'...");
  
  // 1. Get list of tables and columns from PostgREST/Supabase by querying views
  // Since we cannot run raw system queries directly via execute_sql, we will check known tables
  const tables = ['profiles', 'orders', 'transactions', 'whatsapp_config', 'whatsapp_messages', 'mmn_config', 'branches', 'products', 'categories'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(100);
        
      if (error) {
        console.error(`Error reading table ${table}:`, error.message);
        continue;
      }
      
      if (!data || data.length === 0) continue;
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes('madeira') || rowStr.includes('constru') || rowStr.includes('perfeito')) {
          console.log(`FOUND in table '${table}' at row index ${i}:`, JSON.stringify(row, null, 2));
        }
      }
    } catch (e: any) {
      console.error(`Exception on table ${table}:`, e.message);
    }
  }
  
  console.log("Database text search completed.");
}

run().catch(console.error);
