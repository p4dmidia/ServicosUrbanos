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
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

export default function MerchantReports() {
  const [period, setPeriod] = useState('30d');

  const kpis = [
    { title: 'Receita Bruta', value: 'R$ 45.890,00', trend: '+12.5%', isPositive: true },
    { title: 'Ticket Médio', value: 'R$ 185,50', trend: '+5.2%', isPositive: true },
    { title: 'Taxa de Conversão', value: '3.8%', trend: '-1.1%', isPositive: false },
    { title: 'CAC', value: 'R$ 45,00', trend: '-8.4%', isPositive: true },
  ];

  return (
    <MerchantLayout title="Relatórios e Análises" subtitle="Métricas de desempenho da sua loja">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
            {['7d', '15d', '30d', 'ytd'].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-midnight text-white shadow-xl shadow-midnight/20' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {p === '7d' ? '7 Dias' : p === '15d' ? '15 Dias' : p === '30d' ? '30 Dias' : 'Este Ano'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-midnight uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <Calendar size={16} className="text-primary-blue" />
              Personalizado
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary-blue hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-blue/20">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{kpi.title}</p>
                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {kpi.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.trend}
                </span>
              </div>
              <h3 className="text-3xl font-black text-midnight tracking-tighter">{kpi.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Charts Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Evolução de Vendas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receita vs Quantidade de Pedidos</p>
              </div>
              <div className="size-12 bg-primary-blue/10 rounded-2xl flex items-center justify-center text-primary-blue">
                <LineChart size={24} />
              </div>
            </div>

            <div className="flex-1 relative min-h-[300px] flex items-end justify-between gap-2">
              {/* Simulated Chart Bars */}
              {[40, 60, 45, 80, 55, 90, 75, 100, 65, 85, 70, 95].map((height, i) => (
                <div key={i} className="relative w-full flex flex-col justify-end group h-full">
                  <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-midnight text-white text-[10px] font-black px-3 py-2 rounded-xl -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none mb-2 whitespace-nowrap z-10 shadow-xl">
                    R$ {((height / 100) * 5000).toFixed(2)}
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.05, duration: 1, type: "spring" }}
                    className="w-full bg-slate-100 group-hover:bg-primary-blue rounded-t-lg transition-colors cursor-pointer"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-6">
              <span>01 Nov</span>
              <span>15 Nov</span>
              <span>30 Nov</span>
            </div>
          </div>

          {/* Secondary Charts Stack */}
          <div className="space-y-8">
            {/* Top Categories */}
            <div className="bg-midnight p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 size-40 bg-purple-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Top Categorias</h3>
                <PieChart className="text-slate-400" size={20} />
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { name: 'Eletrônicos', percent: 45, color: 'bg-primary-blue' },
                  { name: 'Vestuário', percent: 30, color: 'bg-emerald-500' },
                  { name: 'Acessórios', percent: 15, color: 'bg-purple-500' },
                  { name: 'Outros', percent: 10, color: 'bg-slate-600' }
                ].map((cat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">
                      <span>{cat.name}</span>
                      <span className="text-white">{cat.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percent}%` }}
                        transition={{ delay: i * 0.2, duration: 1 }}
                        className={`h-full ${cat.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Insights */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-midnight uppercase tracking-widest">Insights</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Dicas para sua loja</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="size-2 rounded-full bg-emerald-500 mt-1.5" />
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">Sua taxa de conversão em <strong>Eletrônicos</strong> está 12% acima da média do marketplace.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-2 rounded-full bg-red-500 mt-1.5" />
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">Produtos sem foto perdem até 80% das chances de venda. Atualize seu catálogo.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-2 rounded-full bg-primary-blue mt-1.5" />
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">Aumentar o cashback em 2% pode impulsionar suas vendas em até 15%.</p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </MerchantLayout>
  );
}
