import React from 'react';
import { 
  BarChart3, 
  Users, 
  Store, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Globe,
  TrendingUp,
  Activity,
  ShieldCheck,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';

export default function AdminDashboard() {
  const [globalStats, setGlobalStats] = React.useState<any>(null);
  const [systemLogs, setSystemLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isLogsModalOpen, setIsLogsModalOpen] = React.useState(false);
  const [fullLogs, setFullLogs] = React.useState<any[]>([]);
  const [logFilter, setLogFilter] = React.useState<'all' | 'Success' | 'Warning' | 'Error' | 'Info'>('all');

  React.useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Carregar estatísticas globais
      try {
        const statsData = await businessRules.getAdminGlobalStats();
        setGlobalStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }

      // Carregar logs do sistema
      try {
        const logsData = await businessRules.getAdminSystemLogs();
        setSystemLogs(logsData || []);
      } catch (error) {
        console.error('Erro ao carregar logs:', error);
        setSystemLogs([]); // Fallback para lista vazia se a tabela não existir
      }

      setLoading(false);
    };
    loadDashboardData();
  }, []);

  const openLogsModal = async () => {
    setIsLogsModalOpen(true);
    try {
      const data = await businessRules.getAdminSystemLogs(50);
      setFullLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs completos:', error);
    }
  };

  const filteredLogs = fullLogs.filter(log => logFilter === 'all' || log.type === logFilter);
  const stats = [
    { 
      title: 'Faturamento Global', 
      value: `R$ ${globalStats?.revenueTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, 
      trend: `${(globalStats?.revenueTrend || 0) >= 0 ? '+' : ''}${globalStats?.revenueTrend?.toFixed(1) || '0'}%`, 
      isPositive: (globalStats?.revenueTrend || 0) >= 0, 
      icon: CreditCard, color: 'text-indigo-500' 
    },
    { 
      title: 'Usuários Ativos', 
      value: globalStats?.userCount?.toLocaleString('pt-BR') || '0', 
      trend: `${(globalStats?.userTrend || 0) >= 0 ? '+' : ''}${globalStats?.userTrend?.toFixed(1) || '0'}%`, 
      isPositive: (globalStats?.userTrend || 0) >= 0, 
      icon: Users, color: 'text-purple-500' 
    },
    { 
      title: 'Lojistas UrbaShop', 
      value: globalStats?.branchCount?.toLocaleString('pt-BR') || '0', 
      trend: `${(globalStats?.branchTrend || 0) >= 0 ? '+' : ''}${globalStats?.branchTrend?.toFixed(1) || '0'}%`, 
      isPositive: (globalStats?.branchTrend || 0) >= 0, 
      icon: Store, color: 'text-emerald-500' 
    },
    { 
      title: 'Cashbacks MMN', 
      value: `R$ ${globalStats?.commissionTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, 
      trend: `${(globalStats?.commissionTrend || 0) >= 0 ? '+' : ''}${globalStats?.commissionTrend?.toFixed(1) || '0'}%`, 
      isPositive: (globalStats?.commissionTrend || 0) >= 0, 
      icon: Zap, color: 'text-amber-500' 
    },
    { 
      title: 'Saques Pendentes', 
      value: (globalStats?.pendingWithdrawals || 0).toString(), 
      trend: 'Aguardando', 
      isPositive: (globalStats?.pendingWithdrawals || 0) === 0, 
      icon: DollarSign, color: 'text-red-500' 
    },
  ];

  const platforms = [
    { name: 'UrbaShop', status: 'Online', users: (globalStats?.userCount || 0) > 1000 ? `${((globalStats?.userCount || 0)/1000).toFixed(1)}k` : (globalStats?.userCount?.toString() || '0'), uptime: '99.9%', health: 100 },
    { name: 'UrbaFood', status: 'Em Breve', users: '--', uptime: '--', health: 0 },
    { name: 'UrbaService', status: 'Offline', users: '--', uptime: '--', health: 0 },
  ];

  return (
    <AdminLayout title="Painel de Controle" subtitle="Visão Geral do Ecossistema Serviços Urbanos">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon size={64} className={stat.color} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Platforms and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Platform Status */}
          <div className="lg:col-span-2 bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Status das Plataformas</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monitoramento em tempo real</p>
              </div>
              <Activity className="text-indigo-500" size={24} />
            </div>

            <div className="p-8 space-y-6">
              {platforms.map((platform, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${platform.health === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                      <Globe size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{platform.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${platform.status === 'Online' ? 'text-emerald-500' : 'text-slate-500'}`}>{platform.status}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex gap-12">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Usuários</p>
                      <p className="text-xs font-black text-white">{platform.users}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Uptime</p>
                      <p className="text-xs font-black text-white">{platform.uptime}</p>
                    </div>
                  </div>

                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${platform.health}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Notifications */}
          <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Log do Sistema</h3>
              <ShieldCheck className="text-indigo-500" size={20} />
            </div>

            <div className="space-y-6">
              {systemLogs.length > 0 ? (
                systemLogs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`size-2 mt-1.5 rounded-full shrink-0 ${log.type === 'Success' ? 'bg-emerald-500' : log.type === 'Warning' ? 'bg-amber-500' : log.type === 'Error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                    <div>
                      <p className="text-xs text-white/80 font-medium leading-relaxed">{log.text}</p>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{log.time} • Local Server</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <Activity size={32} className="text-slate-500 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>

            <button 
              onClick={openLogsModal}
              className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
            >
              Ver Logs Completos
            </button>
          </div>

        </div>
      </div>

      {/* Logs Modal */}
      <AnimatePresence>
        {isLogsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0e17] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Logs do Sistema</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Histórico completo de atividades</p>
                </div>
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="size-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all"
                >
                  <ShieldCheck size={24} />
                </button>
              </div>

              <div className="p-4 lg:p-6 border-b border-white/5 bg-white/5 flex flex-wrap gap-2">
                {[
                  { label: 'Todos', value: 'all' },
                  { label: 'Sucesso', value: 'Success' },
                  { label: 'Alertas', value: 'Warning' },
                  { label: 'Erros', value: 'Error' },
                  { label: 'Info', value: 'Info' }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setLogFilter(f.value as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      logFilter === f.value 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white/5 text-slate-500 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10 space-y-6">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                    >
                      <div className={`mt-2 size-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                        log.type === 'Success' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                        log.type === 'Warning' ? 'bg-amber-500 shadow-amber-500/20' : 
                        log.type === 'Error' ? 'bg-red-500 shadow-red-500/20' : 
                        'bg-indigo-500 shadow-indigo-500/20'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm lg:text-base text-white/90 font-bold leading-relaxed">{log.text}</p>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            #{i + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('pt-BR')} • {log.time}</p>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full">
                            <Activity size={10} className="text-indigo-400" />
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Local Server</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Activity size={48} className="text-slate-500 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Nenhum log encontrado para este filtro</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex flex-col items-center gap-1">
                <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-[0.2em]">Serviços Urbanos • Auditoria em Tempo Real</p>
                <p className="text-[8px] text-slate-700 lowercase font-medium tracking-normal opacity-30">
                  Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors underline decoration-indigo-400/20">P4D Mídia</a>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
