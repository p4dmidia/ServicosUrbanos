const storage = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => storage.get(k) || null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear()
};

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  const userId = 'a00a6bab-5720-4632-a0db-3604b3a9e258';
  
  // Test calculating accumulated annual for Emerson in 2026
  const [{ data: userYearOrders }, { data: allProfilesList }] = await Promise.all([
    supabase.from('orders').select('*').in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada', 'Aguardando Pagamento']),
    supabase.from('profiles').select('id, full_name, referred_by, role, reseller_id')
  ]);
  const uProf = (allProfilesList || []).find(p => p.id === userId);
  const isResell = uProf?.role === 'regional_reseller' || uProf?.role === 'reseller' || !!uProf?.reseller_id;

  let accumulatedAnnual = 0;
  (userYearOrders || []).forEach((o: any) => {
    const rawDate = o.order_date || o.created_at || '';
    const oYear = new Date(rawDate).getFullYear();
    if (oYear === 2026 && o.customer_id === userId) {
      const oAmt = Number(o.amount || 0);
      if (isResell) {
        accumulatedAnnual += oAmt * 0.02;
        console.log(`Order #${o.id} ($${oAmt}) -> Annual 2%: $${oAmt * 0.02}`);
      }
    }
  });

  console.log('Total Accumulated Annual 2026 for Emerson:', accumulatedAnnual);
}

run().catch(console.error);
