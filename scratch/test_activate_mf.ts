import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const profileId = 'e7ea0ff7-454e-4e68-942c-71c4ec6ce4aa'; // André Luiz Souza
  console.log("Testing cadastrarMicrofranqueado logic for André Luiz Souza...");

  // 1. Upsert microfranqueados
  const { data: mf, error: mfErr } = await supabase
    .from('microfranqueados')
    .upsert({
      profile_id: profileId,
      razao_social: 'André Luiz Souza',
      nome_fantasia: 'André Luiz Souza',
      limit_100_free: true,
      registration_fee_status: 'isento',
      registration_fee_amount: 0.00,
      status: 'ativo'
    }, { onConflict: 'profile_id' })
    .select()
    .single();

  if (mfErr) {
    console.error("Error upserting microfranqueados:", mfErr);
    return;
  }
  console.log("Upserted microfranqueado successfully:", mf.id);

  // 2. Licenca MMN
  const now = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const { data: lic, error: licErr } = await supabase
    .from('licencas_mmn')
    .insert({
      microfranqueado_id: mf.id,
      profile_id: profileId,
      status: 'ativa',
      validade_meses: 12,
      valor: 0.00,
      gratis_100_primeiros: true,
      cobranca_dezembro: false,
      ano_referencia: now.getFullYear(),
      data_inicio: now.toISOString(),
      data_fim: oneYearLater.toISOString()
    })
    .select()
    .single();

  if (licErr) {
    console.error("Error inserting licenca:", licErr);
    return;
  }
  console.log("Inserted licenca successfully:", lic.id);

  // 3. Aceite MMN
  const { data: aceite, error: aceiteErr } = await supabase
    .from('aceites_mmn')
    .insert({
      microfranqueado_id: mf.id,
      tipo_termo: 'termo_adesao_microfranqueado',
      versao_documento: '1.0',
      hash_texto: 'SHA256-TEST',
      ip: '127.0.0.1',
      user_agent: 'Node-Test',
      data_hora: now.toISOString()
    })
    .select()
    .single();

  if (aceiteErr) {
    console.error("Error inserting aceite:", aceiteErr);
    return;
  }
  console.log("Inserted aceite successfully:", aceite.id);
  console.log("ALL STEPS SUCCEEDED 100%!");
}

run().catch(console.error);
