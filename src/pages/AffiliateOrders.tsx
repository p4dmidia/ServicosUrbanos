import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight, 
  ChevronLeft,
  Search, 
  Filter, 
  MessageCircle, 
  User, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Share2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateSubscriptionRepasseCycle } from '../lib/businessRules';
import AffiliateLayout from '../components/AffiliateLayout';
import { toast } from 'react-hot-toast';

interface DirectClient {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  role: string;
  referralCode: string;
  joinedDate: string;
  isMicrofranqueado: boolean;
  hasPolicy: boolean;
  planType: string;
  price: number;
  startDate: string;
  endDate?: string;
  cycle: ReturnType<typeof calculateSubscriptionRepasseCycle>;
  renewalStatus: 'aberto' | 'vigente' | 'expirado' | 'pendente_adesao';
}

export default function AffiliateOrders() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'mes' | 'todos' | 'aberto' | 'vigente' | 'pendente'>('mes');
  const [subscription, setSubscription] = useState<any | null>(null);
  const [directClients, setDirectClients] = useState<DirectClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<DirectClient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Navegação e Filtro por Mês (Competência de Renovação)
  const defaultCurrentDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const [currentDate, setCurrentDate] = useState(defaultCurrentDate);

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12
  const refMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const defaultRefMonthStr = `${defaultCurrentDate.getFullYear()}-${String(defaultCurrentDate.getMonth() + 1).padStart(2, '0')}`;
  const isDefaultCompetence = refMonthStr === defaultRefMonthStr;

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrent = () => {
    setCurrentDate(defaultCurrentDate);
  };

  const jumpToMonth = (year: number, month: number) => {
    setCurrentDate(new Date(year, month - 1, 1));
    setStatusFilter('mes');
  };

  // Carrega Assinatura do Afiliado e Clientes de Indicação Direta
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);

        // 1. Assinatura do próprio afiliado (Mantida conforme solicitado)
        const [subRes, directProfilesRes] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('*')
            .eq('profile_id', user.id)
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('id, full_name, email, whatsapp, role, referral_code, created_at, city, state')
            .eq('referred_by', user.id)
            .order('created_at', { ascending: false })
        ]);

        let finalSub = subRes.data;
        if (!finalSub) {
          try {
            const savedMock = localStorage.getItem(`mock_subscription_${user.id}`);
            if (savedMock) {
              const mockData = JSON.parse(savedMock);
              finalSub = {
                plan_type: mockData.planType,
                start_date: mockData.startDate || mockData.createdAt,
                end_date: mockData.endDate,
                status: mockData.status
              };
            }
          } catch (e) {
            console.error('Erro ao ler mock subscription:', e);
          }
        }
        setSubscription(finalSub);

        // 2. Busca assinaturas e pedidos dos clientes de indicação direta
        const directProfiles = directProfilesRes.data || [];
        const directIds = directProfiles.map(p => p.id);

        let subsMap: Record<string, any> = {};
        let ordersMap: Record<string, any[]> = {};
        let mfSet = new Set<string>();

        if (directIds.length > 0) {
          const [directSubsRes, directOrdersRes, directMfsRes] = await Promise.all([
            supabase
              .from('subscriptions')
              .select('*')
              .in('profile_id', directIds)
              .order('end_date', { ascending: false }),
            supabase
              .from('orders')
              .select('*')
              .in('customer_id', directIds)
              .in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada', 'Enviado', 'Entregue', 'Aguardando Pagamento'])
              .order('order_date', { ascending: false }),
            supabase
              .from('microfranqueados')
              .select('profile_id, status')
              .in('profile_id', directIds)
          ]);

          (directSubsRes.data || []).forEach(s => {
            if (!subsMap[s.profile_id]) subsMap[s.profile_id] = s;
          });

          (directOrdersRes.data || []).forEach(o => {
            if (!ordersMap[o.customer_id]) ordersMap[o.customer_id] = [];
            ordersMap[o.customer_id].push(o);
          });

          (directMfsRes.data || []).forEach(m => {
            if (m.status === 'ativo') mfSet.add(m.profile_id);
          });
        }

        // 3. Monta lista de clientes diretos com cálculo de ciclo e renovação
        const clients: DirectClient[] = directProfiles.map(p => {
          const sub = subsMap[p.id];
          const userOrders = ordersMap[p.id] || [];
          const paidOrders = userOrders.filter(o => 
            ['Pago', 'Concluído', 'Pago, Aguardando Retirada', 'Enviado', 'Entregue'].includes(o.status)
          );
          const isMf = mfSet.has(p.id) || p.role === 'regional_reseller' || p.role === 'reseller';

          let planType = sub?.plan_type || 'Semestral';
          let startDate = sub?.start_date || sub?.created_at || (paidOrders[0]?.order_date || paidOrders[0]?.created_at || p.created_at);
          let endDate = sub?.end_date;
          let price = sub?.price || (paidOrders[0]?.amount ? Number(paidOrders[0].amount) : (planType.toLowerCase().includes('anual') ? 55.99 : 29.99));
          const hasPolicy = Boolean(sub || paidOrders.length > 0);

          if (!sub && paidOrders.length > 0) {
            const amt = Number(paidOrders[0].amount || 0);
            planType = amt >= 50 ? 'Anual' : 'Semestral';
          }

          const cycle = calculateSubscriptionRepasseCycle(startDate, planType, endDate);

          let renewalStatus: 'aberto' | 'vigente' | 'expirado' | 'pendente_adesao' = 'vigente';
          if (!hasPolicy) {
            renewalStatus = 'pendente_adesao';
          } else if (cycle.isExpired) {
            renewalStatus = 'expirado';
          } else if (cycle.isWindowOpen) {
            renewalStatus = 'aberto';
          } else {
            renewalStatus = 'vigente';
          }

          return {
            id: p.id,
            name: p.full_name || 'Cliente Direto',
            email: p.email || 'Não informado',
            whatsapp: p.whatsapp || '',
            city: p.city || '',
            state: p.state || '',
            role: p.role,
            referralCode: p.referral_code || '',
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recente',
            isMicrofranqueado: isMf,
            hasPolicy: hasPolicy,
            planType: planType,
            price: price,
            startDate: startDate,
            endDate: endDate,
            cycle: cycle,
            renewalStatus: renewalStatus
          };
        });

        setDirectClients(clients);
      } catch (err) {
        console.error('Erro ao carregar renovações de clientes diretos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Função para verificar se a cobrança de renovação do cliente vence no mês selecionado
  const isClientRenewalInMonth = (client: DirectClient, targetMonthStr: string) => {
    if (!client.hasPolicy) return false;
    // Vence estritamente no mês da cobrança da renovação
    return client.cycle.renewalBillingMonthStr === targetMonthStr;
  };

  // Lista de meses que possuem renovações programadas na carteira
  const upcomingRenewalMonths = useMemo(() => {
    const map: Record<string, { monthStr: string; display: string; count: number; year: number; month: number }> = {};
    directClients.forEach(c => {
      if (c.hasPolicy && c.cycle.renewalBillingMonthStr) {
        const mStr = c.cycle.renewalBillingMonthStr;
        if (!map[mStr]) {
          const [y, m] = mStr.split('-');
          map[mStr] = {
            monthStr: mStr,
            display: c.cycle.renewalBillingDisplay,
            count: 0,
            year: parseInt(y, 10),
            month: parseInt(m, 10)
          };
        }
        map[mStr].count++;
      }
    });
    return Object.values(map).sort((a, b) => a.monthStr.localeCompare(b.monthStr));
  }, [directClients]);

  // Filtros de busca e competência
  const filteredClients = useMemo(() => {
    return directClients.filter(c => {
      const matchSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.whatsapp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'mes') {
        return isClientRenewalInMonth(c, refMonthStr);
      }
      if (statusFilter === 'aberto') return c.renewalStatus === 'aberto';
      if (statusFilter === 'vigente') return c.renewalStatus === 'vigente';
      if (statusFilter === 'pendente') return c.renewalStatus === 'pendente_adesao' || c.renewalStatus === 'expirado';
      return true;
    });
  }, [directClients, searchTerm, statusFilter, refMonthStr]);

  // Contadores
  const counts = useMemo(() => {
    const inMonthRenewals = directClients.filter(c => isClientRenewalInMonth(c, refMonthStr)).length;
    const inMonthStarts = directClients.filter(c => c.cycle.startMonthStr === refMonthStr).length;

    return {
      total: directClients.length,
      mesRenovacoes: inMonthRenewals,
      mesAdesoes: inMonthStarts,
      aberto: directClients.filter(c => c.renewalStatus === 'aberto').length,
      vigente: directClients.filter(c => c.renewalStatus === 'vigente').length,
      pendente: directClients.filter(c => c.renewalStatus === 'pendente_adesao' || c.renewalStatus === 'expirado').length,
    };
  }, [directClients, refMonthStr]);

  // Ação de contato rápido no WhatsApp
  const openWhatsAppContact = (client: DirectClient) => {
    if (!client.whatsapp) {
      toast.error('Este cliente não cadastrou telefone de WhatsApp.');
      return;
    }
    const phone = client.whatsapp.replace(/\D/g, '');
    const fullPhone = phone.length === 10 || phone.length === 11 ? `55${phone}` : phone;
    const myName = profile?.full_name || 'Seu Consultor';
    const planText = `Seguro Vida Light (Plano ${client.planType})`;

    let msg = '';
    const isThisMonth = isClientRenewalInMonth(client, refMonthStr);

    if (client.renewalStatus === 'aberto' || isThisMonth) {
      msg = `Olá ${client.name}! Tudo bem? Aqui é o ${myName} da CaZa dos Sorteios / Serviços Urbanos. Passando para avisar que a cobrança da renovação do seu ${planText} está programada para este período (${client.cycle.renewalBillingDisplay}), para que você continue protegido com a apólice MBM de R$ 5.000, telemedicina 24h e números da sorte ativos! Posso te auxiliar com a renovação?`;
    } else if (client.renewalStatus === 'expirado') {
      msg = `Olá ${client.name}! Tudo bem? Aqui é o ${myName} da CaZa dos Sorteios. Notei que a vigência do seu ${planText} encerrou recentemente. Gostaria de te ajudar a renovar sua cobertura para reativar seu seguro e telemedicina?`;
    } else if (client.renewalStatus === 'pendente_adesao') {
      msg = `Olá ${client.name}! Tudo bem? Vi que você se cadastrou pelo meu link da CaZa dos Sorteios. Gostaria de conhecer os benefícios do Seguro Vida Light (MBM R$ 5.000 + Telemedicina 24h + Sorteios) a partir de R$ 29,99? Posso te enviar os detalhes por aqui!`;
    } else {
      msg = `Olá ${client.name}! Tudo bem? Aqui é o ${myName} da CaZa dos Sorteios. Passando para saber como está sua experiência com o ${planText} e deixar meu contato à disposição para qualquer dúvida ou para sua próxima renovação programada para ${client.cycle.renewalBillingDisplay}!`;
    }

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyReferralLink = () => {
    const code = profile?.referral_code || '';
    const link = `${window.location.origin}/cadastro?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link Ganha & Ganha copiado com sucesso!', { icon: '🔗' });
  };

  return (
    <AffiliateLayout title="Minhas Renovações">
      <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-12 space-y-8">
        
        {/* Header da Tela */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-midnight uppercase tracking-tighter flex items-center gap-3">
              <div className="size-11 bg-primary-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
                <CalendarClock size={24} />
              </div>
              Minhas Renovações
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">
              Acompanhe sua vigência e as datas de renovação dos seus clientes diretos do Seguro Vida Light.
            </p>
          </div>

          <button
            onClick={copyReferralLink}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-primary-blue/40 text-slate-700 hover:text-primary-blue rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Share2 size={16} className="text-primary-blue" />
            Copiar Link para Venda Direta
          </button>
        </div>

        {/* BARRA DE FILTRO DE MÊS / COMPETÊNCIA DE RENOVAÇÃO (Padrão RPA PF) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <Calendar size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider">
                    Mês de Cobrança da Renovação
                  </h4>
                  {isDefaultCompetence ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Mês Vigente
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-primary-blue/10 text-primary-blue rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Filtro por Mês
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtre os clientes cuja data de cobrança da renovação ocorre no mês selecionado
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
              {!isDefaultCompetence && (
                <button
                  onClick={handleResetToCurrent}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Voltar para o mês vigente"
                >
                  <RefreshCw size={12} />
                  Mês Vigente
                </button>
              )}

              {/* Controles de Navegação com Setas Esquerda/Direita */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                  title="Mês Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 text-center min-w-[160px]">
                  <span className="text-xs font-black text-midnight uppercase tracking-wider block capitalize">
                    {monthLabel}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {isDefaultCompetence ? 'Competência Aberta' : 'Mês Selecionado'}
                  </span>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                  title="Próximo Mês"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos para os Meses que Possuem Renovações Agendadas */}
          {upcomingRenewalMonths.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <CalendarClock size={14} className="text-primary-blue" />
                Meses com Renovações Agendadas:
              </span>
              {upcomingRenewalMonths.map(item => (
                <button
                  key={item.monthStr}
                  onClick={() => jumpToMonth(item.year, item.month)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    refMonthStr === item.monthStr
                      ? 'bg-primary-blue text-white shadow-sm shadow-primary-blue/30 ring-2 ring-primary-blue/30'
                      : 'bg-slate-100 hover:bg-primary-blue/10 text-slate-700 hover:text-primary-blue'
                  }`}
                >
                  <span className="capitalize">{item.display}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    refMonthStr === item.monthStr ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count} {item.count === 1 ? 'cliente' : 'clientes'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. CARD DA ASSINATURA / RENOVAÇÃO DO PRÓPRIO AFILIADO (Mantido) */}
        {subscription ? (() => {
          const cycle = calculateSubscriptionRepasseCycle(subscription.start_date, subscription.plan_type, subscription.end_date);
          const isOwnRenewalInSelectedMonth = cycle.renewalBillingMonthStr === refMonthStr;
          return (
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-blue"></div>
              
              <div className="flex items-center gap-5">
                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  subscription.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                      Sua Proteção Ativa
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      (Microfranqueado)
                    </span>
                    {isOwnRenewalInSelectedMonth && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        Sua renovação neste mês!
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-midnight uppercase tracking-tight">
                    Plano {subscription.plan_type}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Início: <strong className="text-slate-700">{cycle.startDisplay}</strong> • 1º Repasse: <strong className="text-slate-700">{cycle.firstRepasseDisplay}</strong> • Último: <strong className="text-slate-700">{cycle.lastRepasseDisplay}</strong>
                  </p>
                </div>
              </div>

              <div className={`border px-6 py-4 rounded-2xl shrink-0 text-left sm:text-right w-full sm:w-auto ${
                isOwnRenewalInSelectedMonth
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-primary-blue/5 border-primary-blue/15'
              }`}>
                <span className="text-[10px] font-black text-primary-blue uppercase tracking-widest block leading-none mb-1.5">
                  Cobrança da sua Renovação
                </span>
                <span className="text-base font-black text-midnight uppercase tracking-tight block">
                  {cycle.renewalBillingDisplay}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block mt-1">
                  (Mês anterior ao último repasse)
                </span>
              </div>
            </div>
          );
        })() : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">Seu Plano</p>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">
                  Nenhuma assinatura ativa encontrada no momento
                </h4>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 max-w-xs text-right leading-relaxed">
              Regularize sua fatura na tela inicial para ativar seu plano e proteção.
            </span>
          </div>
        )}

        {/* 2. SEÇÃO DE RENOVAÇÕES DOS CLIENTES DE INDICAÇÃO DIRETA (G0) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-midnight uppercase tracking-tight">
                  Renovações de Clientes Diretos (Seguro Vida Light)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary-blue/10 text-primary-blue border border-primary-blue/20">
                  Vendas Diretas G0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Acompanhe o vencimento de cada cliente que contratou o seguro por sua indicação e entre em contato no WhatsApp para garantir sua comissão contínua.
              </p>
            </div>
          </div>

          {/* Cards de Métricas da Carteira de Clientes Diretos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Clientes Diretos
              </span>
              <p className="text-2xl font-black text-midnight font-mono">{counts.total}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">Indicados na sua carteira G0</span>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
              counts.mesRenovacoes > 0
                ? 'bg-gradient-to-br from-white to-amber-50/60 border-amber-300 shadow-amber-500/10'
                : 'bg-white border-slate-200/80'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-widest block mb-1 flex items-center gap-1.5 text-primary-blue">
                {counts.mesRenovacoes > 0 && <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>}
                Renovações em {monthLabel}
              </span>
              <p className="text-2xl font-black text-midnight font-mono">
                {counts.mesRenovacoes}
              </p>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block capitalize">
                {counts.mesRenovacoes > 0 
                  ? 'Cobrança neste mês' 
                  : 'Sem renovações neste mês'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-1">
                Cobrança Aberta (Prioridade)
              </span>
              <p className="text-2xl font-black text-amber-800 font-mono">{counts.aberto}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">Necessitam de contato urgente</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Sua Comissão G0
              </span>
              <p className="text-2xl font-black text-midnight font-mono">10% + 2%</p>
              <span className="text-[10px] text-primary-blue font-bold mt-1 block">A cada renovação confirmada</span>
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente direto por nome, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-medium text-xs text-midnight"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('mes')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'mes' 
                    ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/20' 
                    : 'bg-primary-blue/10 text-primary-blue border border-primary-blue/20 hover:bg-primary-blue/20'
                }`}
              >
                <Calendar size={13} />
                <span className="capitalize">Renovações de {monthLabel} ({counts.mesRenovacoes})</span>
              </button>

              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'todos' 
                    ? 'bg-midnight text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toda a Carteira ({counts.total})
              </button>

              <button
                onClick={() => setStatusFilter('aberto')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'aberto' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="size-1.5 rounded-full bg-amber-400"></span>
                Cobrança Aberta ({counts.aberto})
              </button>

              <button
                onClick={() => setStatusFilter('vigente')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'vigente' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Vigentes ({counts.vigente})
              </button>

              <button
                onClick={() => setStatusFilter('pendente')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pendente' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendentes ({counts.pendente})
              </button>
            </div>
          </div>

          {/* Lista de Clientes Diretos e suas Renovações */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="size-8 border-4 border-slate-200 border-t-primary-blue rounded-full animate-spin"></div>
                <p className="font-medium text-sm">Carregando carteira de clientes diretos...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center max-w-lg mx-auto">
                <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                  <CalendarClock size={38} className="text-primary-blue" />
                </div>
                <h3 className="text-lg font-black text-midnight uppercase tracking-wide mb-2 capitalize">
                  {statusFilter === 'mes'
                    ? `Nenhuma renovação a vencer em ${monthLabel}`
                    : searchTerm 
                    ? 'Nenhum cliente encontrado na busca' 
                    : 'Nenhuma Renovação de Cliente Direto'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {statusFilter === 'mes' ? (
                    counts.mesAdesoes > 0 ? (
                      <>
                        Você possui <strong>{counts.mesAdesoes} cliente(s)</strong> que iniciaram suas apólices em <strong>{monthLabel}</strong>. Como o plano contratado é <strong>Semestral (6 meses de cobertura)</strong>, a cobrança de renovação deles só vencerá em <strong>Março de 2027</strong>.
                      </>
                    ) : (
                      `Nenhum dos seus ${counts.total} clientes diretos tem cobrança de renovação programada para ${monthLabel}.`
                    )
                  ) : searchTerm 
                    ? 'Tente ajustar os termos de pesquisa ou remover os filtros aplicados.' 
                    : 'Quando você compartilhar o seu Código Ganha & Ganha e as pessoas comprarem o Seguro Vida Light, as datas de vencimento e renovação delas aparecerão automaticamente nesta lista com o botão do WhatsApp pronto para você fazer o contato.'}
                </p>

                {statusFilter === 'mes' ? (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {upcomingRenewalMonths.length > 0 && (
                      <button
                        onClick={() => jumpToMonth(upcomingRenewalMonths[0].year, upcomingRenewalMonths[0].month)}
                        className="px-5 py-2.5 bg-primary-blue hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary-blue/20 transition-all cursor-pointer"
                      >
                        <Calendar size={14} />
                        <span>Ir para {upcomingRenewalMonths[0].display} ({upcomingRenewalMonths[0].count} renovações) →</span>
                      </button>
                    )}
                    <button
                      onClick={() => setStatusFilter('todos')}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <User size={14} />
                      <span>Ver Toda a Carteira ({counts.total})</span>
                    </button>
                  </div>
                ) : !searchTerm && (
                  <button
                    onClick={copyReferralLink}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Share2 size={16} />
                    Copiar Meu Link Ganha & Ganha
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredClients.map((client, idx) => {
                  const isRenewalThisMonth = isClientRenewalInMonth(client, refMonthStr);
                  return (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={client.id}
                    className="p-6 hover:bg-slate-50/80 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    {/* Dados do Cliente */}
                    <div className="flex items-start sm:items-center gap-4 flex-1">
                      <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-primary-blue font-black text-sm shrink-0 shadow-sm">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-midnight text-sm tracking-tight">
                            {client.name}
                          </h4>
                          
                          {client.isMicrofranqueado ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              Microfranqueado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              Cliente Seguro Vida Light (Direto)
                            </span>
                          )}

                          {/* Tag de Status da Renovação */}
                          {isRenewalThisMonth && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-sm">
                              <Calendar size={10} />
                              Renovação em {client.cycle.renewalBillingDisplay}
                            </span>
                          )}

                          {client.renewalStatus === 'aberto' && !isRenewalThisMonth && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-sm">
                              <span className="size-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              Cobrança Aberta
                            </span>
                          )}
                          {client.renewalStatus === 'vigente' && !isRenewalThisMonth && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Vigente
                            </span>
                          )}
                          {client.renewalStatus === 'expirado' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              Expirado
                            </span>
                          )}
                          {client.renewalStatus === 'pendente_adesao' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              Aguardando Adesão
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          {client.whatsapp && (
                            <span className="flex items-center gap-1 text-slate-600 font-mono">
                              <Phone size={12} className="text-emerald-600" />
                              {client.whatsapp}
                            </span>
                          )}
                          {client.email && client.email !== 'Não informado' && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Mail size={12} />
                              {client.email}
                            </span>
                          )}
                          {(client.city || client.state) && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <MapPin size={12} />
                              {client.city} {client.state ? `- ${client.state}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Datas de Renovação e Repasse */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                      
                      {/* Plano e Vigência */}
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Plano do Seguro
                        </span>
                        <p className="font-bold text-midnight text-xs mt-0.5">
                          {client.hasPolicy ? `Plano ${client.planType} (R$ ${client.price.toFixed(2).replace('.', ',')})` : 'Sem Plano Ativo'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Início: {client.cycle.startDisplay}
                        </span>
                      </div>

                      {/* Cobrança da Renovação em Destaque */}
                      <div className={`p-3 rounded-2xl text-left lg:text-right border ${
                        client.renewalStatus === 'aberto' || isRenewalThisMonth
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900 shadow-sm'
                          : client.hasPolicy
                          ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span className="text-[9px] font-black uppercase tracking-widest block leading-none mb-1">
                          Cobrança da Renovação
                        </span>
                        <span className="text-xs font-black uppercase tracking-tight block">
                          {client.hasPolicy ? client.cycle.renewalBillingDisplay : '---'}
                        </span>
                        <span className="text-[9px] font-medium opacity-80 block mt-0.5">
                          {client.hasPolicy ? `Apólice até ${client.cycle.lastRepasseDisplay}` : 'Aguardando compra'}
                        </span>
                      </div>

                      {/* Botão de Contato WhatsApp */}
                      <div className="flex items-center gap-2">
                        {client.whatsapp ? (
                          <button
                            onClick={() => openWhatsAppContact(client)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                            title="Conversar no WhatsApp sobre a Renovação"
                          >
                            <MessageCircle size={15} />
                            <span>WhatsApp</span>
                          </button>
                        ) : (
                          <span className="px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold">
                            Sem WhatsApp
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDetailsModal(true);
                          }}
                          className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Ver Detalhes do Cliente"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )})}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE DETALHES DO CLIENTE E RENOVAÇÃO */}
      <AnimatePresence>
        {showDetailsModal && selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDetailsModal(false)} 
              className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1, y: 0 }} 
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center font-black">
                    {selectedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-midnight uppercase tracking-tight">
                      {selectedClient.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedClient.isMicrofranqueado ? 'Microfranqueado da Rede' : 'Cliente Seguro Vida Light (Direto)'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="size-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corpo */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto text-xs">
                
                {/* Quadro de Status de Renovação */}
                <div className={`p-5 rounded-2xl border ${
                  selectedClient.renewalStatus === 'aberto' || isClientRenewalInMonth(selectedClient, refMonthStr)
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : selectedClient.hasPolicy
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      Situação da Renovação
                    </span>
                    <span className="font-bold text-xs uppercase">
                      {selectedClient.renewalStatus === 'aberto' ? 'Cobrança Aberta (Prioridade)' :
                       selectedClient.renewalStatus === 'vigente' ? 'Vigente / Cobertura Ativa' :
                       selectedClient.renewalStatus === 'expirado' ? 'Ciclo Expirado' : 'Aguardando Adesão'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    {selectedClient.renewalStatus === 'aberto' 
                      ? `A cobrança da renovação deste cliente está prevista para ${selectedClient.cycle.renewalBillingDisplay} (mês imediatamente anterior ao último repasse). Entre em contato no WhatsApp para oferecer suporte na renovação.`
                      : selectedClient.hasPolicy
                      ? `Apólice vigente até ${selectedClient.cycle.lastRepasseDisplay}. A renovação será aberta em ${selectedClient.cycle.renewalBillingDisplay}.`
                      : 'O cliente cadastrou-se pelo seu link mas ainda não concluiu a contratação da apólice.'}
                  </p>
                </div>

                {/* Dados da Assinatura */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cronograma do Ciclo da Apólice
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Plano</span>
                      <strong className="text-slate-700">Plano {selectedClient.planType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Valor Contratado</span>
                      <strong className="text-slate-700">R$ {selectedClient.price.toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Início da Cobertura</span>
                      <strong className="text-slate-700">{selectedClient.cycle.startDisplay}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">1º Repasse de Comissão</span>
                      <strong className="text-slate-700">{selectedClient.cycle.firstRepasseDisplay}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mês da Cobrança</span>
                      <strong className="text-amber-700">{selectedClient.cycle.renewalBillingDisplay}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Último Repasse</span>
                      <strong className="text-slate-700">{selectedClient.cycle.lastRepasseDisplay}</strong>
                    </div>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Canais de Contato
                  </h5>
                  <p className="text-slate-700"><strong>WhatsApp:</strong> <span className="font-mono">{selectedClient.whatsapp || 'Não informado'}</span></p>
                  <p className="text-slate-700"><strong>E-mail:</strong> {selectedClient.email}</p>
                  <p className="text-slate-700"><strong>Localidade:</strong> {selectedClient.city} {selectedClient.state ? `- ${selectedClient.state}` : ''}</p>
                  <p className="text-slate-700"><strong>Data de Cadastro:</strong> {selectedClient.joinedDate}</p>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                {selectedClient.whatsapp && (
                  <button
                    onClick={() => openWhatsAppContact(selectedClient)}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    Conversar no WhatsApp
                  </button>
                )}

                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-midnight rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AffiliateLayout>
  );
}
