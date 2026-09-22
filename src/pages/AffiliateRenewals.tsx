import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Calendar, CreditCard, ChevronRight, Gift } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { businessRules, calculateSubscriptionRepasseCycle } from '../lib/businessRules';
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

  const getPlanOrder = (item: any): number => {
    const p = ((item?.plan_type || item?.name || '') + '').toLowerCase();
    if (p.includes('revendedor') || p.includes('regional')) return 1;
    if (p.includes('anual') || p.includes('ano') || p.includes('365')) return 2;
    if (p.includes('semestral') || p.includes('180')) return 3;
    if (p.includes('trimestral') || p.includes('90')) return 4;
    if (p.includes('mensal') || p.includes('30')) return 5;
    return 99;
  };

  const orderedPlans = useMemo(() => {
    return [...plansList].sort((a, b) => getPlanOrder(a) - getPlanOrder(b));
  }, [plansList]);

  const getPlanDrawInfo = (planType?: string) => {
    const p = (planType || '').toLowerCase();
    if (p.includes('revendedor') || p.includes('regional')) {
      return '365 dias • 48 sorteios anuais + Licença Regional';
    }
    if (p.includes('anual') || p.includes('ano')) {
      return '365 dias • 48 sorteios anuais';
    }
    if (p.includes('semestral')) {
      return '180 dias • 24 sorteios';
    }
    if (p.includes('trimestral')) {
      return '90 dias • 12 sorteios';
    }
    return '30 dias • 4 sorteios';
  };

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
      ]);

      setStats(statsData);

      const officialDefaults = [
        { id: 'sub-revendedor', name: 'Revendedor Regional', price: 85, duration_days: 365, plan_type: 'revendedor', image: '👑' },
        { id: 'sub-anual', name: 'Plano Anual', price: 72, duration_days: 365, plan_type: 'anual', image: '🏆' },
        { id: 'sub-semestral', name: 'Plano Semestral', price: 45, duration_days: 180, plan_type: 'semestral', image: '💼' },
        { id: 'sub-trimestral', name: 'Plano Trimestral', price: 25, duration_days: 90, plan_type: 'trimestral', image: '🌟' },
        { id: 'sub-mensal', name: 'Plano Mensal', price: 10, duration_days: 30, plan_type: 'mensal', image: '📅' }
      ];

      const dbPlans = plansRes.data || [];
      const mergedPlansMap = new Map();
      officialDefaults.forEach(def => mergedPlansMap.set(def.plan_type, def));
      dbPlans.forEach(p => {
        if (p.plan_type) mergedPlansMap.set(p.plan_type, p);
      });

      const sortedPlans = Array.from(mergedPlansMap.values()).sort((a, b) => getPlanOrder(a) - getPlanOrder(b));

      setPlansList(sortedPlans);

      const activeSub = (historyRes.data || []).find(s => s.status === 'active' && new Date(s.end_date) >= new Date());
      let finalSub = activeSub || (historyRes.data && historyRes.data.length > 0 ? historyRes.data[0] : subRes.data);
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

  const getRenewalWindow = (sub?: any) => {
    if (!sub) return null;
    const cycle = calculateSubscriptionRepasseCycle(sub.start_date, sub.plan_type, sub.end_date);
    return {
      cycle,
      endDate: cycle.cycleEndDate,
      openDate: cycle.renewalBillingDate,
      isWindowOpen: cycle.isWindowOpen,
      isExpired: cycle.isExpired,
      renewalBillingDisplay: cycle.renewalBillingDisplay,
      lastRepasseDisplay: cycle.lastRepasseDisplay,
      firstRepasseDisplay: cycle.firstRepasseDisplay,
      startDisplay: cycle.startDisplay
    };
  };

  const handlePay = async (plan: any) => {
    if (!user) return;
    
    // Bloqueia compra de plano se possuir assinatura ativa antes da abertura da janela de renovação (mês anterior ao último repasse)
    if (subscription && stats?.isEligible) {
      const rWindow = getRenewalWindow(subscription);
      if (rWindow && !rWindow.isWindowOpen) {
        toast.error(`Você já possui um plano ativo até ${rWindow.endDate.toLocaleDateString('pt-BR')}. A renovação ou troca de plano estará disponível a partir do mês de cobrança (${rWindow.renewalBillingDisplay} - 1º repasse + ciclo).`);
        return;
      }
    }

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
          <p className="text-slate-500 font-medium mt-1">Gerencie a assinatura do seu licenciamento MMN e calendário operacional de repasses/renovação.</p>
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
                    {subscription ? (() => {
                      const rWindow = getRenewalWindow(subscription);
                      return (
                        <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-1">
                          Início: {rWindow?.startDisplay} • 1º Repasse: {rWindow?.firstRepasseDisplay} • Último Repasse: {rWindow?.lastRepasseDisplay}
                        </p>
                      );
                    })() : (
                      <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-1">
                        Você está elegível para receber cashbacks da rede.
                      </p>
                    )}
                  </div>
                </div>
                {subscription && (() => {
                  const rWindow = getRenewalWindow(subscription);
                  return (
                    <div className="bg-white/90 border border-emerald-200 px-6 py-3.5 rounded-2xl text-right self-stretch md:self-auto flex flex-col justify-center shadow-sm">
                      {rWindow?.isWindowOpen ? (
                        <>
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Renovação</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600 uppercase tracking-tight">Liberada</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1">Mês de Cobrança: {rWindow.renewalBillingDisplay}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Cobrança da Renovação</span>
                          <span className="text-sm font-black text-midnight font-mono uppercase">
                            {rWindow?.renewalBillingDisplay || '---'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                            (Mês anterior ao último repasse)
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
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
                      Faça o pagamento de uma das licenças abaixo para ativar seu link e garantir seus repasses e sorteios.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Painel de Renovação e Licenciamento */}
            <div className="space-y-8">
              {(() => {
                const rWindow = getRenewalWindow(subscription);
                const isWindowOpen = !rWindow || rWindow.isWindowOpen || !stats?.isEligible;
                const isButtonDisabled = Boolean(stats?.isEligible && !isWindowOpen);

                const resellerPlan = orderedPlans.find(p => p.plan_type === 'revendedor');
                const regularPlans = orderedPlans.filter(p => p.plan_type !== 'revendedor');

                const isResellerActive = subscription && subscription.plan_type === 'revendedor' && stats?.isEligible;

                return (
                  <>
                    {/* 1. CARD HERO DESTAQUE: REVENDEDOR REGIONAL */}
                    {resellerPlan && (
                      <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-amber-400/70 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-7 md:p-9 shadow-xl shadow-amber-500/5 transition-all">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                          👑 Licença de Liderança Regional
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mt-2">
                          <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-3">
                              <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30 shrink-0">
                                👑
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Nível Avançado</span>
                                <h3 className="text-xl md:text-2xl font-black text-midnight uppercase tracking-tight leading-tight">
                                  {resellerPlan.name}
                                </h3>
                              </div>
                            </div>

                            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                              Licença exclusiva para líderes e gestores regionais. Garante comissões de revendedor sobre todas as indicações e vendas da sua regional, além de participação completa nos 48 sorteios anuais.
                            </p>

                            {/* Chips de Benefícios */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-black">
                                🏆 Comissão Regional (10% M + 2% A)
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black">
                                🌐 Rede G0, G1 e G2
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black">
                                🎁 48 Sorteios Anuais
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black">
                                📅 365 Dias de Vigência
                              </span>
                            </div>
                          </div>

                          {/* Preço e Botão */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-4 shrink-0 bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-amber-200/80 shadow-sm w-full lg:w-72">
                            <div className="text-left lg:text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Investimento Anual</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-amber-600 font-mono">
                                  R$ {Number(resellerPlan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold uppercase">/ ano</span>
                              </div>
                            </div>

                            <button
                              disabled={isButtonDisabled}
                              onClick={() => handlePay(resellerPlan)}
                              className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
                                isButtonDisabled
                                  ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                  : isResellerActive
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
                              }`}
                            >
                              {isResellerActive 
                                ? (isButtonDisabled ? 'Licença em Vigência' : 'Renovar Licença') 
                                : stats?.isEligible 
                                  ? (isButtonDisabled ? 'Bloqueado até Renovação' : 'Tornar-se Revendedor') 
                                  : 'Ativar Revendedor'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. GRADE DE PLANOS AFILIADO PREMIUM (4 COLUNAS ESPAÇOSAS) */}
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-base font-black text-midnight tracking-tight uppercase">
                          Planos de Afiliado Premium (Consumo & Rede)
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          Participe dos sorteios semanais e receba comissões de rede (G0, G1 e G2)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {regularPlans.map((planItem) => {
                          const isPopular = planItem.plan_type === 'trimestral' && !stats?.isEligible;
                          const isActivePlan = subscription && subscription.plan_type === planItem.plan_type && stats?.isEligible;
                          const isEcon = !stats?.isEligible && planItem.plan_type === 'anual';

                          return (
                            <div 
                              key={planItem.id} 
                              className={`bg-white border rounded-[2rem] p-6 flex flex-col justify-between gap-6 hover:shadow-xl hover:shadow-primary-blue/5 transition-all relative overflow-hidden ${
                                isActivePlan
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/10' 
                                  : isEcon
                                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/10'
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
                                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl leading-none">
                                  Mais Econômico
                                </span>
                              ) : isPopular ? (
                                <span className="absolute top-0 right-0 bg-primary-blue text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl leading-none">
                                  Popular
                                </span>
                              ) : null}

                              <div className="space-y-3">
                                <div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Opção</span>
                                  <h4 className="text-base font-black text-midnight uppercase tracking-tight leading-tight">{planItem.name}</h4>
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-700 mt-2.5">
                                    <Gift size={13} className="text-primary-blue shrink-0" />
                                    <span>{getPlanDrawInfo(planItem.plan_type)}</span>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-primary-blue font-mono">
                                      R$ {Number(planItem.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                                      / {planItem.duration_days} dias
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 w-full pt-2">
                                <button
                                  disabled={isButtonDisabled}
                                  onClick={() => handlePay(planItem)}
                                  className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer ${
                                    isButtonDisabled
                                      ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                      : isActivePlan
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/15' 
                                        : isEcon
                                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/15'
                                          : isPopular 
                                            ? 'bg-primary-blue text-white hover:bg-primary-blue/90 shadow-lg shadow-primary-blue/15' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-midnight'
                                  }`}
                                >
                                  {isActivePlan 
                                    ? (isButtonDisabled ? 'Plano em Vigência' : 'Renovar Plano') 
                                    : stats?.isEligible 
                                      ? (isButtonDisabled ? 'Bloqueado até Renovação' : 'Trocar para este') 
                                      : 'Escolher Plano'}
                                </button>
                                {isButtonDisabled && rWindow && (
                                  <p className="text-[8px] text-slate-400 font-bold text-center mt-1">
                                    Disponível a partir de {rWindow.openDate.toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {!isButtonDisabled && stats?.isEligible && (
                                  <p className="text-[8px] text-emerald-600 font-bold text-center mt-1">
                                    {isActivePlan ? 'Renovação antecipada liberada' : 'Migração de plano liberada'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
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
