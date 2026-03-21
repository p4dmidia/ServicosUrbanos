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
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const stats = [
    { title: 'Faturamento Global', value: 'R$ 1.250.890,00', trend: '+18.2%', isPositive: true, icon: CreditCard, color: 'text-indigo-500' },
    { title: 'Usuários Ativos', value: '45.672', trend: '+5.4%', isPositive: true, icon: Users, color: 'text-purple-500' },
    { title: 'Lojistas UrbaShop', value: '1,234', trend: '+12.1%', isPositive: true, icon: Store, color: 'text-emerald-500' },
    { title: 'Comissões MMN', value: 'R$ 89.430,00', trend: '-2.1%', isPositive: false, icon: Zap, color: 'text-amber-500' },
  ];

  const platforms = [
    { name: 'UrbaShop', status: 'Online', users: '32k', uptime: '99.9%', health: 100 },
    { name: 'UrbaFood', status: 'Em Breve', users: '--', uptime: '--', health: 0 },
    { name: 'UrbaService', status: 'Offline', users: '--', uptime: '--', health: 0 },
  ];

  return (
    <AdminLayout title="Painel de Controle" subtitle="Visão Geral do Ecossistema Serviços Urbanos">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {[
                { type: 'Info', text: 'Novo backup gerado com sucesso.', time: '14:30' },
                { type: 'Warning', text: 'Pico de tráfego detectado no UrbaShop.', time: '13:45' },
                { type: 'Success', text: 'Plano de MMN atualizado pelo Admin.', time: '11:20' },
                { type: 'Error', text: 'Falha na conexão com UrbaService.', time: '09:15' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`size-2 mt-1.5 rounded-full shrink-0 ${log.type === 'Success' ? 'bg-emerald-500' : log.type === 'Warning' ? 'bg-amber-500' : log.type === 'Error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                  <div>
                    <p className="text-xs text-white/80 font-medium leading-relaxed">{log.text}</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{log.time} • Local Server</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
              Ver Logs Completos
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
