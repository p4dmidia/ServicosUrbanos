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
  Filter,
  DollarSign,
  Users,
  Store,
  ChevronRight,
  Target,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';
import BIInsightsModal from '../components/BIInsightsModal';

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('30 dias');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reports, ordersData, extrasData] = await Promise.all([
        businessRules.getAdminReportsData(dateRange),
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras()
      ]);
      
      setReportData(reports);
      setOrders(ordersData);
      setExtras(extrasData);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Ocorreu um erro ao carregar os dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const handleExport = () => {
    if (!reportData) return;
    
    const headers = ['Métrica', 'Valor', 'Tendência'];
    const rows = [
      ['Volume Transacional (GMV)', `R$ ${reportData.gmv.value.toLocaleString('pt-BR')}`, `${reportData.gmv.trend.toFixed(1)}%`],
      ['Receita Bruta (Plataforma)', `R$ ${reportData.platformRevenue.value.toLocaleString('pt-BR')}`, `${reportData.platformRevenue.trend.toFixed(1)}%`],
      ['Crescimento de Rede', reportData.userGrowth.value, `${reportData.userGrowth.trend.toFixed(1)}%`],
      ['Payout MMN', `R$ ${reportData.payoutMMN.value.toLocaleString('pt-BR')}`, `${reportData.payoutMMN.trend.toFixed(1)}%`],
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_urbashop_${dateRange.replace(' ', '_')}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório exportado com sucesso!');
  };

  const financialReportData: FinancialRecord[] = useMemo(() => {
    return orders.map(o => {
      const extra = extras.find(e => e.id === o.id);
      const saleDate = new Date(o.date);
      
      const payDate = new Date(saleDate);
      payDate.setDate(payDate.getDate() + 1);

      return {
        orderId: o.id,
        buyerName: o.customerName || 'Cliente',
        orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
        deliveryStatus: (extra?.status as any) || 'Pendente',
        saleDate: saleDate.toLocaleDateString('pt-BR'),
        amount: o.amount,
        repasse: o.amount * 0.8,
        payDate: payDate.toLocaleDateString('pt-BR')
      };
    });
  }, [orders, extras]);

  const mainKPIs = [
    { label: 'Volume Transacional (GMV)', value: `R$ ${reportData?.gmv?.value?.toLocaleString('pt-BR') || '0'}`, trend: `${(reportData?.gmv?.trend || 0) >= 0 ? '+' : ''}${reportData?.gmv?.trend?.toFixed(1) || '0'}%`, icon: DollarSign, color: 'text-indigo-500' },
    { label: 'Receita Bruta (Comissões)', value: `R$ ${reportData?.platformRevenue?.value?.toLocaleString('pt-BR') || '0'}`, trend: `${(reportData?.platformRevenue?.trend || 0) >= 0 ? '+' : ''}${reportData?.platformRevenue?.trend?.toFixed(1) || '0'}%`, icon: Target, color: 'text-emerald-500' },
    { label: 'Crescimento de Rede', value: `${reportData?.userGrowth?.value?.toLocaleString('pt-BR') || '0'} novos`, trend: `${(reportData?.userGrowth?.trend || 0) >= 0 ? '+' : ''}${reportData?.userGrowth?.trend?.toFixed(1) || '0'}%`, icon: Users, color: 'text-purple-500' },
    { label: 'Payout MMN', value: `R$ ${reportData?.payoutMMN?.value?.toLocaleString('pt-BR') || '0'}`, trend: `${(reportData?.payoutMMN?.trend || 0) >= 0 ? '+' : ''}${reportData?.payoutMMN?.trend?.toFixed(1) || '0'}%`, icon: Activity, color: 'text-amber-500' },
    { label: 'Cashback Mensal', value: `R$ ${reportData?.cashback?.monthly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, trend: 'A Pagar', icon: ArrowUpRight, color: 'text-blue-400' },
    { label: 'Cashback Anual', value: `R$ ${reportData?.cashback?.yearly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, trend: 'Acumulado', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Cashback Digital', value: `R$ ${reportData?.cashback?.digitalTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, trend: 'Saldo Real', icon: PieChart, color: 'text-pink-500' },
  ];

  return (
    <AdminLayout title="Relatórios e Analytics" subtitle="Inteligência de Dados do Ecossistema Urbano">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex p-1 bg-[#0a0e17] rounded-2xl border border-white/5 overflow-x-auto max-w-full">
            {['7 dias', '15 dias', '30 dias', '6 meses', '1 ano'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  dateRange === range ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
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
            <button 
              onClick={handleExport}
              disabled={loading || !reportData}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* KPI Grid - Row 1 (Core) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainKPIs.slice(0, 4).map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex flex-col h-full justify-between animate-pulse">
                  <div className="size-12 rounded-2xl bg-white/5 mb-8" />
                  <div>
                    <div className="h-2 w-20 bg-white/5 rounded mb-2" />
                    <div className="h-8 w-32 bg-white/5 rounded" />
                  </div>
                </div>
              ) : (
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
              )}
            </motion.div>
          ))}
        </div>

        {/* KPI Grid - Row 2 (Cashback) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          {mainKPIs.slice(4).map((kpi, i) => (
            <motion.div 
              key={i + 4}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i + 4) * 0.1 }}
              className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex flex-col h-full justify-between animate-pulse">
                  <div className="size-12 rounded-2xl bg-white/5 mb-8" />
                  <div>
                    <div className="h-2 w-20 bg-white/5 rounded mb-2" />
                    <div className="h-8 w-32 bg-white/5 rounded" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center ${kpi.color}`}>
                      <kpi.icon size={24} />
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400`}>
                      {kpi.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter italic leading-none">{kpi.value}</h3>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 lg:p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-1">Evolução de Faturamento</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Comparativo de performance ({dateRange})</p>
              </div>
              <Activity className="text-indigo-500" size={24} />
            </div>

            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-white/5 rounded-t-xl animate-pulse" style={{ height: '30%' }} />
                ))
              ) : (
                reportData?.chart?.values?.map((val: number, i: number) => {
                  const max = Math.max(...(reportData?.chart?.values || []), 1);
                  const height = (val / max) * 100;
                  const isLast = i === (reportData?.chart?.values?.length - 1);
                  
                  return (
                    <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 2)}%` }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: i * 0.02 }}
                        className={`w-full rounded-t-lg transition-all relative overflow-hidden ${
                          isLast 
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20' 
                          : 'bg-white/5 group-hover:bg-white/10 group-hover:from-indigo-500/20 group-hover:to-transparent group-hover:bg-gradient-to-t'
                        }`}
                      >
                        {isLast && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />}
                      </motion.div>
                      
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 bg-white text-indigo-900 text-[10px] font-black py-2 px-3 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap z-50 border border-indigo-100">
                        <p className="text-[8px] text-slate-400 uppercase mb-0.5">{reportData.chart.labels[i]}</p>
                        R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-8 flex justify-between px-2 overflow-hidden">
              {loading ? (
                 Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-2 w-8 bg-white/5 rounded mx-1 animate-pulse" />
                ))
              ) : (
                reportData?.chart?.labels?.map((m: string, i: number) => {
                  // Show fewer labels for long periods
                  const shouldShow = reportData.chart.labels.length <= 15 || i % Math.floor(reportData.chart.labels.length / 8) === 0 || i === reportData.chart.labels.length - 1;
                  if (!shouldShow) return <div key={i} className="flex-1" />;
                  
                  return (
                    <span key={i} className="flex-1 text-center text-[8px] font-black text-slate-600 uppercase tracking-widest truncate px-1">
                      {m}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8 lg:p-10 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">Mix de Plataformas</h3>
              <PieChart className="text-indigo-500" size={20} />
            </div>

            <div className="relative size-48 mx-auto my-12">
              {loading ? (
                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-indigo-600" strokeDasharray="251.2 251.2" />
                    {/* Para mais plataformas, precisaria de cálculos de dashoffset dinâmicos. Como UrbaShop é 100% no mock... */}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">UrbaShop</p>
                    <p className="text-2xl font-black text-white tracking-tighter leading-none italic">100%</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-white/5 rounded animate-pulse" />
                ))
              ) : (
                reportData?.distribution?.map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-3 rounded-full ${item.color}`} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-white">{item.percent}</span>
                  </div>
                ))
              )}
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
                A UrbaShop registrou um { (reportData?.gmv?.trend || 0) >= 0 ? 'aumento' : 'redução' } de { Math.abs(reportData?.gmv?.trend || 0).toFixed(1) }% no volume transacional (GMV) no período de {dateRange}. 
                O crescimento da rede de afiliados foi de { (reportData?.userGrowth?.trend || 0) >= 0 ? '+' : '' }{ (reportData?.userGrowth?.trend || 0).toFixed(1) }% em relação ao período anterior, indicando a viralidade orgânica da rede SERVICES URBANOS.
              </p>
            </div>
            
            <button 
              onClick={() => setIsBIModalOpen(true)}
              className="flex items-center gap-3 bg-white text-indigo-900 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-white/10 hover:bg-slate-200 transition-all active:scale-[0.98] group shrink-0"
            >
              Relatórios BI (Business Intelligence)
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* BI Insights Modal */}
        <BIInsightsModal 
          isOpen={isBIModalOpen} 
          onClose={() => setIsBIModalOpen(false)} 
        />

        {/* Financial Report Table Integration */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Detalhamento Financeiro</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Auditoria completa de liquidação</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
            <FinancialReportTable 
              data={financialReportData} 
              title="Auditoria de Pedidos do Ecossistema" 
              isAdmin={true} 
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
