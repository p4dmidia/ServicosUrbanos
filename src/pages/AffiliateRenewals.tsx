import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  Gift, 
  ShieldCheck, 
  Briefcase, 
  Sparkles,
  Lock,
  Unlock,
  ArrowRight,
  HeartPulse,
  Ticket
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { businessRules, calculateSubscriptionRepasseCycle } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useSubscriptionPlans } from '../lib/subscriptionPlans';

export default function AffiliateRenewals() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { plans: seguroPlans, microfranqueadoPlan, loading: plansLoading } = useSubscriptionPlans();
  const [loading, setLoading] = useState(true);
  const [regularizing, setRegularizing] = useState(false);
  const [activatingMf, setActivatingMf] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [seguradoData, setSeguradoData] = useState<any>(null);
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);
  const [subHistory, setSubHistory] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, subRes, historyRes, segRes, mfRes] = await Promise.all([
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
        businessRules.getSeguradoData(user.id),
        businessRules.getMicrofranqueadoData(user.id)
      ]);

      setStats(statsData);
      setSeguradoData(segRes);
      setMicrofranqueadoData(mfRes);

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
      console.error('Erro ao carregar dados de renovações:', e);
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

  const handlePay = (plan: any) => {
    try {
      const isMf = plan.plan_type === 'microfranqueado' || plan.plan_type === 'revendedor' || plan.id === 'sub-microfranqueado';
      const cartItem = {
        id: plan.id,
        name: plan.name,
        price: isMf ? 0.00 : Number(plan.price),
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

  const handleActivateFreeMicrofranqueado = async () => {
    if (!user) return;
    try {
      setActivatingMf(true);
      const loadingToast = toast.loading('Ativando sua Licença de Microfranqueado...');
      
      const res = await businessRules.cadastrarMicrofranqueado({
        profile_id: user.id,
        nome_completo: profile?.full_name || user?.user_metadata?.full_name || 'Microfranqueado Oficial',
        cpf: profile?.cpf || user?.user_metadata?.cpf,
        razao_social: profile?.full_name || user?.user_metadata?.full_name,
        ip: '127.0.0.1',
        user_agent: navigator.userAgent,
        termo_hash: 'SHA256-ACEITE-MICROFRANQUEADO-1-ANO-GRATIS'
      });

      toast.dismiss(loadingToast);

      if (res?.success) {
        toast.success('🎉 Licença de Microfranqueado ativada com sucesso! Você tem 1 ano 100% gratuito.');
        try {
          localStorage.removeItem('urbashop_cart');
        } catch {}
        await loadData();
      } else {
        toast.error(res?.error || 'Erro ao ativar licença.');
      }
    } catch (e: any) {
      toast.error('Erro ao ativar: ' + e.message);
    } finally {
      setActivatingMf(false);
    }
  };

  const handleRegularizeLicense = async () => {
    if (!microfranqueadoData?.microfranqueado?.id) return;
    try {
      setRegularizing(true);
      const res = await businessRules.regularizarLicencaMicrofranqueado(microfranqueadoData.microfranqueado.id);
      if (res?.success) {
        toast.success('Licença regularizada com sucesso! Comissões desbloqueadas.');
        await loadData();
      } else {
        toast.error(res?.error || 'Erro ao regularizar licença.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha ao processar regularização.');
    } finally {
      setRegularizing(false);
    }
  };

  const isMicrofranqueado = microfranqueadoData?.isMicrofranqueado;
  const isPrimeiros100 = microfranqueadoData?.isPrimeiros100;
  const isLicenseActive = microfranqueadoData?.isLicenseActive;
  const isSeguradoAtivo = seguradoData?.isPolicyActive;
  const mfRenewalPrice = microfranqueadoPlan ? Number(microfranqueadoPlan.price) : 250;

  const proximaRenovacaoDate = useMemo(() => {
    const mf = microfranqueadoData?.microfranqueado;
    const lic = microfranqueadoData?.licenca;
    if (lic?.data_fim) {
      const d = new Date(lic.data_fim);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    }
    const adesaoStr = mf?.data_adesao || mf?.data_contratacao || mf?.created_at;
    if (adesaoStr) {
      const d = new Date(adesaoStr);
      if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString('pt-BR');
      }
    }
    return null;
  }, [microfranqueadoData]);

  return (
    <AffiliateLayout title="Renovações & Licenciamento">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 space-y-10 pb-20">
        
        {/* Header Principal */}
        <div>
          <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
            <div className="size-11 bg-primary-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
              <RefreshCw size={24} />
            </div>
            Renovações & Licenciamento
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-1">
            Gerencie sua Licença de Microfranqueado (MMN) e sua assinatura do Seguro Vida Light (Afiliado Premium).
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-[2.5rem]">
            <div className="size-8 border-4 border-slate-200 border-t-primary-blue rounded-full animate-spin"></div>
            <p className="font-bold uppercase text-xs tracking-wider">Carregando informações das renovações...</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* 👑 SEÇÃO 1: STATUS DA LICENÇA DE MICROFRANQUEADO (MMN) */}
            <div className="bg-gradient-to-br from-indigo-950 via-midnight to-slate-950 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-amber-500 text-midnight flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                        Produto A • Modelo de Expansão MMN
                      </span>
                      <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                        Licença de Microfranqueado
                      </h2>
                    </div>
                  </div>

                  {isMicrofranqueado ? (
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 w-fit ${
                      isLicenseActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isLicenseActive ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      {isLicenseActive ? 'Licença Ativa' : 'Inadimplente / Bloqueada'}
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                      Não Contratada
                    </span>
                  )}
                </div>

                {isMicrofranqueado ? (
                  <div className="space-y-6">
                    {/* Licença Ativa (1º Ano Gratuito) */}
                    <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-3.5 text-emerald-200">
                      <Sparkles size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-emerald-300 text-xs uppercase tracking-tight">
                          Licença de Microfranqueado Ativa • 1º Ano Gratuito!
                        </h4>
                        <p className="text-xs text-emerald-200/90 leading-relaxed mt-1">
                          Sua licença comercial de Microfranqueado é 100% gratuita durante o primeiro ano. Sua rede e seus repasses semanais de comissão (até 33%) estão ativos. A anuidade de R$ {mfRenewalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} só será devida após o término de 12 meses.
                        </p>
                      </div>
                    </div>

                    {/* Caso esteja inadimplente */}
                    {!isLicenseActive && (
                      <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-200">
                        <div className="flex items-start gap-3.5">
                          <Lock size={22} className="text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-black text-rose-300 text-xs uppercase tracking-tight">
                              Comissões de Rede Bloqueadas por Inadimplência
                            </h4>
                            <p className="text-xs text-rose-200/90 leading-relaxed mt-1">
                              Sua taxa de licença anual está pendente. Enquanto não regularizada, as comissões da sua rede (G0 21%+2%, G1 3%+2%, G2 3%+2%) ficam retidas.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRegularizeLicense}
                          disabled={regularizing}
                          className="bg-emerald-500 hover:bg-emerald-400 text-midnight font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest whitespace-nowrap transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {regularizing ? 'Processando...' : 'Regularizar Licença'}
                        </button>
                      </div>
                    )}

                    {/* Informações de Regras de Comissionamento e Renovação da Licença */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                      {/* Próxima Renovação */}
                      <div>
                        <p className="text-sm font-medium text-white">
                          <strong className="text-amber-400 font-bold">Próxima renovação:</strong> a partir de{' '}
                          <span className="font-mono font-bold text-amber-300">
                            {proximaRenovacaoDate || '___/___/____'}
                          </span>.
                        </p>
                      </div>

                      {/* Período de Gratuidade & Gerações */}
                      <div className="space-y-3">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Durante o período de gratuidade, sua rede permanecerá ativa e você receberá comissões sobre as vendas realizadas nas seguintes gerações:
                        </p>
                        
                        <div className="space-y-2 pt-1">
                          <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                            <span className="text-emerald-400 text-sm shrink-0 mt-0.5">✅</span>
                            <div className="text-xs text-slate-200 leading-relaxed">
                              <strong className="text-white font-bold">G0 - Microfranqueado:</strong> vendas realizadas diretamente por você;
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                            <span className="text-emerald-400 text-sm shrink-0 mt-0.5">✅</span>
                            <div className="text-xs text-slate-200 leading-relaxed">
                              <strong className="text-white font-bold">G1 - Rede Direta:</strong> vendas realizadas pelos Microfranqueados indicados diretamente por você;
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                            <span className="text-emerald-400 text-sm shrink-0 mt-0.5">✅</span>
                            <div className="text-xs text-slate-200 leading-relaxed">
                              <strong className="text-white font-bold">G2 - Rede Indireta:</strong> vendas realizadas pelos Microfranqueados indicados pelos integrantes da sua G1.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Renovação Anual */}
                      <div className="pt-4 border-t border-white/10 space-y-2.5">
                        <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                          Renovação Anual
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Após o período inicial de 12 meses, será necessária a renovação anual da sua Licença de Microfranqueado para manter sua operação, sua rede e o recebimento das comissões ativas.
                        </p>
                        <p className="text-xs text-white">
                          <strong className="font-bold">Valor da renovação anual:</strong>{' '}
                          <span className="text-emerald-400 font-mono font-black text-sm">R$ 249,90</span>.
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          A cobrança da anuidade somente ocorrerá após o encerramento do período gratuito de 12 meses, contado a partir da sua data de adesão.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
                    <div className="space-y-2 max-w-xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Torne-se um <strong>Microfranqueado CaZa dos Sorteios</strong> para construir sua rede e receber <strong>até 33% de comissão</strong> (G0 21%+2%, G1 3%+2%, G2 3%+2%) sobre as vendas de seguros da sua equipe.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl">
                          🎉 1º Ano Gratuito (R$ 0,00)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          (Renovação de R$ {mfRenewalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano somente após 12 meses)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleActivateFreeMicrofranqueado}
                      disabled={activatingMf}
                      className="bg-emerald-500 hover:bg-emerald-400 text-midnight font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0 flex items-center gap-2 disabled:opacity-50"
                    >
                      {activatingMf ? (
                        <>
                          <div className="size-4 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                          <span>Ativando...</span>
                        </>
                      ) : (
                        <>
                          <span>Ativar Licença Grátis (1º Ano)</span>
                          <Sparkles size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 🛡️ SEÇÃO 2: PLANOS DO SEGURO VIDA LIGHT (AFILIADO PREMIUM) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Produto B • Benefício Exclusivo do Segurado
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-midnight uppercase italic tracking-tight mt-2">
                    Planos Seguro Vida Light (R$ 5.000 MBM + Sorteios + Telemedicina)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Não possui MMN nem comissões. Focado 100% em proteção, sorteios semanais da Loteria Federal e assistência médica 24/7.
                  </p>
                </div>

                {isSeguradoAtivo && (
                  <span className="self-start sm:self-auto px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Apólice Vigente
                  </span>
                )}
              </div>

              {/* Grid dos 4 Planos do Seguro Vida Light */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {seguroPlans.map((plan) => {
                  const isActive = subscription && subscription.plan_type === plan.plan_type && stats?.isEligible;
                  const isEcon = plan.plan_type === 'anual';
                  const isPopular = plan.plan_type === 'mensal';

                  return (
                    <div 
                      key={plan.id}
                      className={`bg-white border rounded-[2rem] p-6 flex flex-col justify-between gap-6 hover:shadow-xl transition-all relative overflow-hidden ${
                        isActive
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : isEcon
                            ? 'border-amber-400 shadow-md ring-1 ring-amber-400/30'
                            : 'border-slate-200'
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                          Ativo
                        </span>
                      ) : isEcon ? (
                        <span className="absolute top-0 right-0 bg-amber-500 text-midnight text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                          Mais Econômico
                        </span>
                      ) : isPopular ? (
                        <span className="absolute top-0 right-0 bg-primary-blue text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                          Adesão Mínima
                        </span>
                      ) : null}

                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl mb-2">{plan.image}</div>
                          <h4 className="text-base font-black text-midnight uppercase tracking-tight">
                            {plan.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">
                            {plan.desc}
                          </p>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <Ticket size={14} className="text-amber-500 shrink-0" />
                            <span>{plan.sorteios} sorteios {plan.plan_type === 'anual' ? 'anuais' : 'semanais'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <HeartPulse size={14} className="text-rose-500 shrink-0" />
                            <span>Telemedicina 24/7 Racca</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                            <span>R$ 5.000 MBM Seguradora</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-midnight font-mono">
                              R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              / {plan.duration_days} dias
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePay(plan)}
                        className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer shadow-md ${
                          isActive
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : isEcon
                              ? 'bg-amber-500 text-midnight hover:bg-amber-400'
                              : 'bg-primary-blue text-white hover:bg-blue-700'
                        }`}
                      >
                        {isActive ? 'Renovar Plano' : 'Assinar Plano'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico de Assinaturas */}
            {subHistory.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
                <h4 className="text-base font-black text-midnight uppercase tracking-tight flex items-center gap-2">
                  <Calendar size={18} className="text-primary-blue" />
                  Histórico de Assinaturas e Pagamentos
                </h4>
                
                <div className="divide-y divide-slate-100">
                  {subHistory.map((sub, i) => (
                    <div key={i} className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-midnight uppercase">
                          {sub.plan_type || 'Plano'}
                        </p>
                        <p className="text-slate-400 text-[10px] mt-0.5">
                          Início: {sub.start_date ? new Date(sub.start_date).toLocaleDateString('pt-BR') : '---'} • Fim: {sub.end_date ? new Date(sub.end_date).toLocaleDateString('pt-BR') : '---'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        sub.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sub.status === 'active' ? 'Ativo' : sub.status || 'Concluído'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </AffiliateLayout>
  );
}
