import React from 'react';
import { 
  BarChart3, 
  Users, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  DollarSign,
  Calendar,
  ShieldCheck,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [globalStats, setGlobalStats] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Period Filters
  const [period, setPeriod] = React.useState<'today' | 'yesterday' | '7days' | '15days' | '30days' | 'custom'>('7days');
  const [chartType, setChartType] = React.useState<'revenue' | 'sales'>('revenue');
  const [customStart, setCustomStart] = React.useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = React.useState(new Date().toISOString().split('T')[0]);
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);

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

      // Carregar pedidos concluídos para análise de faturamento/gráficos
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, amount, order_date, status, created_at')
          .in('status', ['Pago, Aguardando Retirada', 'Concluído']);
        
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
      } catch (error) {
        console.error('Erro ao carregar pedidos para o dashboard:', error);
      }

      setLoading(false);
    };
    loadDashboardData();
  }, []);

  // Filtered orders based on selected period
  const filteredOrders = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    return orders.filter(order => {
      const dateStr = order.order_date || order.created_at;
      const orderDate = new Date(dateStr);
      
      if (period === 'today') {
        return orderDate >= todayStart;
      } else if (period === 'yesterday') {
        return orderDate >= yesterdayStart && orderDate < todayStart;
      } else if (period === '7days') {
        const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return orderDate >= limit;
      } else if (period === '15days') {
        const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15);
        return orderDate >= limit;
      } else if (period === '30days') {
        const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        return orderDate >= limit;
      } else if (period === 'custom') {
        const start = new Date(customStart + 'T00:00:00');
        const end = new Date(customEnd + 'T23:59:59');
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [orders, period, customStart, customEnd]);

  // Aggregated data for SVG Chart
  const chartData = React.useMemo(() => {
    if (period === 'today' || period === 'yesterday') {
      const slots = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      const faturamento = slots.map(() => 0);
      const vendas = slots.map(() => 0);

      filteredOrders.forEach(o => {
        const date = new Date(o.order_date || o.created_at);
        const hour = date.getHours();
        const idx = Math.floor(hour / 3);
        faturamento[idx] += Number(o.amount);
        vendas[idx] += 1;
      });

      return slots.map((label, idx) => ({
        label,
        faturamento: faturamento[idx],
        vendas: vendas[idx]
      }));
    } else {
      const dayMap: { [key: string]: { faturamento: number; vendas: number } } = {};
      const now = new Date();
      let daysCount = 7;
      if (period === '15days') daysCount = 15;
      if (period === '30days') daysCount = 30;
      
      if (period === 'custom') {
        const startD = new Date(customStart + 'T12:00:00');
        const endD = new Date(customEnd + 'T12:00:00');
        const diffTime = Math.abs(endD.getTime() - startD.getTime());
        daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;
        if (daysCount > 90) daysCount = 90; // visual cap
      }

      for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date();
        if (period === 'custom') {
          const endD = new Date(customEnd + 'T12:00:00');
          date.setTime(endD.getTime() - i * 24 * 60 * 60 * 1000);
        } else {
          date.setDate(now.getDate() - i);
        }
        const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dayMap[key] = { faturamento: 0, vendas: 0 };
      }

      filteredOrders.forEach(o => {
        const date = new Date(o.order_date || o.created_at);
        const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (dayMap[key]) {
          dayMap[key].faturamento += Number(o.amount);
          dayMap[key].vendas += 1;
        }
      });

      return Object.entries(dayMap).map(([label, val]) => ({
        label,
        faturamento: val.faturamento,
        vendas: val.vendas
      }));
    }
  }, [filteredOrders, period, customStart, customEnd]);

  const totalPeriodRevenue = React.useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + Number(o.amount), 0);
  }, [filteredOrders]);

  const totalPeriodSales = React.useMemo(() => {
    return filteredOrders.length;
  }, [filteredOrders]);

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
      title: 'Número de Revendedores', 
      value: globalStats?.resellerCount?.toLocaleString('pt-BR') || '0', 
      trend: 'Total Ativos', 
      isPositive: true, 
      icon: Users, color: 'text-emerald-500' 
    },
    { 
      title: 'Cashbacks MMN', 
      value: `R$ ${globalStats?.commissionTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, 
      trend: `${(globalStats?.commissionTrend || 0) >= 0 ? '+' : ''}${globalStats?.commissionTrend?.toFixed(1) || '0'}%`, 
      isPositive: (globalStats?.commissionTrend || 0) >= 0, 
      icon: Zap, color: 'text-amber-500' 
    },
    { 
      title: 'Número de Assinantes', 
      value: globalStats?.subscriberCount?.toLocaleString('pt-BR') || '0', 
      trend: 'Ativos MMN', 
      isPositive: true, 
      icon: ShieldCheck, color: 'text-sky-500' 
    },
  ];

  const maxVal = React.useMemo(() => {
    return Math.max(...chartData.map(d => chartType === 'revenue' ? d.faturamento : d.vendas), 1);
  }, [chartData, chartType]);

  const chartHeight = 240;
  const paddingY = 30;

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

        {/* Charts & Analytics Section */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col p-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Desempenho de Vendas</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gráficos de vendas e faturamento dos planos</p>
            </div>
            
            {/* Metric Selector */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 self-start">
              <button
                onClick={() => setChartType('revenue')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  chartType === 'revenue' 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Faturamento
              </button>
              <button
                onClick={() => setChartType('sales')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  chartType === 'sales' 
                    ? 'bg-amber-500 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Número de Vendas
              </button>
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex flex-wrap items-center justify-between gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: '7days', label: '7 Dias' },
                { id: '15days', label: '15 Dias' },
                { id: '30days', label: '30 Dias' },
                { id: 'custom', label: 'Personalizado' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === p.id 
                      ? 'bg-white/10 text-white border border-white/10' 
                      : 'bg-white/5 text-slate-500 hover:text-white border border-transparent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {period === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-white uppercase focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-black">Até</span>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-white uppercase focus:outline-none cursor-pointer"
                  />
                </div>
              </motion.div>
            )}

            {/* Period Statistics Summary */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Faturamento</p>
                <p className="text-base font-black text-indigo-400 font-mono">
                  R$ {totalPeriodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Vendas</p>
                <p className="text-base font-black text-amber-500 font-mono">{totalPeriodSales}</p>
              </div>
            </div>
          </div>

          {/* SVG Chart Box */}
          <div className="relative bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col justify-end">
            {chartData.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                <BarChart2 size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma venda encontrada no período</p>
              </div>
            ) : (
              <div className="relative h-[300px] w-full mt-4">
                <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
                  {/* Grid Lines & Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + (chartHeight - paddingY) * ratio;
                    const labelVal = maxVal * (1 - ratio);
                    return (
                      <g key={idx}>
                        <line 
                          x1="50" 
                          y1={y} 
                          x2="570" 
                          y2={y} 
                          stroke="rgba(255,255,255,0.03)" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x="5" 
                          y={y + 4} 
                          fill="rgba(255,255,255,0.25)" 
                          className="text-[9px] font-bold font-mono"
                        >
                          {chartType === 'revenue' 
                            ? `R$ ${Math.round(labelVal)}` 
                            : Math.round(labelVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Dynamic Bars */}
                  {chartData.map((d, idx) => {
                    const val = chartType === 'revenue' ? d.faturamento : d.vendas;
                    const barWidth = Math.max(10, Math.min(30, Math.floor(400 / chartData.length)));
                    const gap = Math.floor(500 / chartData.length);
                    const x = 60 + idx * gap;
                    
                    const barHeight = (val / maxVal) * (chartHeight - paddingY);
                    const y = chartHeight - barHeight;

                    return (
                      <g 
                        key={idx}
                        onMouseEnter={() => setHoveredBar(idx)}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="cursor-pointer group"
                      >
                        {/* Bar Hover Mask */}
                        <rect
                          x={x - 4}
                          y={paddingY}
                          width={barWidth + 8}
                          height={chartHeight - paddingY + 15}
                          fill="rgba(255,255,255,0.02)"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                          rx="6"
                        />
                        {/* Visual Bar */}
                        <motion.rect
                          initial={{ height: 0, y: chartHeight }}
                          animate={{ height: barHeight, y }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          x={x}
                          width={barWidth}
                          fill={chartType === 'revenue' ? 'url(#revenueGrad)' : 'url(#salesGrad)'}
                          rx={barWidth / 4}
                        />
                        {/* X Axis Label */}
                        <text 
                          x={x + barWidth / 2} 
                          y={chartHeight + 20} 
                          fill="rgba(255,255,255,0.3)" 
                          textAnchor="middle"
                          className="text-[8px] font-bold tracking-tighter"
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradients definitions */}
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Interactive Tooltip overlay */}
                {hoveredBar !== null && chartData[hoveredBar] && (
                  <div 
                    className="absolute bg-slate-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-20 pointer-events-none transition-all duration-75"
                    style={{
                      left: `${Math.min(60 + hoveredBar * (500 / chartData.length), 420)}px`,
                      top: '10px'
                    }}
                  >
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{chartData[hoveredBar].label}</p>
                    <p className="text-xs font-black text-white">
                      Faturamento: <span className="text-indigo-400 font-mono">R$ {chartData[hoveredBar].faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-300 mt-1">
                      Vendas: <span className="text-amber-500 font-mono">{chartData[hoveredBar].vendas}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
