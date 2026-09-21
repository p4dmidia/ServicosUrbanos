import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioslywxfppswfuzxzwkn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2x5d3hmcHBzd2Z1enh6d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDA2MzksImV4cCI6MjA5MTE3NjYzOX0.7F7AelHFhKKHvdzeLL9maN3D2a4xFM33Oa0QaW_Vhqo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- BUSCANDO PEDIDOS ---');
  const { data: orders, error: oErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Orders error:', oErr);
  console.log('Recent Orders:', orders?.map(o => ({ id: o.id, customer_name: o.customer_name, amount: o.amount, status: o.status, date: o.order_date || o.created_at })));

  console.log('\n--- BUSCANDO PERFIS SILVANA, SILVA, RUAN, SIC, SERVIÇOS ---');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email, role, referred_by, reseller_id, cpf, cnpj, description');
  console.log('Profiles error:', pErr);
  
  const relevant = profiles?.filter(p => 
    p.full_name?.toLowerCase().includes('silva') || 
    p.full_name?.toLowerCase().includes('ruan') || 
    p.full_name?.toLowerCase().includes('sic') ||
    p.full_name?.toLowerCase().includes('serviços') ||
    p.email?.toLowerCase().includes('servicos')
  );
  console.log('Profiles:', relevant);

  const silvana = profiles?.find(p => p.full_name?.toLowerCase().includes('silvana') || p.full_name?.toLowerCase().includes('silva jorge'));
  if (silvana) {
    console.log(`\n--- TRANSAÇÕES DE SILVANA (${silvana.id}) ---`);
    const { data: txs } = await supabase.from('transactions').select('*').eq('profile_id', silvana.id).order('created_at', { ascending: false });
    console.log('Silvana Txs:', txs);
  }

  console.log('\n--- AFFILIATE_INVOICES ---');
  const { data: invs } = await supabase.from('affiliate_invoices').select('*');
  console.log('Invoices:', invs);
}

inspect();
