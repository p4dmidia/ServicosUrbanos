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
  const [activeTab, setActiveTab] = useState<'transactions' | 'deals'>('deals');

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
            reseller_id
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

      setRegionalEarnings(totalReg);
      setRegWeeklyEarnings(weeklyReg);
      setRegMonthlyEarnings(monthlyReg);
      setRegAnnualEarnings(annualReg);
      setRegionalConfig(regConfigRes.data);
      setTransactions(transactionsList);

      // Buscar nomes dos patrocinadores para a lista de fechamentos
      const deals = dealsRes.data || [];
      const sponsorIds = [...new Set(deals.map(d => d.referred_by).filter(Boolean))];
      
      let sponsorsMap = new Map();
      if (sponsorIds.length > 0) {
        const { data: sponsors } = await supabase
          .from('profiles')
          .select('id, full_name, cpf')
          .in('id', sponsorIds);
        sponsorsMap = new Map((sponsors || []).map(s => [s.id, s]));
      }

      const formattedDeals = deals.map(d => ({
        ...d,
        sponsor: sponsorsMap.get(d.referred_by) || (d.referred_by === user.id ? { full_name: 'Você (Direto)' } : null)
      }));

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
            <p className="text-slate-500 font-medium mt-1">Realize apresentações, feche cadastros e receba comissão direta sobre cada venda.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Ganhos Acumulados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <TrendingUp size={120} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-white/10 text-white">
                <TrendingUp size={22} />
              </div>
              <div className="text-[9px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase">
                Comissão Acumulada
              </div>
            </div>
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Ganhos Regionais Extras</p>
            <h3 className="text-2xl font-black text-white tracking-tighter">
              R$ {regionalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex gap-4 pt-4 border-t border-white/10 mt-4 font-black text-[10px] text-white/90">
              <div>
                <span className="text-white/50 block uppercase text-[7px]">Semanal</span>
                <span className="font-mono text-xs">R$ {regWeeklyEarnings.toFixed(2).replace('.', ',')}</span>
              </div>
              <div>
                <span className="text-white/50 block uppercase text-[7px]">Mensal</span>
                <span className="font-mono text-xs">R$ {regMonthlyEarnings.toFixed(2).replace('.', ',')}</span>
              </div>
              <div>
                <span className="text-white/50 block uppercase text-[7px]">Anual</span>
                <span className="font-mono text-xs">R$ {regAnnualEarnings.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Taxas Ativas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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

        {/* Seletor de Abas */}
        <div className="flex gap-3 border-b border-slate-200/80 pb-4">
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'deals'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/60'
            }`}
          >
            <Users size={16} />
            Meus Fechamentos ({closedDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/60'
            }`}
          >
            <DollarSign size={16} />
            Extrato de Comissões ({transactions.length})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'deals' ? (
          /* Tabela de Fechamentos Realizados */
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
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comissão de Revendedor</th>
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
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                            6% por adesão
                          </span>
                          <span className="text-[8px] text-slate-400 block font-bold">
                            (2% Sem. + 2% Mens. + 2% Anual)
                          </span>
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
        ) : (
          /* Tabela de Extrato de Comissões Regionais */
          <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-midnight uppercase tracking-tighter italic">Histórico de Comissões</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Lista completa de comissões recebidas por fechamentos e vendas diretas.</p>
              </div>
              <div className="size-10 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
            </div>

            <div className="overflow-x-auto">
              {transactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isPaid = tx.status === 'completed' || tx.status === 'pago';
                      return (
                        <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="size-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                                <DollarSign size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-midnight uppercase tracking-tight">{tx.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {isPaid ? 'Pago' : 'Confirmado'}
                            </span>
                          </td>
                          <td className="p-6 text-xs font-bold text-slate-500">
                            {new Date(tx.created_at).toLocaleDateString('pt-BR')} às {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-6 text-right text-xs font-black text-midnight font-mono">
                            R$ {Number(tx.amount || 0).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-16 text-center">
                  <div className="size-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Target size={28} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Nenhuma comissão de revendedor registrada por enquanto.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AffiliateLayout>
  );
}
