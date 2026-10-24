import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `diag-sync-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  const emersonId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', emersonId).single();
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('profile_id', emersonId).eq('status', 'active').order('end_date', { ascending: false }).limit(1).maybeSingle();

  console.log('Profile:', profile?.full_name);
  console.log('Subscription:', sub?.plan_type, sub?.end_date);

  // Check if segurado exists
  let { data: segurado } = await supabase.from('segurados').select('*').eq('profile_id', emersonId).maybeSingle();

  if (!segurado) {
    console.log('Inserindo segurado para Emerson...');
    const { data: newSeg, error: errSeg } = await supabase.from('segurados').insert({
      profile_id: emersonId,
      nome_completo: profile.full_name.trim(),
      cpf: profile.cpf,
      data_nascimento: profile.birth_date || '1973-06-16',
      sexo: profile.gender || 'M',
      email: profile.email,
      whatsapp: profile.whatsapp,
      status: 'ativo'
    }).select().single();

    if (errSeg) {
      console.error('Erro ao inserir segurado:', errSeg);
      return;
    }
    segurado = newSeg;
    console.log('Segurado inserido com sucesso:', segurado.id);
  } else {
    console.log('Segurado já existe:', segurado.id);
  }

  // Check apolice
  let { data: apolice } = await supabase.from('apolices').select('*').eq('segurado_id', segurado.id).maybeSingle();
  if (!apolice) {
    console.log('Inserindo apólice para Emerson...');
    const vigenciaInicio = sub?.start_date || '2026-08-31T00:00:00+00:00';
    const vigenciaFim = sub?.end_date || '2027-08-31T23:59:59+00:00';

    const { data: newAp, error: errAp } = await supabase.from('apolices').insert({
      segurado_id: segurado.id,
      profile_id: emersonId,
      modalidade_codigo: sub?.plan_type || 'anual',
      numero_apolice: '11-0982-000058940-0001',
      numero_certificado: '10',
      seguradora: 'MBM SEGURADORA S/A (CNPJ: 87.883.807/0001-06)',
      capital_segurado: 5000,
      premio_pago: sub?.amount || 90,
      vigencia_inicio: vigenciaInicio,
      vigencia_fim: vigenciaFim,
      status: 'ativa'
    }).select().single();

    if (errAp) {
      console.error('Erro ao inserir apolice:', errAp);
      return;
    }
    apolice = newAp;
    console.log('Apolice inserida:', apolice.id);
  } else {
    console.log('Apolice já existe:', apolice.id);
  }

  // Check numero da sorte
  let { data: nums } = await supabase.from('numeros_da_sorte').select('*').eq('segurado_id', segurado.id);
  if (!nums || nums.length === 0) {
    console.log('Inserindo numero da sorte para Emerson...');
    const { data: newNum, error: errNum } = await supabase.from('numeros_da_sorte').insert({
      segurado_id: segurado.id,
      apolice_id: apolice.id,
      numero: '000110',
      serie: '001',
      mes_ano: '2026-10',
      status: 'ativo'
    }).select().single();

    if (errNum) console.error('Erro ao inserir numero da sorte:', errNum);
    else console.log('Numero da sorte inserido:', newNum.numero);
  } else {
    console.log('Numeros da sorte já existem:', nums.length);
  }

  // Check telemedicina
  let { data: teles } = await supabase.from('telemedicina_acesso').select('*').eq('segurado_id', segurado.id);
  if (!teles || teles.length === 0) {
    console.log('Inserindo telemedicina para Emerson...');
    const { data: newTele, error: errTele } = await supabase.from('telemedicina_acesso').insert({
      segurado_id: segurado.id,
      apolice_id: apolice.id,
      provedor: 'Racca Saúde',
      url_acesso: 'https://raccasaude.com.br/parceiro/servicos-urbanos',
      status: 'ativo',
      data_ativacao: sub?.start_date || new Date().toISOString()
    }).select().single();

    if (errTele) console.error('Erro ao inserir telemedicina:', errTele);
    else console.log('Telemedicina inserida com sucesso:', newTele.provedor);
  } else {
    console.log('Telemedicina já existe:', teles.length);
  }

  await supabase.from('profiles').delete().eq('id', uid);
  console.log('--- Sincronização concluída com sucesso! ---');
}

run().catch(console.error);
