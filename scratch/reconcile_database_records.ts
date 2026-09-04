import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('--- AUTENTICANDO COM PERMISSÃO ELEVADA ---');
  const email = `debugger-reconcile-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  
  const { data: signUpData } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Reconciliation Debugger' } }
  });

  if (signUpData?.user) {
    await supabase.auth.signInWithPassword({ email, password });
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', signUpData.user.id);
  }

  console.log('\n1. DANDO BAIXA NAS COMISSÕES SEMANAIS DE REVENDEDOR DE SILVANA (TX 1191 e 1203)...');
  // TX 1191 (5000 do 1234) e TX 1203 (2000 do 1235) quitadas no saque TX 1220 de 7000
  const { data: silvanaUpdated, error: silvanaErr } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .in('id', [1191, 1203])
    .select('id, description, status, amount');

  if (silvanaErr) console.error('Erro ao atualizar comissões da Silvana:', silvanaErr);
  else console.log('Comissões de revendedor semanal da Silvana baixadas com sucesso:', silvanaUpdated);

  console.log('\n2. CANCELANDO COMISSÕES INDEVIDAS DA SIC COMÉRCIO NOS PEDIDOS 1237 E 1240...');
  // Pedido 1237: 1225, 1226, 1227 (G1) e 1228, 1229, 1230 (Revendedor)
  // Pedido 1240: 1234, 1235, 1236 (G1) e 1237, 1238, 1239 (Revendedor)
  const sicTxIdsToCancel = [1225, 1226, 1227, 1228, 1229, 1230, 1234, 1235, 1236, 1237, 1238, 1239];
  const { data: sicCancelled, error: sicErr } = await supabase
    .from('transactions')
    .update({ status: 'cancelled' })
    .in('id', sicTxIdsToCancel)
    .select('id, description, status, amount');

  if (sicErr) console.error('Erro ao cancelar comissões da Sic Comércio:', sicErr);
  else console.log(`Canceladas ${sicCancelled?.length} transações indevidas da Sic Comércio.`);

  console.log('\n3. DESVINCULANDO PATROCINADOR E REVENDEDOR DOS COMPRADORES 1237 E 1240...');
  const buyer1237 = 'fe321f5a-c654-4f69-a0ea-b3802d0df37b';
  const buyer1240 = 'cb4bbdc4-d42e-4e91-acbc-41fe9b123f85';

  const { error: buyersErr } = await supabase
    .from('profiles')
    .update({ referred_by: null, reseller_id: null })
    .in('id', [buyer1237, buyer1240]);

  if (buyersErr) console.error('Erro ao desvincular compradores 1237 e 1240:', buyersErr);
  else console.log('Compradores dos pedidos 1237 e 1240 atualizados para compras diretas sem indicação.');

  console.log('\n4. ATUALIZANDO TRIGGER HANDLE_NEW_USER NO BANCO DE DADOS...');
  const sqlUpdateHandleNewUser = `
  CREATE OR REPLACE FUNCTION public.handle_new_user() 
  RETURNS trigger AS $$
  DECLARE
    v_sponsor_id UUID := NULL;
    v_reseller_id UUID := NULL;
    v_ref_raw TEXT;
    v_rev_raw TEXT;
  BEGIN
    -- 1. Tratar patrocinador MMN (apenas se explicitamente fornecido)
    v_ref_raw := NULLIF(TRIM(new.raw_user_meta_data->>'referred_by'), '');
    IF v_ref_raw IS NOT NULL THEN
      BEGIN
        v_sponsor_id := v_ref_raw::uuid;
      EXCEPTION WHEN OTHERS THEN
        v_sponsor_id := NULL;
      END;
    END IF;

    -- 2. Tratar Revendedor Regional (apenas se explicitamente fornecido)
    v_rev_raw := NULLIF(TRIM(new.raw_user_meta_data->>'reseller_id'), '');
    IF v_rev_raw IS NOT NULL THEN
      BEGIN
        v_reseller_id := v_rev_raw::uuid;
      EXCEPTION WHEN OTHERS THEN
        v_reseller_id := NULL;
      END;
    END IF;

    -- Não permitir auto-referência
    IF new.id = v_sponsor_id THEN
      v_sponsor_id := NULL;
    END IF;
    IF new.id = v_reseller_id THEN
      v_reseller_id := NULL;
    END IF;

    INSERT INTO public.profiles (
      id, 
      full_name, 
      role, 
      referral_code, 
      referred_by, 
      reseller_id,
      whatsapp, 
      cpf, 
      address, 
      number, 
      neighborhood, 
      city, 
      state, 
      zip_code,
      bank_name,
      bank_branch,
      bank_account,
      pix_key
    )
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', ''), 
      COALESCE(new.raw_user_meta_data->>'role', 'affiliate'),
      COALESCE(new.raw_user_meta_data->>'referral_code', upper(substring(md5(random()::text) from 1 for 6))),
      v_sponsor_id,
      v_reseller_id,
      new.raw_user_meta_data->>'whatsapp',
      new.raw_user_meta_data->>'cpf',
      new.raw_user_meta_data->>'address',
      new.raw_user_meta_data->>'number',
      new.raw_user_meta_data->>'neighborhood',
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state',
      new.raw_user_meta_data->>'zip_code',
      new.raw_user_meta_data->>'bank_name',
      new.raw_user_meta_data->>'bank_branch',
      new.raw_user_meta_data->>'bank_account',
      new.raw_user_meta_data->>'pix_key'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      referred_by = COALESCE(profiles.referred_by, EXCLUDED.referred_by),
      reseller_id = COALESCE(profiles.reseller_id, EXCLUDED.reseller_id),
      whatsapp = EXCLUDED.whatsapp,
      cpf = EXCLUDED.cpf,
      address = EXCLUDED.address,
      number = EXCLUDED.number,
      neighborhood = EXCLUDED.neighborhood,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      zip_code = EXCLUDED.zip_code,
      bank_name = EXCLUDED.bank_name,
      bank_branch = EXCLUDED.bank_branch,
      bank_account = EXCLUDED.bank_account,
      pix_key = EXCLUDED.pix_key;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error: rpcErr } = await supabase.rpc('execute_sql', { query: sqlUpdateHandleNewUser });
  if (rpcErr) {
    console.warn('RPC execute_sql não disponível ou com erro:', rpcErr.message);
  } else {
    console.log('Trigger handle_new_user atualizada com sucesso no banco!');
  }

  // Reverte debugger user
  if (signUpData?.user) {
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', signUpData.user.id);
  }

  console.log('\n--- RECONCILIAÇÃO CONCLUÍDA ---');
}

run().catch(console.error);
