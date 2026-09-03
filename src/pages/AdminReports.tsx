import React, { useState, useEffect, useMemo } from 'react';
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
  DollarSign,
  Users,
  Target,
  Loader2,
  Award,
  Layers,
  Sparkles,
  Zap,
  TrendingDown,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import BIInsightsModal from '../components/BIInsightsModal';

export default function AdminReports() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reports, ordersData] = await Promise.all([
        businessRules.getAdminReportsData('custom', startDate, endDate),
        businessRules.getAllOrders()
      ]);
      
      setReportData(reports);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Ocorreu um erro ao carregar os dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleExport = () => {
    if (!reportData) return;
    
    const headers = ['Métrica', 'Valor', 'Tendência'];
    const rows = [
      ['Volume Transacional (GMV)', `R$ ${reportData.gmv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `${reportData.gmv.trend.toFixed(1)}%`],
      ['Receita Bruta (Plataforma)', `R$ ${reportData.platformRevenue.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `${reportData.platformRevenue.trend.toFixed(1)}%`],
      ['Crescimento de Rede', reportData.userGrowth.value, `${reportData.userGrowth.trend.toFixed(1)}%`],
      ['Payout MMN', `R$ ${reportData.payoutMMN.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `${reportData.payoutMMN.trend.toFixed(1)}%`],
    ];
    
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_bi_${startDate}_a_${endDate}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório exportado com sucesso!');
  };

  // Pedidos válidos no período
  const completedOrders = useMemo(() => {
    return orders.filter(o => 
      o.status !== 'Cancelado' && 
      (o.status === 'Pago' || o.status === 'Concluído' || o.status === 'Pago, Aguardando Retirada')
    );
  }, [orders]);

  // Ticket Médio
  const averageTicket = useMemo(() => {
    if (completedOrders.length === 0) return 0;
    const total = completedOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    return total / completedOrders.length;
  }, [completedOrders]);

  // Mix de Planos & Licenças
  const planStats = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {};
    completedOrders.forEach(o => {
      const item = o.items?.[0];
      const name = item?.name || 'Adesão Serviços Urbanos';
      if (!counts[name]) counts[name] = { count: 0, total: 0 };
      counts[name].count += 1;
      counts[name].total += Number(o.amount || 0);
    });

    const colors = [
      { stroke: '#6366f1', fill: 'from-indigo-500/20 to-indigo-600/5', text: 'text-indigo-400', bar: 'bg-indigo-500' },
      { stroke: '#a855f7', fill: 'from-purple-500/20 to-purple-600/5', text: 'text-purple-400', bar: 'bg-purple-500' },
      { stroke: '#06b6d4', fill: 'from-cyan-500/20 to-cyan-600/5', text: 'text-cyan-400', bar: 'bg-cyan-500' },
      { stroke: '#10b981', fill: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400', bar: 'bg-emerald-500' },
      { stroke: '#f59e0b', fill: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-400', bar: 'bg-amber-500' }
    ];

    return Object.entries(counts)
      .map(([name, stat], idx) => ({ 
        name, 
        ...stat,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.total - a.total);
  }, [completedOrders]);

  const totalPlanSales = useMemo(() => {
    return planStats.reduce((sum, p) => sum + p.total, 0);
  }, [planStats]);

  // Dados do Gráfico Temporal
  const chartLabels: string[] = reportData?.chart?.labels || [];
  const chartValues: number[] = reportData?.chart?.values || [];
  const maxChartValue = Math.max(...chartValues, 100);

  // Coordenadas para o Gráfico SVG Fluido
  const svgWidth = 800;
  const svgHeight = 240;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    if (chartValues.length === 0) return [];
    return chartValues.map((val, i) => {
      const x = chartValues.length > 1 
        ? padLeft + (i / (chartValues.length - 1)) * plotWidth 
        : padLeft + plotWidth / 2;
      const y = padTop + plotHeight - (val / maxChartValue) * plotHeight;
      return { x, y, val, label: chartLabels[i] || '' };
    });
  }, [chartValues, chartLabels, maxChartValue, plotWidth, plotHeight]);

  // Caminho Bézier Fluido
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const baseY = padTop + plotHeight;
    return `${pathD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [pathD, points, padTop, plotHeight]);

  if (loading) {
    return (
      <AdminLayout title="Relatórios & BI" subtitle="Carregando inteligência de dados...">
        <div className="flex items-center justify-center p-28">
          <Loader2 size={48} className="text-indigo-500 animate-spin opacity-40" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Relatórios & BI" 
      subtitle="Inteligência comercial, metas e análise de crescimento global da plataforma"
    >
      <div className="p-6 md:p-10 lg:p-12 space-y-10">
        
        {/* Header com Filtro de Data e Exportação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a0e17] p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
           <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase italic">
                  Painel Executivo de BI
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Indicadores consolidados de faturamento, mix de vendas e expansão da rede
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex flex-wrap items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                <Calendar size={15} className="text-indigo-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">De</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-black text-white outline-none border-none [color-scheme:dark]"
                  />
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Até</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-black text-white outline-none border-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <button 
                onClick={handleExport}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
                title="Exportar CSV"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
           </div>
        </div>

        {/* 4 Cards Principais de Performance (Dark Glassmorphism) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
           {[
             { 
               title: 'Volume Transacional (GMV)', 
               value: reportData?.gmv?.value || 0, 
               trend: reportData?.gmv?.trend, 
               icon: DollarSign, 
               gradient: 'from-indigo-500/20 to-purple-500/5',
               accent: 'text-indigo-400',
               border: 'border-indigo-500/20'
             },
             { 
               title: 'Receita da Plataforma', 
               value: reportData?.platformRevenue?.value || 0, 
               trend: reportData?.platformRevenue?.trend, 
               icon: Activity, 
               gradient: 'from-emerald-500/20 to-teal-500/5',
               accent: 'text-emerald-400',
               border: 'border-emerald-500/20'
             },
             { 
               title: 'Expansão da Rede', 
               value: reportData?.userGrowth?.value || 0, 
               trend: reportData?.userGrowth?.trend, 
               icon: Users, 
               gradient: 'from-purple-500/20 to-pink-500/5',
               accent: 'text-purple-400',
               border: 'border-purple-500/20',
               isCurrency: false,
               unit: 'membros'
             },
             { 
               title: 'Comissões Provisionadas', 
               value: reportData?.payoutMMN?.value || 0, 
               trend: reportData?.payoutMMN?.trend, 
               icon: Award, 
               gradient: 'from-amber-500/20 to-orange-500/5',
               accent: 'text-amber-400',
               border: 'border-amber-500/20'
             }
           ].map((stat, i) => (
             <div 
               key={i} 
               className={`bg-[#0a0e17] bg-gradient-to-br ${stat.gradient} p-7 rounded-[2.5rem] border ${stat.border} shadow-2xl relative overflow-hidden group hover:border-opacity-50 transition-all`}
             >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3.5 rounded-2xl bg-white/5 ${stat.accent} border border-white/10 shadow-lg`}>
                    <stat.icon size={22} />
                  </div>
                  {stat.trend !== undefined && stat.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${
                      stat.trend > 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {stat.trend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {Math.abs(stat.trend).toFixed(1)}%
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">{stat.title}</p>
                <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight font-mono">
                  {stat.isCurrency === false 
                    ? `${stat.value} ${stat.unit || ''}`
                    : `R$ ${Number(stat.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </h3>
             </div>
           ))}
        </div>

        {/* Gráfico Moderno de Curva de Faturamento + Card de Incentivos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           
           {/* GRÁFICO FLUÍDO NEON DE FATURAMENTO */}
           <div className="xl:col-span-2 bg-[#0a0e17] p-8 lg:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2">
                     <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                     <h4 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase italic">
                       Curva de Faturamento
                     </h4>
                   </div>
                   <p className="text-xs text-slate-400 mt-1">
                     Evolução diária do GMV da operação no período
                   </p>
                </div>

                {/* Toggle Linha vs Barras */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-wider">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      chartType === 'area' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LineChart size={13} /> Linha Fluida
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      chartType === 'bar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 size={13} /> Barras
                  </button>
                </div>
              </div>

              {/* Área do Gráfico */}
              <div className="relative w-full h-[280px] flex items-center justify-center">
                {chartValues.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Nenhuma movimentação registrada no período.
                  </p>
                ) : chartType === 'area' ? (
                  /* Gráfico SVG de Linha Fluida com Glow Neon */
                  <svg 
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="neonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#a855f7" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0a0e17" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Linhas de Grade Sutis */}
                    {[0.25, 0.5, 0.75, 1].map((lvl, idx) => {
                      const y = padTop + plotHeight * (1 - lvl);
                      return (
                        <g key={idx}>
                          <line 
                            x1={padLeft} 
                            y1={y} 
                            x2={svgWidth - padRight} 
                            y2={y} 
                            stroke="rgba(255,255,255,0.06)" 
                            strokeDasharray="4 4" 
                          />
                          <text 
                            x={padLeft - 10} 
                            y={y + 3} 
                            textAnchor="end" 
                            fill="rgba(148, 163, 184, 0.5)" 
                            fontSize="9" 
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            R$ {((maxChartValue * lvl) / 1000).toFixed(0)}k
                          </text>
                        </g>
                      );
                    })}

                    {/* Área Preenchida com Degradê */}
                    {areaD && (
                      <path d={areaD} fill="url(#neonAreaGradient)" />
                    )}

                    {/* Linha Fluida Glow */}
                    {pathD && (
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="url(#neonLineGradient)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                      />
                    )}

                    {/* Pontos de Dados Interativos */}
                    {points.map((pt, idx) => (
                      <g key={idx} className="cursor-pointer">
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={hoveredPoint?.label === pt.label ? "6" : "3.5"} 
                          className="transition-all"
                          fill="#ffffff" 
                          stroke="#6366f1" 
                          strokeWidth="2.5"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {/* Eixo X com Labels */}
                        {(idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 6) === 0) && (
                          <text 
                            x={pt.x} 
                            y={svgHeight - 12} 
                            textAnchor="middle" 
                            fill="rgba(148, 163, 184, 0.6)" 
                            fontSize="9" 
                            fontWeight="bold"
                          >
                            {pt.label}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                ) : (
                  /* Gráfico de Barras Modernas Neon */
                  <div className="w-full h-full flex items-end justify-between gap-2 px-2">
                    {chartValues.map((val, i) => {
                      const height = (val / maxChartValue) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                          <div className="w-full relative flex items-end justify-center h-[200px]">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(6, height)}%` }}
                              className="w-full max-w-[28px] bg-gradient-to-t from-indigo-600 via-purple-500 to-cyan-400 rounded-t-xl opacity-75 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-indigo-500/40 transition-all cursor-pointer relative"
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-midnight text-white text-[9px] font-black px-2.5 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-2xl">
                                R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </motion.div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">{chartLabels[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tooltip Flutuante no Hover da Linha */}
                {hoveredPoint && (
                  <div 
                    className="absolute pointer-events-none bg-[#0a0e17]/95 border border-indigo-500/40 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md z-30 transition-all"
                    style={{ 
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
                      top: `${(hoveredPoint.y / svgHeight) * 100 - 15}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <span className="text-[9px] font-bold text-slate-400 block">{hoveredPoint.label}</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      R$ {hoveredPoint.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
           </div>

           {/* CARD DE INCENTIVOS, CASHBACK & IA */}
           <div className="bg-[#0a0e17] p-8 lg:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Target size={160} className="text-white" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div>
                    <h4 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase italic">
                      Incentivos & Cashback
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Distribuição matemática por ciclo de pagamento
                    </p>
                 </div>

                 <div className="space-y-5">
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                          <span className="text-slate-400">Cashback Mensal (2.75%)</span>
                          <span className="text-indigo-400 font-mono">
                            R$ {Number(reportData?.cashback?.monthly || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                       </div>
                       <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm" />
                       </div>
                    </div>

                    <div>
                       <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                          <span className="text-slate-400">Cashback Anual (0.75%)</span>
                          <span className="text-blue-400 font-mono">
                            R$ {Number(reportData?.cashback?.yearly || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                       </div>
                       <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm" />
                       </div>
                    </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-slate-400">Ticket Médio:</span>
                     <strong className="text-white font-mono text-sm">
                       R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </strong>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-slate-400">Adesões Pagas:</span>
                     <strong className="text-emerald-400 font-black">
                       {completedOrders.length} transações
                     </strong>
                   </div>
                 </div>
              </div>

              <button 
                onClick={() => setIsBIModalOpen(true)}
                className="mt-8 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-90 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles size={16} />
                Gerar Insights com IA <ArrowUpRight size={16} />
              </button>
           </div>
        </div>

        {/* SEÇÃO MODERNA: DISTRIBUIÇÃO DE RECEITA POR PLANO & LICENÇA (DARK THEME) */}
        <div className="bg-[#0a0e17] p-8 lg:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Layers size={22} />
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase italic">
                    Distribuição de Receita por Plano & Licença
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Composição percentual do faturamento e vendas por categoria de plano
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Volume Faturado:</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                R$ {totalPlanSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {planStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {planStats.map((plan, index) => {
                const percentage = totalPlanSales > 0 ? (plan.total / totalPlanSales) * 100 : 0;
                return (
                  <div 
                    key={index} 
                    className={`bg-gradient-to-br ${plan.color.fill} p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Plano #{index + 1}
                        </span>
                        <span className={`text-xs font-black font-mono ${plan.color.text}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <h5 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                        {plan.name}
                      </h5>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percentage}%` }} 
                          className={`h-full ${plan.color.bar} rounded-full`}
                        />
                      </div>

                      <div className="flex items-end justify-between border-t border-white/5 pt-3">
                        <div>
                          <span className="text-lg font-black text-white font-mono block">
                            R$ {plan.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {plan.count} assinaturas
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                          TM: R$ {(plan.total / (plan.count || 1)).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">
              Nenhuma venda registrada no período selecionado.
            </div>
          )}
        </div>

      </div>

      <BIInsightsModal 
        isOpen={isBIModalOpen} 
        onClose={() => setIsBIModalOpen(false)} 
        data={reportData}
      />
    </AdminLayout>
  );
}
