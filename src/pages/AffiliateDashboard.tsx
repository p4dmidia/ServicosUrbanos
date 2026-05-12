import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Target,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [statsData, activityData] = await Promise.all([
          businessRules.getAffiliateStats(user.id),
          businessRules.getEcosystemActivity(user.id)
        ]);
        
        setStats(statsData);
        setActivity(activityData);
        
        // Use referral_code from profile context if available, fallback to user.id
        // This avoids making a failing query if the migration hasn't been run yet
        const referralCode = profile?.referral_code || user.id;
        setLinks(businessRules.getAffiliateLinks(referralCode));
      } catch (error) {
        console.error("Error loading dashboard:", error);
        // Fallback even on error to show links
        setLinks(businessRules.getAffiliateLinks(user.id));
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, profile]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado com sucesso!', {
      style: {
        borderRadius: '16px',
        background: '#0a0e17',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    });
  };

  if (loading || !stats) {
    return (
      <AffiliateLayout title="Escritório Virtual">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Escritório Virtual">
      <div className="p-8 lg:p-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-midnight tracking-tight italic uppercase">Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Afiliado'}!</h1>
            <p className="text-slate-500 font-medium">Acompanhe seu desempenho e gerencie suas indicações.</p>
          </div>
          <Link 
            to="/marketplace" 
            className="inline-flex items-center gap-3 bg-midnight text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-midnight/10 hover:bg-slate-800 transition-all group"
          >
            <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
            Visitar Marketplace
          </Link>
        </div>
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <TrendingUp size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                 Cashback Mensal
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acúmulo por Nível</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter text-blue-600">
              R$ {stats.monthlyBonus.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                 Cashback Anual
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acúmulo por Nível</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter text-emerald-600">
              R$ {stats.annualBonus.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <Wallet size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                 Carteira Digital (CD)
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo para Resgate</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              R$ {stats.availableBalance.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white p-6 rounded-3xl border-2 transition-all shadow-sm ${stats.isEligible ? 'border-emerald-500 bg-emerald-50/10' : 'border-amber-200 bg-amber-50/10'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stats.isEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Target size={22} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase ${stats.isEligible ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                {stats.isEligible ? 'Elegível' : 'Pendente'}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Meta: 1 Consumo Mensal</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              {stats.consumptionCount} / 1 <span className="text-sm font-medium text-slate-400">serviço</span>
            </h3>
          </motion.div>
        </div>

        {/* Action & Links Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Referral Links Card */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
               <Target size={240} className="text-midnight" />
            </div>

            <div className="relative z-10 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-midnight tracking-tight mb-2 italic uppercase">Indique e Ganhe</h2>
                <p className="text-slate-500 font-medium">
                  Indique uma vez, ganhe sempre. <br />
                  Receba Cashback mensal, digital e anual recorrentes sobre todas as compras que seus indicados fizerem.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {links.map((link: any) => (
                  <div key={link.id} className="bg-white p-6 rounded-3xl border border-slate-200 group/link hover:border-primary-blue hover:shadow-xl hover:shadow-primary-blue/10 transition-all">
                    <p className="text-[10px] font-black text-primary-blue uppercase tracking-widest mb-2">{link.name}</p>
                    <p className="text-xs text-slate-600 font-bold mb-4">{link.description}</p>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-mono text-[10px] text-slate-500 overflow-hidden truncate">
                          {link.url}
                       </div>
                       <button 
                         onClick={() => copyToClipboard(link.url)}
                         className="p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-blue hover:text-primary-blue transition-all"
                        >
                         <Copy size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="flex items-center gap-3 text-sm font-black text-primary-blue bg-primary-blue/5 px-8 py-4 rounded-2xl hover:bg-primary-blue hover:text-white transition-all">
                Ver Todos os Links de Indicação
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Real Quick Stats/Summary */}
          <div className="bg-midnight rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-midnight/20">
             <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-primary-blue/20 rounded-full blur-[80px]"></div>
             
             <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desempenho da Rede</p>
               <h3 className="text-3xl font-black tracking-tighter mb-8 italic uppercase text-emerald-400">Status {stats.rank}</h3>
               
               <div className="space-y-6">
                 {[
                   { label: 'Indicações G1', value: stats.networkSummary.g1, max: 100, color: 'bg-emerald-500' },
                   { label: 'Rede Indireta', value: stats.networkSummary.total - stats.networkSummary.g1, max: 500, color: 'bg-primary-blue' },
                   { label: 'Alcance G4', value: stats.networkSummary.g4, max: 1000, color: 'bg-purple-500' },
                 ].map((item, i) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                       <span className="text-slate-400">{item.label}</span>
                       <span>{item.value}</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                         transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                         className={`h-full ${item.color}`}
                        />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-primary-blue flex items-center justify-center text-white">
                     <Users size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400">Total na Rede</p>
                     <p className="text-xl font-black">{stats.networkSummary.total} <span className="text-[10px] text-emerald-500">pessoas</span></p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Activity Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-black text-midnight tracking-tight italic uppercase">Atividade no Ecossistema</h2>
              <p className="text-slate-500 font-medium">Histórico de consumos e cashbacks gerados recentemente.</p>
            </div>
            <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-midnight transition-colors tracking-widest uppercase">
              Ver Histórico Completo
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Tipo/Serviço</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Bônus</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                      Nenhuma atividade recente encontrada.
                    </td>
                  </tr>
                ) : (
                  activity.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, i: number) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                    >
                      <td className="py-6 pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${
                              item.type === 'commission' || item.type === 'Comissão' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-blue/10 text-primary-blue'
                            }`}>
                              {item.type === 'commission' || item.type === 'Comissão' ? <ArrowUpRight size={18} /> : <ExternalLink size={18} />}
                            </div>
                            <span className="font-bold text-sm tracking-tight">{item.type === 'commission' || item.type === 'Comissão' ? 'Cashback' : item.type}</span>
                          </div>
                      </td>
                      <td className="py-6">
                        <p className="font-bold text-midnight text-sm max-w-xs truncate">{item.description}</p>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={14} />
                          <span className="text-xs font-bold">{item.date}</span>
                        </div>
                      </td>
                      <td className="py-6 text-right font-black text-midnight text-sm">
                        R$ {Number(item.amount).toFixed(2)}
                      </td>
                      <td className="py-6 text-right pr-4">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                           +{item.points} pts
                           <CheckCircle2 size={12} />
                         </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {activity.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-4 mt-10 pt-10 border-t border-slate-50">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="size-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary-blue hover:text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(activity.length / itemsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-10 rounded-xl font-black text-xs transition-all ${
                      currentPage === i + 1 
                        ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(activity.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(activity.length / itemsPerPage)}
                className="size-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary-blue hover:text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

        </div>

      </div>
    </AffiliateLayout>
  );
}
