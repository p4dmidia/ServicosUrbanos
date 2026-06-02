import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '0b371ab1-c751-42ff-ade4-2071ccd7cb24')
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log('Profile:', profile);
  }
}

check();
