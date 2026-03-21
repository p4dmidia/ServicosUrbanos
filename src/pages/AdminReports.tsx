import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  PieChart, 
  LineChart, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  DollarSign,
  Users,
  Store,
  ChevronRight,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('Últimos 30 dias');

  const mainKPIs = [
    { label: 'Volume Transacional (GMV)', value: 'R$ 1.250.890', trend: '+14.2%', icon: DollarSign, color: 'text-indigo-500' },
    { label: 'Receita Bruta (Comissões)', value: 'R$ 150.106', trend: '+8.5%', icon: Target, color: 'text-emerald-500' },
    { label: 'Crescimento de Rede', value: '1.450 novos', trend: '+12.1%', icon: Users, color: 'text-purple-500' },
    { label: 'Payout MMN', value: 'R$ 89.430', trend: '-2.4%', icon: Activity, color: 'text-amber-500' },
  ];

  return (
    <AdminLayout title="Relatórios e Analytics" subtitle="Inteligência de Dados do Ecossistema Urbano">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex p-1 bg-[#0a0e17] rounded-2xl border border-white/5">
            {['Hoje', '7 dias', '30 dias', '12 meses'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  dateRange.includes(range) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all">
              <Calendar size={16} /> Personalizado
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
              <Download size={16} /> Exportar Relatório
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {mainKPIs.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-8">
                  <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon size={24} />
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {kpi.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.trend}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-3xl font-black text-white tracking-tighter italic leading-none">{kpi.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Chart Mockup */}
          <div className="lg:col-span-2 bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 lg:p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-1">Evolução de Faturamento</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Comparativo de performance mensal</p>
              </div>
              <Activity className="text-indigo-500" size={24} />
            </div>

            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {[45, 60, 55, 80, 70, 90, 85, 95, 100, 110, 95, 120].map((height, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className={`w-full rounded-t-xl transition-all ${i === 11 ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[8px] font-black py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap">
                    R$ {(height * 10).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between px-4">
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(m => (
                <span key={m} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{m}</span>
              ))}
            </div>
          </div>

          {/* Platform Distribution Pie Chart Mockup */}
          <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 lg:p-10 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">Mix de Plataformas</h3>
              <PieChart className="text-indigo-500" size={20} />
            </div>

            <div className="relative size-48 mx-auto my-12">
              <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-indigo-600" strokeDasharray="180 251.2" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-purple-500" strokeDasharray="50 251.2" strokeDashoffset="-180" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-emerald-500" strokeDasharray="21.2 251.2" strokeDashoffset="-230" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-white tracking-tighter leading-none italic">100%</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'UrbaShop', percent: '72%', color: 'bg-indigo-600' },
                { label: 'UrbaPay', percent: '20%', color: 'bg-purple-500' },
                { label: 'Outros', percent: '8%', color: 'bg-emerald-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${item.color}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-white">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Global Performance Summary */}
        <div className="bg-indigo-600/5 rounded-[2.5rem] border border-indigo-500/10 p-10 lg:p-14 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <TrendingUp size={14} /> Insights Automáticos
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">Relatório de Crescimento</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                A UrbaShop registrou um aumento de 14.2% em relação ao mês anterior, impulsionada principalmente pela nova política de MMN. O custo de aquisição de novos usuários reduziu em 5%, indicando uma viralidade orgânica da rede SERVICES URBANOS.
              </p>
            </div>
            
            <button className="flex items-center gap-3 bg-white text-indigo-900 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-white/10 hover:bg-slate-200 transition-all active:scale-[0.98] group shrink-0">
              Assinatura BI Digital
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
