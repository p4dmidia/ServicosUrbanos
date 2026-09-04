import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function run() {
  console.log('--- AUDITORIA GERAL DE USUÁRIOS E ASSINATURAS ---');
  const email = `debugger-audit-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Audit Inspector' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, amount, status, items, created_at')
    .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']);

  const now = new Date();
  const SIC_ID = '194e5265-cdb6-431f-9f77-8888b1ee74ae';

  console.log(`Total de perfis: ${profiles?.length}`);
  console.log(`Total de assinaturas: ${subs?.length}`);
  console.log(`Total de pedidos pagos: ${orders?.length}`);

  console.log('\n--- PERFIS NÃO-SIC QUE ESTÃO ATIVOS OU COM ASSINATURA ATIVA ---');
  const irregularProfiles: any[] = [];

  for (const p of profiles || []) {
    if (p.id === SIC_ID) continue;
    if (p.id === signUpData?.user?.id) continue;

    const userSubs = (subs || []).filter(s => s.profile_id === p.id);
    const activeSubs = userSubs.filter(s => s.status === 'active' && new Date(s.end_date) >= now);
    const userPaidOrders = (orders || []).filter(o => o.customer_id === p.id);
    
    // Verificar se o usuário comprou assinatura em um pedido pago
    const hasPaidOrderWithSub = userPaidOrders.some(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      return items.some((it: any) => it.is_subscription);
    });

    const isProfileActive = p.status === 'active';
    const hasActiveSub = activeSubs.length > 0;

    if (isProfileActive || hasActiveSub) {
      console.log(`\nPerfil: ${p.full_name || 'Sem nome'} | Email: ${p.email} | ID: ${p.id}`);
      console.log(`  Role: ${p.role} | DB Status: ${p.status}`);
      console.log(`  Assinaturas no Banco (${userSubs.length}):`, userSubs.map(s => `[ID: ${s.id}] ${s.plan_type} | status: ${s.status} | fim: ${s.end_date}`));
      console.log(`  Tem Pedido Pago com Assinatura na Loja? ${hasPaidOrderWithSub ? 'SIM' : 'NÃO'}`);
      if (userPaidOrders.length > 0) {
        console.log(`  Pedidos Pagos (${userPaidOrders.length}):`, userPaidOrders.map(o => `Pedido #${o.id} - R$ ${o.amount}`));
      }

      // Se não comprou plano mas tem assinatura ativa ou status active, marca como irregular
      if (!hasPaidOrderWithSub) {
        irregularProfiles.push({
          profile: p,
          subsToCancel: activeSubs,
          reason: 'Sem pedido pago de assinatura'
        });
      }
    }
  }

  console.log(`\n=== TOTAL DE PERFIS IRREGULARES DETECTADOS: ${irregularProfiles.length} ===`);
  irregularProfiles.forEach(item => {
    console.log(`- ${item.profile.full_name} (${item.profile.email}) | ID: ${item.profile.id} | Motivo: ${item.reason}`);
  });

  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }
}

run().catch(console.error);
