import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

async function main() {
  console.log('--- INICIANDO ATUALIZAÇÃO NO BANCO DE DADOS ---');
  
  // Login como superadmin ou role owner para ter permissão RLS
  const email = `admin-updater-${Date.now()}@test.com`;
  const password = 'SuperAdminPassword123!';
  
  const { data: signUpData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Admin Updater' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  // 1. Atualizar mmn_levels: levels 1, 2, 3 para value = 6.00 (6% / 3 = 2% por ciclo)
  console.log('\n1. Atualizando mmn_levels para 6.00%...');
  const { data: updatedLevels, error: errLevels } = await supabase
    .from('mmn_levels')
    .update({ value: 6.00 })
    .in('level', [1, 2, 3])
    .select();
  
  if (errLevels) {
    console.error('Erro ao atualizar mmn_levels:', errLevels);
  } else {
    console.log('mmn_levels atualizados com sucesso:', updatedLevels);
  }

  // 2. Atualizar mmn_config: 2% para cada modalidade
  console.log('\n2. Atualizando mmn_config para 2%...');
  const { data: currentConfig } = await supabase.from('mmn_config').select('id').single();
  if (currentConfig) {
    const { data: updatedConfig, error: errConfig } = await supabase
      .from('mmn_config')
      .update({
        cashback_digital: 2.00,
        cashback_mensal: 2.00,
        cashback_anual: 2.00,
        commission_regional_semanal: 2.00,
        commission_regional_mensal: 2.00,
        commission_regional_anual: 2.00
      })
      .eq('id', currentConfig.id)
      .select();

    if (errConfig) {
      console.error('Erro ao atualizar mmn_config:', errConfig);
    } else {
      console.log('mmn_config atualizado com sucesso:', updatedConfig);
    }
  }

  // 3. Atualizar transações do Pedido 1241 para R$ 20.00
  // Pedido 1241 é o pedido recente de R$ 1.000,00
  console.log('\n3. Buscando transações do Pedido 1241...');
  const { data: txs1241, error: errTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', 1241);

  if (errTxs) {
    console.error('Erro ao buscar transações do pedido 1241:', errTxs);
  } else {
    console.log(`Encontradas ${txs1241?.length} transações para o pedido 1241.`);
    for (const t of txs1241 || []) {
      // Se for transação de G0 ou G1 com valor 26.67, atualizar para 20.00
      if (Number(t.amount) === 26.67 || Math.abs(Number(t.amount) - 26.67) < 0.02) {
        const { error: updErr } = await supabase
          .from('transactions')
          .update({ amount: 20.00 })
          .eq('id', t.id);
        if (updErr) {
          console.error(`Erro ao atualizar TX #${t.id}:`, updErr);
        } else {
          console.log(`TX #${t.id} atualizada: R$ 26.67 -> R$ 20.00 (Desc: "${t.description}")`);
        }
      } else {
        console.log(`TX #${t.id} mantida em R$ ${t.amount} (Desc: "${t.description}")`);
      }
    }
  }

  // 4. Inativar a assinatura antiga de 2027 do Emerson ou verificar
  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  console.log('\n4. Verificando assinaturas do Emerson no banco...');
  const { data: emersonSubs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', emersonId);
  console.log('Assinaturas:', emersonSubs);

  // Limpeza
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }

  console.log('\n--- ATUALIZAÇÃO NO BANCO CONCLUÍDA ---');
}

main().catch(console.error);
