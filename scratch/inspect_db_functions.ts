import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("Checking if we can query functions...");
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .ilike('proname', '%stock%');

  if (error) {
    console.log("Querying pg_proc failed:", error.message);
  } else {
    console.log("pg_proc results:", data);
  }

  const { data: data2, error: error2 } = await supabase
    .from('routines')
    .select('routine_name')
    .ilike('routine_name', '%stock%');

  if (error2) {
    console.log("Querying routines failed:", error2.message);
  } else {
    console.log("routines results:", data2);
  }
}

run().catch(console.error);
