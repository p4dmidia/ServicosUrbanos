import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Building2,
  DollarSign,
  FileText,
  UserPlus,
  Sparkles,
  CheckCircle2,
  Shield,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export default function AffiliateResellerDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [regionalEarnings, setRegionalEarnings] = useState(0);
  const [regWeeklyEarnings, setRegWeeklyEarnings] = useState(0);
  const [regMonthlyEarnings, setRegMonthlyEarnings] = useState(0);
  const [regAnnualEarnings, setRegAnnualEarnings] = useState(0);
  const [regionalConfig, setRegionalConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [closedDeals, setClosedDeals] = useState<any[]>([]);

  const loadResellerData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 1. Carregar estatísticas gerais
      const statsData = await businessRules.getAffiliateStats(user.id);
      setStats(statsData);

      // 2. Carregar comissões regionais e configurações
      const [regTransRes, regConfigRes, historyRes, dealsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, description')
          .eq('profile_id', user.id)
          .like('description', '%Revendedor%'),
        supabase
          .from('mmn_config')
          .select('commission_regional_semanal, commission_regional_mensal, commission_regional_anual')
          .single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('profile_id', user.id)
          .or('description.ilike.%Revendedor%,description.ilike.%Regional%')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            cpf,
            whatsapp,
            created_at,
            role,
            referred_by,
            reseller_id,
            status
          `)
          .eq('reseller_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      const transactionsList = historyRes.data || [];
      const totalReg = transactionsList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
      
      const weeklyReg = transactionsList
        .filter(t => t.description?.includes('Semanal'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      
      const monthlyReg = transactionsList
        .filter(t => t.description?.includes('Mensal'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        
      const annualReg = transactionsList
        .filter(t => t.description?.includes('Anual'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const weekly = statsData?.availableBalance ?? statsData?.walletBonus ?? 0;
      const monthly = statsData?.monthlyBonus || 0;
      const annual = statsData?.annualBonus || 0;
      const total = statsData?.totalEarnings || (weekly + monthly + annual);

      setRegionalEarnings(total);
      setRegWeeklyEarnings(weekly);
      setRegMonthlyEarnings(monthly);
      setRegAnnualEarnings(annual);
      setRegionalConfig(regConfigRes.data);
      setTransactions(transactionsList);

      // Buscar membros e calcular status (ativo, cancelado ou inadimplente)
      const deals = dealsRes.data || [];
      const dealIds = deals.map(d => d.id);

      let subscriptionsMap = new Map();
      let ordersMap = new Map();

      if (dealIds.length > 0) {
        const [subsRes, ordersRes] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('profile_id, status, end_date')
            .in('profile_id', dealIds),
          supabase
            .from('orders')
            .select('customer_id, status, created_at')
            .in('customer_id', dealIds)
            .order('created_at', { ascending: false })
        ]);

        (subsRes.data || []).forEach(s => {
          subscriptionsMap.set(s.profile_id, s);
        });

        (ordersRes.data || []).forEach(o => {
          if (!ordersMap.has(o.customer_id)) {
            ordersMap.set(o.customer_id, o.status);
          }
        });
      }

      const sponsorIds = [...new Set(deals.map(d => d.referred_by).filter(Boolean))];
      
      let sponsorsMap = new Map();
      if (sponsorIds.length > 0) {
        const { data: sponsors } = await supabase
          .from('profiles')
          .select('id, full_name, cpf')
          .in('id', sponsorIds);
        sponsorsMap = new Map((sponsors || []).map(s => [s.id, s]));
      }

      const now = new Date();
      const formattedDeals = deals.map(d => {
        const sub = subscriptionsMap.get(d.id);
        const lastOrderStatus = ordersMap.get(d.id);

        let calculatedStatus: 'Ativo' | 'Cancelado' | 'Inadimplente' = 'Inadimplente';

        if (sub && sub.status === 'active' && new Date(sub.end_date) >= now) {
          calculatedStatus = 'Ativo';
        } else if (
          d.status === 'cancelled' || 
          d.status === 'cancelado' || 
          sub?.status === 'cancelled' || 
          lastOrderStatus === 'Cancelado'
        ) {
          calculatedStatus = 'Cancelado';
        } else {
          calculatedStatus = 'Inadimplente';
        }

        return {
          ...d,
          calculatedStatus,
          sponsor: sponsorsMap.get(d.referred_by) || (d.referred_by === user.id ? { full_name: 'Você (Direto)' } : null)
        };
      });

      setClosedDeals(formattedDeals);

    } catch (error) {
      console.error("Erro ao carregar dados do revendedor:", error);
      toast.error("Erro ao carregar dados de liderança regional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResellerData();
  }, [user]);

  if (loading) {
    return (
      <AffiliateLayout title="Painel do Revendedor">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Painel do Revendedor">
      <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header com Botão de Ação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles size={12} />
              Revendedor Autorizado
            </div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Target size={22} />
              </div>
              Painel do Revendedor
            </h1>
            <p className="text-slate-500 font-medium mt-1">Realize apresentações, feche cadastros e receba comissão direta sobre cada venda e renovações.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                const code = profile?.referral_code || user?.id;
                const link = `${window.location.origin}/cadastro?rev=${code}`;
                navigator.clipboard.writeText(link);
                toast.success('Link do Revendedor copiado!', {
                  style: {
                    borderRadius: '16px',
                    background: '#0a0e17',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }
                });
              }}
              className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-midnight font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              title="Copiar Link de Cadastro Direto do Revendedor"
            >
              <Copy size={16} className="text-amber-500" />
              Copiar Link
            </button>

            <Link
              to={`/cadastro?rev=${profile?.referral_code || user?.id}`}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 cursor-pointer active:scale-95 shrink-0"
            >
              <UserPlus size={18} />
              Cadastrar Novo Membro
            </Link>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Taxas Ativas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                <Target size={22} />
              </div>
              <div className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded-lg uppercase">
                Taxas Ativas
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bônus de Liderança Regional</p>
            <div className="flex gap-4 pt-1 font-black text-xs text-midnight">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">Semanal</span>
                <span className="text-purple-600 font-mono text-sm">+{regionalConfig?.commission_regional_semanal || '2.00'}%</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">Mensal</span>
                <span className="text-purple-600 font-mono text-sm">+{regionalConfig?.commission_regional_mensal || '2.00'}%</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">Anual</span>
                <span className="text-purple-600 font-mono text-sm">+{regionalConfig?.commission_regional_anual || '2.00'}%</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Indicados / Rede Regional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <Users size={22} />
              </div>
              <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                Rede Regional
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Membros na Linhagem Regional</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              {stats?.networkSummary?.total || 0} Membros
            </h3>
          </motion.div>
        </div>

        {/* Tabela de Fechamentos Realizados */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-midnight uppercase tracking-tighter italic">
                Adesões e Fechamentos Diretos
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Membros que você apresentou o plano e efetuou o cadastro no sistema.
              </p>
            </div>
            <div className="size-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="overflow-x-auto">
            {closedDeals.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Novo Membro</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patrocinador MMN (G1)</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Papel</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {closedDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0 font-black">
                            👤
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-midnight uppercase tracking-tight">{deal.full_name}</span>
                            <span className="text-[9px] text-slate-400 font-bold">CPF: {deal.cpf || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                            {deal.sponsor?.full_name || 'Direto do Revendedor'}
                          </span>
                          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                            {deal.referred_by === user?.id ? '⭐ Patrocinador Direto' : 'Indicador da Rede'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-wider">
                          {deal.role || 'Afiliado'}
                        </span>
                      </td>
                      <td className="p-6 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(deal.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-6 text-right">
                        {deal.calculatedStatus === 'Ativo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            Ativo
                          </span>
                        ) : deal.calculatedStatus === 'Cancelado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200/60 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                            <span className="size-1.5 rounded-full bg-red-500"></span>
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                            <span className="size-1.5 rounded-full bg-amber-500"></span>
                            Inadimplente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <div className="size-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={28} />
                </div>
                <h3 className="text-base font-black text-midnight uppercase tracking-tight mb-1">Nenhum fechamento registrado</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-6">
                  Clique no botão acima para cadastrar seu primeiro membro e começar a lucrar com vendas diretas.
                </p>
                <Link
                  to={`/cadastro?rev=${profile?.referral_code || user?.id}`}
                  className="bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-600 transition-all inline-block cursor-pointer"
                >
                  Cadastrar Primeiro Membro
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
