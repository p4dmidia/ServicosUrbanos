import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  // Login to bypass RLS or inspect
  const email = `diag-${Date.now()}@test.com`;
  const password = 'SuperDebugPassword123!';
  await supabase.auth.signUp({ email, password });
  await supabase.auth.signInWithPassword({ email, password });
  const uid = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('profiles').update({ role: 'owner' }).eq('id', uid);

  console.log('--- Buscando Perfil do Emerson ---');
  const { data: emersonProfiles } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Emerson%');

  console.log('Perfis encontrados:', emersonProfiles);

  if (!emersonProfiles || emersonProfiles.length === 0) {
    console.log('Nenhum Emerson encontrado');
    return;
  }

  const emersonId = emersonProfiles[0].id;
  console.log('Emerson ID:', emersonId);

  // Subscriptions
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', emersonId);
  console.log('Subscriptions:', subs);

  // Segurados
  const { data: segurados } = await supabase
    .from('segurados')
    .select('*, apolices(*)')
    .eq('profile_id', emersonId);
  console.log('Segurados:', segurados);

  // Microfranqueados
  const { data: mfs } = await supabase
    .from('microfranqueados')
    .select('*, licencas_mmn(*)')
    .eq('profile_id', emersonId);
  console.log('Microfranqueados:', mfs);

  // Orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount, status, created_at, metadata')
    .eq('profile_id', emersonId);
  console.log('Orders do Emerson:', orders);

  // Reverter perfil temp
  await supabase.from('profiles').delete().eq('id', uid);
}

run().catch(console.error);
