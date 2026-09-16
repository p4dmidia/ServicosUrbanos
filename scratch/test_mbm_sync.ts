import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionRepasseCycle, isCnpj } from '../src/lib/businessRules';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testMBMExportLogic() {
  const targetMonthStr = '2026-09';

  // 1. Buscar assinaturas
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select(`
      profile_id,
      plan_type,
      amount,
      start_date,
      end_date,
      status
    `)
    .eq('status', 'active');

  // 2. Buscar pedidos de assinatura pagos
  const { data: paidOrders } = await supabase
    .from('orders')
    .select(`
      id,
      customer_id,
      amount,
      status,
      created_at,
      order_date,
      items
    `)
    .in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada']);

  // 3. Buscar perfis
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*');

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // Consolidar segurados de subscriptions + orders
  const candidateMembers: any[] = [];

  (activeSubs || []).forEach(s => {
    const p = profileMap.get(s.profile_id);
    candidateMembers.push({
      profileId: s.profile_id,
      planType: s.plan_type,
      amount: s.amount,
      startDate: s.start_date,
      endDate: s.end_date,
      profile: p
    });
  });

  (paidOrders || []).forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(item => {
      if (item.is_subscription) {
        const oDate = o.order_date || o.created_at;
        const exists = candidateMembers.some(c => c.profileId === o.customer_id);
        if (!exists) {
          const p = profileMap.get(o.customer_id);
          candidateMembers.push({
            profileId: o.customer_id,
            planType: item.plan_type || 'anual',
            amount: item.price || o.amount,
            startDate: oDate,
            endDate: null,
            profile: p
          });
        }
      }
    });
  });

  console.log('Candidate members before MBM filter:', candidateMembers.length);

  const validActiveSubs = candidateMembers.filter((sub: any) => {
    const p = sub.profile || {};

    // Regra 4: Ciclo MBM (Mês de início ao último repasse do ciclo)
    const cycle = calculateSubscriptionRepasseCycle(sub.startDate, sub.planType, sub.endDate);
    if (targetMonthStr < cycle.startMonthStr || targetMonthStr > cycle.lastRepasseMonthStr) {
      console.log('Filtered out by cycle:', p.full_name, targetMonthStr, cycle.startMonthStr, cycle.lastRepasseMonthStr);
      return false;
    }

    // Regra 3: Status bloqueado/inativo explícito (se não estiver bloqueado, quem tem pedido pago é ativo)
    if (p.status === 'blocked' || p.status === 'inactive' || p.status === 'bloqueado') {
      console.log('Filtered out by blocked status:', p.full_name, p.status);
      return false;
    }

    // Regra 2: Usuário não cadastrado
    const name = (p.full_name || '').trim();
    if (!name || name.toUpperCase().includes('NÃO CADASTRADO') || name.toUpperCase().includes('NAO CADASTRADO')) {
      console.log('Filtered out by non-registered name:', name);
      return false;
    }

    const cleanCpfDigits = (p.cpf || '').replace(/\D/g, '');
    if (cleanCpfDigits.length !== 11) {
      console.log('Filtered out by CPF length:', p.full_name, p.cpf);
      return false;
    }

    // Regra 1: Pessoa Jurídica (CNPJ ou person_type PJ)
    if (p.cnpj && p.cnpj.replace(/\D/g, '').length > 0) {
      console.log('Filtered out by CNPJ:', p.full_name);
      return false;
    }
    if (isCnpj(p.cpf || '')) {
      console.log('Filtered out by isCnpj:', p.full_name);
      return false;
    }
    if (p.person_type === 'PJ') {
      console.log('Filtered out by person_type PJ:', p.full_name);
      return false;
    }

    return true;
  });

  console.log('Valid active members for MBM export:', validActiveSubs.length);
  validActiveSubs.forEach(v => console.log(' -> MBM Insured:', v.profile?.full_name, 'CPF:', v.profile?.cpf, 'Plan:', v.planType));
}

testMBMExportLogic();
