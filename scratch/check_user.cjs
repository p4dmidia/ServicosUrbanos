
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, email')
        .or('email.eq.jfernandes@gmail.com,cpf.eq.41531274005');
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Results:', JSON.stringify(data, null, 2));
}

check();
