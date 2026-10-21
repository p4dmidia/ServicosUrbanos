import { supabase } from '../src/lib/supabase';
import { businessRules } from '../src/lib/businessRules';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  console.log("Testing authenticated user calling cadastrarMicrofranqueado...");

  const email = `test-mf-${Date.now()}@test.com`;
  const password = 'SuperTestPassword123!';

  // 1. Sign up user
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Usuario Teste Microfranqueado',
        cpf: '12345678901'
      }
    }
  });

  if (signUpErr || !signUpData.user) {
    console.error("Sign up error:", signUpErr);
    return;
  }

  const userId = signUpData.user.id;
  console.log("Signed up test user:", userId);

  // 2. Ensure session is signed in
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    console.error("Sign in error:", signInErr);
    return;
  }

  // 3. Call cadastrarMicrofranqueado
  const res = await businessRules.cadastrarMicrofranqueado({
    profile_id: userId,
    nome_completo: 'Usuario Teste Microfranqueado',
    cpf: '12345678901',
    ip: '127.0.0.1',
    user_agent: 'TestAgent',
    termo_hash: 'SHA256-ACEITE-MICROFRANQUEADO-1-ANO-GRATIS'
  });

  console.log("cadastrarMicrofranqueado result:", res);

  // 4. Fetch Microfranqueado Data
  const mfData = await businessRules.getMicrofranqueadoData(userId);
  console.log("Fetched Microfranqueado Data:", {
    isMicrofranqueado: mfData?.isMicrofranqueado,
    isLicenseActive: mfData?.isLicenseActive,
    isLimit100Free: mfData?.isLimit100Free,
    isPrimeiros100: mfData?.isPrimeiros100,
    status: mfData?.status,
    licencaStatus: mfData?.licenca?.status,
    licencaValidadeMeses: mfData?.licenca?.validade_meses
  });
}

run().catch(console.error);
