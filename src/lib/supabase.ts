import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined) || process.env.VITE_SUPABASE_URL || 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createIsolatedSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};
