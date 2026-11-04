import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface FormattedSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  plan_type: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'revendedor' | string;
  image: string;
  sorteios: number;
  desc: string;
  status: 'Ativo' | 'Inativo' | string;
}

export const DEFAULT_SEGURO_PLANS: FormattedSubscriptionPlan[] = [
  { 
    id: 'sub-mensal', 
    name: 'Seguro Vida Light Mensal', 
    price: 6.00, 
    duration_days: 30, 
    plan_type: 'mensal', 
    image: '📅', 
    sorteios: 4, 
    desc: '30 dias de cobertura securitária MBM, 4 sorteios semanais da Loteria Federal e telemedicina 24h ilimitada.',
    status: 'Ativo'
  },
  { 
    id: 'sub-trimestral', 
    name: 'Seguro Vida Light Trimestral', 
    price: 15.00, 
    duration_days: 90, 
    plan_type: 'trimestral', 
    image: '🌟', 
    sorteios: 12, 
    desc: '90 dias de cobertura, 12 sorteios semanais de R$ 5.000,00 e telemedicina Racca Saúde.',
    status: 'Ativo'
  },
  { 
    id: 'sub-semestral', 
    name: 'Seguro Vida Light Semestral', 
    price: 30.00, 
    duration_days: 180, 
    plan_type: 'semestral', 
    image: '💼', 
    sorteios: 24, 
    desc: '180 dias de tranquilidade, 24 sorteios semanais da Loteria Federal e telemedicina 24h.',
    status: 'Ativo'
  },
  { 
    id: 'sub-anual', 
    name: 'Seguro Vida Light Anual', 
    price: 90.00, 
    duration_days: 365, 
    plan_type: 'anual', 
    image: '🏆', 
    sorteios: 48, 
    desc: 'Plano mais econômico. 365 dias de vigência, 48 sorteios anuais e telemedicina.',
    status: 'Ativo'
  }
];

export function generatePlanDescription(product: any): string {
  if (product.description && product.description.trim()) {
    return product.description.trim();
  }
  const days = Number(product.duration_days) || 30;
  const sorteios = Math.max(1, Math.round(days / 30) * 4);
  const price = Number(product.price) || 0;
  
  if (product.plan_type === 'anual' || days >= 365) {
    const monthlyRate = (price / (days / 30)).toFixed(2).replace('.', ',');
    return `Plano mais econômico (R$ ${monthlyRate}/mês). ${days} dias de vigência, ${sorteios} sorteios anuais e telemedicina.`;
  }
  if (product.plan_type === 'semestral' || days >= 180) {
    return `${days} dias de tranquilidade, ${sorteios} sorteios semanais da Loteria Federal e telemedicina 24h.`;
  }
  if (product.plan_type === 'trimestral' || days >= 90) {
    return `${days} dias de cobertura, ${sorteios} sorteios semanais de R$ 5.000,00 e telemedicina Racca Saúde.`;
  }
  return `${days} dias de cobertura securitária MBM, ${sorteios} sorteios semanais da Loteria Federal e telemedicina 24h ilimitada.`;
}

export function formatProductToPlan(product: any): FormattedSubscriptionPlan {
  const days = Number(product.duration_days) || 30;
  const sorteios = Math.max(1, Math.round(days / 30) * 4);
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    duration_days: days,
    plan_type: product.plan_type,
    image: product.image || (product.plan_type === 'anual' ? '🏆' : product.plan_type === 'semestral' ? '💼' : product.plan_type === 'trimestral' ? '🌟' : '📅'),
    sorteios: sorteios,
    desc: generatePlanDescription(product),
    status: product.status || 'Ativo'
  };
}

export async function fetchSubscriptionPlans() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_subscription', true)
      .order('price', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        allPlans: DEFAULT_SEGURO_PLANS,
        seguroPlans: DEFAULT_SEGURO_PLANS,
        microfranqueadoPlan: null,
        minMonthlyPrice: 6.00
      };
    }

    const allFormatted = data.map(formatProductToPlan);
    const activePlans = allFormatted.filter(p => p.status === 'Ativo');

    const seguroPlans = activePlans.filter(
      p => p.plan_type !== 'revendedor' && p.plan_type !== 'microfranqueado'
    );

    const microfranqueadoPlan = allFormatted.find(
      p => p.plan_type === 'revendedor' || p.plan_type === 'microfranqueado'
    ) || null;

    const mensalPlan = seguroPlans.find(p => p.plan_type === 'mensal');
    const minMonthlyPrice = mensalPlan ? mensalPlan.price : (seguroPlans[0]?.price || 6.00);

    return {
      allPlans: allFormatted,
      seguroPlans: seguroPlans.length > 0 ? seguroPlans : DEFAULT_SEGURO_PLANS,
      microfranqueadoPlan,
      minMonthlyPrice
    };
  } catch (err) {
    console.warn('Erro ao carregar planos do banco, usando padrões:', err);
    return {
      allPlans: DEFAULT_SEGURO_PLANS,
      seguroPlans: DEFAULT_SEGURO_PLANS,
      microfranqueadoPlan: null,
      minMonthlyPrice: 6.00
    };
  }
}

interface SubscriptionData {
  allPlans: FormattedSubscriptionPlan[];
  seguroPlans: FormattedSubscriptionPlan[];
  microfranqueadoPlan: FormattedSubscriptionPlan | null;
  minMonthlyPrice: number;
}

const DEFAULT_SUBSCRIPTION_DATA: SubscriptionData = {
  allPlans: DEFAULT_SEGURO_PLANS,
  seguroPlans: DEFAULT_SEGURO_PLANS,
  microfranqueadoPlan: null,
  minMonthlyPrice: 6.00
};

let cachedSubscriptionData: SubscriptionData | null = null;
const subscribers = new Set<(data: SubscriptionData) => void>();
let globalChannel: any = null;
let isFetching = false;

async function syncSubscriptionPlans() {
  if (isFetching) return;
  isFetching = true;
  try {
    const res = await fetchSubscriptionPlans();
    cachedSubscriptionData = res;
    subscribers.forEach(cb => cb(res));
  } catch (e) {
    console.warn('Erro ao sincronizar planos de assinatura:', e);
  } finally {
    isFetching = false;
  }
}

function initRealtimeChannel() {
  if (globalChannel) return;
  const channelName = `products-sub-sync-${Math.random().toString(36).slice(2, 9)}`;
  globalChannel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      syncSubscriptionPlans();
    })
    .subscribe();
}

function disposeRealtimeChannel() {
  if (globalChannel) {
    supabase.removeChannel(globalChannel);
    globalChannel = null;
  }
}

export function useSubscriptionPlans() {
  const [data, setData] = useState<SubscriptionData>(() => cachedSubscriptionData || DEFAULT_SUBSCRIPTION_DATA);
  const [loading, setLoading] = useState<boolean>(() => !cachedSubscriptionData);

  useEffect(() => {
    const handleUpdate = (updated: SubscriptionData) => {
      if (updated) {
        setData(updated);
        setLoading(false);
      }
    };

    subscribers.add(handleUpdate);

    if (subscribers.size === 1) {
      initRealtimeChannel();
    }

    syncSubscriptionPlans();

    const onFocus = () => syncSubscriptionPlans();
    window.addEventListener('focus', onFocus);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncSubscriptionPlans();
    };
    window.addEventListener('visibilitychange', onVisibility);

    return () => {
      subscribers.delete(handleUpdate);
      if (subscribers.size === 0) {
        disposeRealtimeChannel();
      }
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return {
    plans: data.seguroPlans,
    allPlans: data.allPlans,
    microfranqueadoPlan: data.microfranqueadoPlan,
    minPrice: data.minMonthlyPrice,
    loading,
    refreshPlans: syncSubscriptionPlans
  };
}
