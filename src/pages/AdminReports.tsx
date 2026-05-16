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
  Loader2,
  CheckCircle2
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
  const [payees, setPayees] = useState<Record<string, any>>({});
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  const [viewType, setViewType] = useState<'merchants' | 'affiliates'>('merchants');
  const [affiliatePayouts, setAffiliatePayouts] = useState<any[]>([]);
  const [platformRate, setPlatformRate] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reports, ordersData, extrasData, affiliatePayoutsData, marketConfig] = await Promise.all([
        businessRules.getAdminReportsData(dateRange),
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras(),
        businessRules.getAffiliatePayouts(),
        businessRules.getMarketplaceConfig()
      ]);
      
      setAffiliatePayouts(affiliatePayoutsData);
      // Somente pedidos com repasse pago
      const paidOrders = ordersData.filter(o => o.payoutStatus === 'paid');
      
      // Coletar todos os IDs de afiliados (destinatários)
      const affiliateIds = [...new Set(paidOrders.map(o => o.affiliateId).filter(Boolean))] as string[];
      
      if (affiliateIds.length > 0) {
        const payeesData = await businessRules.getPayeeDetails(affiliateIds);
        const payeesMap: Record<string, any> = {};
        payeesData.forEach((p: any) => {
          payeesMap[p.id] = p;
        });
        setPayees(payeesMap);
      }

      setReportData(reports);
      setOrders(ordersData);
      setExtras(extrasData);
      setPlatformRate(marketConfig?.commissionRate || 12);
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
    if (viewType === 'merchants') {
      // No Relatório, mostramos apenas o que JÁ FOI PAGO (Lojistas)
      return orders
        .filter(o => o.payoutStatus === 'paid')
        .map(o => {
          const extra = extras.find(e => e.id === o.id);
          const saleDate = new Date(o.date || o.created_at);
          
          const payDate = o.payoutDate ? new Date(o.payoutDate) : new Date(saleDate);
          if (!o.payoutDate) payDate.setDate(payDate.getDate() + 1);

          const payeeId = o.affiliateId || o.userId;
          const payee = payeeId ? payees[String(payeeId)] : null;

          return {
            orderId: String(o.id),
            buyerName: o.customerName || 'Cliente',
            orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
            deliveryStatus: (extra?.status as any) || 'Pendente',
            saleDate: saleDate.toLocaleDateString('pt-BR'),
            amount: o.amount,
            repasse: o.amount * (1 - (platformRate / 100)),
            payDate: payDate.toLocaleDateString('pt-BR'),
            payeeId: String(payeeId || 'unknown'),
            payeeName: payee?.full_name || (payeeId ? 'Destinatário não identificado' : 'Sem vínculo (Admin)'),
            payeePixKey: payee?.pix_key || ''
          };
        });
    } else {
      // Relatório de Afiliados (JÁ PAGOS)
      return affiliatePayouts.map(p => ({
        id: p.id,
        orderId: `REP-${p.id.substring(0, 8)}`,
        buyerName: 'Rede MMN',
        payeeName: p.profiles?.full_name || 'Afiliado',
        payeeId: p.profile_id,
        amount: p.amount,
        repasse: p.amount,
        mensal: p.mensal_amount || 0,
        digital: p.digital_amount || 0,
        anual: p.anual_amount || 0,
        saleDate: new Date(p.payout_date).toLocaleDateString('pt-BR'),
        payDate: new Date(p.payout_date).toLocaleDateString('pt-BR'),
        orderStatus: 'Liquidado',
        deliveryStatus: 'Pago',
        payeePixKey: p.pix_key || '',
        cpf: p.profiles?.cpf || '---'
      }));
    }
  }, [orders, extras, payees, viewType, affiliatePayouts, platformRate]);

  if (loading) {
    return (
      <AdminLayout title="Relatórios e BI" subtitle="Carregando inteligência de dados...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-indigo-500 animate-spin opacity-20" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Relatórios & BI" subtitle="Análise de performance e crescimento global">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
           <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic mb-1">Performance Global</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selecione o período para análise</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                 {['7 dias', '15 dias', '30 dias', '6 meses'].map((range) => (
                   <button
                     key={range}
                     onClick={() => setDateRange(range)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       dateRange === range 
                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                         : 'text-slate-400 hover:text-white'
                     }`}
                   >
                     {range}
                   </button>
                 ))}
              </div>
              <button 
                onClick={handleExport}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all"
              >
                <Download size={20} />
              </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
           {[
             { title: 'Volume (GMV)', value: reportData?.gmv.value, trend: reportData?.gmv.trend, icon: DollarSign, color: 'text-indigo-500' },
             { title: 'Receita Plataforma', value: reportData?.platformRevenue.value, trend: reportData?.platformRevenue.trend, icon: Activity, color: 'text-emerald-500' },
             { title: 'Expansão de Rede', value: reportData?.userGrowth.value, trend: reportData?.userGrowth.trend, icon: Users, color: 'text-purple-500', isCurrency: false },
             { title: 'Total Repassado', value: financialReportData.reduce((a, b) => a + b.repasse, 0), trend: 0, icon: CheckCircle2, color: 'text-amber-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  {stat.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-[10px] font-black ${stat.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend > 0 ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(stat.trend).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-midnight tracking-tighter italic">
                  {stat.isCurrency === false ? stat.value : `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </h3>
             </div>
           ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           <div className="xl:col-span-2 bg-white p-8 lg:p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h4 className="text-lg font-black text-midnight tracking-tighter uppercase italic">Curva de Faturamento</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Evolução do GMV no período selecionado</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <LineChart size={20} />
                </div>
              </div>
              
              <div className="h-[300px] flex items-end justify-between gap-2 px-4">
                 {reportData?.chart.values.map((val: number, i: number) => {
                    const max = Math.max(...reportData.chart.values);
                    const height = max > 0 ? (val / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                         <div className="w-full relative">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl opacity-20 group-hover:opacity-100 transition-all cursor-pointer relative"
                            >
                               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-midnight text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  R$ {val.toLocaleString('pt-BR')}
                               </div>
                            </motion.div>
                         </div>
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{reportData.chart.labels[i]}</span>
                      </div>
                    );
                 })}
              </div>
           </div>

           <div className="bg-[#0a0e17] p-8 lg:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Target size={160} className="text-white" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div>
                    <h4 className="text-lg font-black text-white tracking-tighter uppercase italic">Rede e Cashbacks</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Distribuição de incentivos</p>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                          <span className="text-slate-400">Cashback Mensal (2.75%)</span>
                          <span className="text-white">R$ {reportData?.cashback.monthly.toLocaleString('pt-BR')}</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-indigo-500" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                          <span className="text-slate-400">Cashback Anual (0.75%)</span>
                          <span className="text-white">R$ {reportData?.cashback.yearly.toLocaleString('pt-BR')}</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-purple-500" />
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setIsBIModalOpen(true)}
                className="mt-12 w-full bg-white text-midnight py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-xl shadow-white/5"
              >
                Gerar Insights com IA <ArrowUpRight size={16} />
              </button>
           </div>
        </div>

        {/* Toggle de Visualização de Repasses */}
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setViewType('merchants')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewType === 'merchants' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Lojistas
          </button>
          <button
            onClick={() => setViewType('affiliates')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewType === 'affiliates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Afiliados
          </button>
        </div>

        {/* Detalhamento Financeiro - Apenas Pagos */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
           <FinancialReportTable 
              data={viewType === 'merchants' ? financialReportData : []} 
              affiliateData={viewType === 'affiliates' ? financialReportData : []}
              title={viewType === 'merchants' ? "Repasses Liquidados (Lojistas)" : "Repasses Liquidados (Afiliados)"} 
              isAdmin={true} 
              mode={viewType}
              platformRate={platformRate}
           />
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
