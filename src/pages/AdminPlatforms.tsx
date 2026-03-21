import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Power, 
  Activity, 
  ExternalLink,
  Settings2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

interface Platform {
  id: string;
  name: string;
  slug: string;
  status: 'online' | 'maintenance' | 'offline';
  users: string;
  revenue: string;
  uptime: string;
  lastUpdate: string;
  iconColor: string;
}

export default function AdminPlatforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { 
      id: '1', 
      name: 'UrbaShop', 
      slug: 'marketplace', 
      status: 'online', 
      users: '32,450', 
      revenue: 'R$ 840.200', 
      uptime: '99.9%', 
      lastUpdate: 'há 5 min',
      iconColor: 'bg-indigo-500'
    },
    { 
      id: '2', 
      name: 'UrbaFood', 
      slug: 'delivery', 
      status: 'maintenance', 
      users: '12,100', 
      revenue: 'R$ 125.400', 
      uptime: '98.5%', 
      lastUpdate: 'há 1 dia',
      iconColor: 'bg-orange-500'
    },
    { 
      id: '3', 
      name: 'UrbaService', 
      slug: 'services', 
      status: 'offline', 
      users: '--', 
      revenue: '--', 
      uptime: '0%', 
      lastUpdate: 'há 12 dias',
      iconColor: 'bg-red-500'
    },
    { 
      id: '4', 
      name: 'UrbaPay', 
      slug: 'fintech', 
      status: 'online', 
      users: '45,000', 
      revenue: 'R$ 2.400.000', 
      uptime: '100%', 
      lastUpdate: 'há 2 min',
      iconColor: 'bg-emerald-500'
    },
  ]);

  const toggleStatus = (id: string) => {
    setPlatforms(platforms.map(p => {
      if (p.id === id) {
        const nextStatus: Platform['status'] = p.status === 'online' ? 'maintenance' : p.status === 'maintenance' ? 'offline' : 'online';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  return (
    <AdminLayout title="Plataformas" subtitle="Gestão de Aplicativos do Ecossistema Urbano">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Filtrar plataformas..." 
              className="w-full bg-[#0a0e17] border border-white/5 py-3 pl-10 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
              <Filter size={16} />
              Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
              <Plus size={16} />
              Nova Plataforma
            </button>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence mode='popLayout'>
            {platforms.map((platform, i) => (
              <motion.div 
                key={platform.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  platform.status === 'online' ? 'bg-emerald-500' : 
                  platform.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                }`} />

                <div className="flex items-start justify-between mb-8">
                  <div className={`size-14 rounded-2xl ${platform.iconColor} flex items-center justify-center shadow-lg transform group-hover:-rotate-6 transition-transform`}>
                    <Globe className="text-white" size={28} />
                  </div>
                  <button className="text-slate-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{platform.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${
                      platform.status === 'online' ? 'bg-emerald-500 animate-pulse' : 
                      platform.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{platform.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Users size={10} /> Usuários
                    </p>
                    <p className="text-sm font-black text-white">{platform.users}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CreditCard size={10} /> Receita
                    </p>
                    <p className="text-sm font-black text-white">{platform.revenue}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Atualizado {platform.lastUpdate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(platform.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg"
                      title="Alternar Status"
                    >
                      <Power size={16} />
                    </button>
                    <button className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all shadow-lg">
                      <Settings2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Global Ecosystem Health */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Activity size={240} className="text-indigo-500" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <CheckCircle2 size={14} /> Sistemas Operacionais
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">Integritade do Ecossistema</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Atualmente, 75% das plataformas integradas estão operando dentro dos parâmetros de normalidade. UrbaPay apresenta o maior volume transacional das últimas 24 horas.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Uptime Médio</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">99.4%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Latência</p>
                <p className="text-3xl font-black text-indigo-400 italic tracking-tighter">24ms</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Plataformas</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">04</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Alertas</p>
                <p className="text-3xl font-black text-orange-500 italic tracking-tighter">01</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
