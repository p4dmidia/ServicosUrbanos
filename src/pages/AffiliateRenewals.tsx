import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AffiliateRenewals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, subRes, historyRes, plansRes] = await Promise.all([
        businessRules.getAffiliateStats(user.id),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', user.id)
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('is_subscription', true)
          .eq('status', 'Ativo')
          .order('price', { ascending: true })
      ]);

      setStats(statsData);

      const fetchedPlans = plansRes.data && plansRes.data.length > 0 ? plansRes.data : [
        { id: 'sub-mensal', name: 'Plano Mensal', price: 20, duration_days: 30, plan_type: 'mensal', image: '📅' },
        { id: 'sub-trimestral', name: 'Plano Trimestral', price: 30, duration_days: 90, plan_type: 'trimestral', image: '🌟' },
        { id: 'sub-semestral', name: 'Plano Semestral', price: 40, duration_days: 180, plan_type: 'semestral', image: '💼' },
        { id: 'sub-anual', name: 'Plano Anual', price: 60, duration_days: 365, plan_type: 'anual', image: '🏆' }
      ];
      setPlansList(fetchedPlans);

      let finalSub = subRes.data;
      if (!finalSub) {
        try {
          const savedMock = localStorage.getItem(`mock_subscription_${user.id}`);
          if (savedMock) {
            const mockData = JSON.parse(savedMock);
            finalSub = {
              plan_type: mockData.planType,
              end_date: mockData.endDate,
              status: mockData.status,
              created_at: mockData.createdAt
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSubscription(finalSub);

      let finalHistory = historyRes.data || [];
      if (finalHistory.length === 0 && finalSub) {
        finalHistory = [finalSub];
      }
      setSubHistory(finalHistory);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePay = async (plan: any) => {
    if (!user) return;
    try {
      const cartItem = {
        id: plan.id,
        name: `Licenciamento MMN - ${plan.name}`,
        price: plan.price,
        quantity: 1,
        image: plan.image || "🔄",
        is_subscription: true,
        plan_type: plan.plan_type
      };
      
      localStorage.setItem('urbashop_cart', JSON.stringify([cartItem]));
      navigate('/checkout');
    } catch (e: any) {
      toast.error('Erro ao redirecionar para o checkout: ' + e.message);
    }
  };

  return (
    <AffiliateLayout title="Minhas Renovações">
      <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
            <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
              <RefreshCw size={22} />
            </div>
            Minhas Renovações
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie a assinatura do seu licenciamento MMN e histórico de faturas.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-[2.5rem]">
            <div className="size-8 border-4 border-slate-200 border-t-primary-blue rounded-full animate-spin"></div>
            <p className="font-bold uppercase text-xs tracking-wider">Carregando informações das renovações...</p>
          </div>
        ) : (
          <>
            {/* Status Geral de Elegibilidade */}
            {stats?.isEligible ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950 uppercase italic tracking-tight">Sua conta está ativa</h3>
                    <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-1">
                      Você está elegível para receber cashbacks da rede até {subscription ? new Date(subscription.end_date).toLocaleDateString('pt-BR') : '---'}.
                    </p>
                  </div>
                </div>
                {subscription && (
                  <div className="bg-white/80 border border-emerald-200/50 px-6 py-3 rounded-2xl text-right self-stretch md:self-auto flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Próxima Renovação</span>
                    <span className="text-sm font-black text-midnight">{new Date(subscription.end_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-950 uppercase italic tracking-tight">Renovação Pendente (Conta Inativa)</h3>
                    <p className="text-xs text-amber-800 font-bold uppercase tracking-wider mt-1">
                      Faça o pagamento de uma das licenças abaixo para ativar seu link e cashbacks de indicados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Painel de Renovação */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic">Planos de Renovação Disponíveis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const renewalDate = subscription ? new Date(subscription.end_date) : null;
                  if (renewalDate) {
                    renewalDate.setHours(0, 0, 0, 0);
                  }
                  const isRenewalDayOrLater = !renewalDate || today >= renewalDate;

                  return plansList.map((planItem) => {
                    const isPopular = planItem.plan_type === 'trimestral' && !stats?.isEligible;
                    const isActivePlan = subscription && subscription.plan_type === planItem.plan_type && stats?.isEligible;
                    const isEcon = !stats?.isEligible && planItem.plan_type === 'anual';
                    
                    const isChangeButton = !isActivePlan && stats?.isEligible;
                    const isButtonDisabled = isChangeButton && !isRenewalDayOrLater;
                    
                    return (
                      <div 
                        key={planItem.id} 
                        className={`bg-white border rounded-[2rem] p-6 flex flex-col justify-between gap-6 hover:shadow-xl hover:shadow-primary-blue/5 transition-all relative overflow-hidden ${
                          isActivePlan || isEcon
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10' 
                            : isPopular 
                              ? 'border-primary-blue ring-2 ring-primary-blue/10' 
                              : 'border-slate-200'
                        }`}
                      >
                        {isActivePlan ? (
                          <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl leading-none">
                            Ativo
                          </span>
                        ) : isEcon ? (
                          <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl leading-none">
                            Mais Econômico
                          </span>
                        ) : isPopular ? (
                          <span className="absolute top-0 right-0 bg-primary-blue text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl leading-none">
                            Popular
                          </span>
                        ) : null}

                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opção</span>
                          <h4 className="text-base font-black text-midnight uppercase tracking-tight">{planItem.name}</h4>
                          <div className="pt-2">
                            <span className="text-2xl font-black text-primary-blue font-mono">
                              R$ {Number(planItem.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                              / {planItem.duration_days} dias
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 w-full">
                          <button
                            disabled={isButtonDisabled}
                            onClick={() => handlePay(planItem)}
                            className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                              isActivePlan || isEcon
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/15' 
                                : isPopular 
                                  ? 'bg-primary-blue text-white hover:bg-primary-blue/90 shadow-lg shadow-primary-blue/15' 
                                  : isButtonDisabled
                                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-midnight'
                            }`}
                          >
                            {isActivePlan 
                              ? 'Renovar Plano' 
                              : stats?.isEligible 
                                ? 'Trocar para este' 
                                : 'Escolher Plano'}
                          </button>
                          {isButtonDisabled && (
                            <p className="text-[8px] text-slate-400 font-bold text-center mt-1">
                              Disponível em {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Histórico de Faturas / Assinaturas */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic">Histórico de Assinaturas</h3>
              
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                {subHistory.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">Nenhuma fatura anterior registrada.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subHistory.map((sub, i) => (
                      <div key={i} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-midnight uppercase tracking-tight">Licenciamento MMN</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              Plano {sub.plan_type} • Pago em {sub.created_at ? new Date(sub.created_at).toLocaleDateString('pt-BR') : '---'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Válido até</p>
                            <p className="text-xs font-black text-midnight font-mono">{new Date(sub.end_date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border leading-none ${
                            new Date(sub.end_date) > new Date()
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {new Date(sub.end_date) > new Date() ? 'Ativo' : 'Expirado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </AffiliateLayout>
  );
}
