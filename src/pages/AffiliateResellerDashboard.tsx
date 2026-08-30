import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Building2,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [regionalConfig, setRegionalConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadResellerData() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 1. Carregar estatísticas gerais de indicações da rede do afiliado (para quantidade de membros)
        const statsData = await businessRules.getAffiliateStats(user.id);
        setStats(statsData);

        // 2. Carregar comissões regionais, configurações do MMN regional e histórico de transações regionais
        const [regTransRes, regConfigRes, historyRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('amount')
            .eq('profile_id', user.id)
            .like('description', '%Regional%'),
          supabase
            .from('mmn_config')
            .select('commission_regional_semanal, commission_regional_mensal, commission_regional_anual')
            .single(),
          supabase
            .from('transactions')
            .select('*')
            .eq('profile_id', user.id)
            .like('description', '%Regional%')
            .order('created_at', { ascending: false })
        ]);

        const totalReg = (regTransRes.data || []).reduce((acc, t) => acc + Number(t.amount || 0), 0);
        setRegionalEarnings(totalReg);
        setRegionalConfig(regConfigRes.data);
        setTransactions(historyRes.data || []);

      } catch (error) {
        console.error("Erro ao carregar dados do revendedor:", error);
        toast.error("Erro ao carregar dados de liderança regional.");
      } finally {
        setLoading(false);
      }
    }

    loadResellerData();
  }, [user]);

  if (loading) {
    return (
      <AffiliateLayout title="Liderança Regional">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Liderança Regional">
      <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
            <div className="size-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
              <Target size={22} />
            </div>
            Liderança Regional
          </h1>
          <p className="text-slate-500 font-medium mt-2">Acompanhe seu desempenho e comissões extras como Revendedor Regional da rede.</p>
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
              {stats?.total || 0} Membros
            </h3>
          </motion.div>
        </div>

        {/* Tabela de Extrato de Comissões Regionais */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-midnight uppercase tracking-tighter italic">Histórico de Repasses Regionais</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Lista completa de comissões recebidas pelo faturamento da sua região.</p>
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
                            <div className="size-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
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
                            {isPaid ? 'Pago' : 'Pendente'}
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
                <p className="text-sm font-bold text-slate-400">Nenhuma comissão regional registrada por enquanto.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
