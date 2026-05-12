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
  Loader2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';

export default function MerchantReports() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        if (profile?.role === 'manager' && !profile?.branch_id) {
           setLoading(false);
           return;
        }
        
        const mId = await businessRules.getMerchantId(profile!.id);
        if (!mId) return;

        const [data, ordersData, branches] = await Promise.all([
          businessRules.getMerchantDetailedReports(mId, period, profile?.branch_id),
          businessRules.getMerchantOrders(mId, profile?.branch_id),
          businessRules.getBranches(mId)
        ]);

        const branchIds = branches.map(b => b.id);
        const teamData = await businessRules.getMerchantTeam(branchIds);

        // Buscar extras (status de entrega) para os pedidos
        const extrasData = await Promise.all(
          ordersData.map(o => businessRules.getOrderExtra(o.id).catch(() => null))
        );

        setReportsData(data);
        setOrders(ordersData);
        setExtras(extrasData.filter(Boolean));
        setTeam(teamData);
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        toast.error('Erro ao carregar dados analíticos');
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadReports();
    }
  }, [profile, period]);

  const { financialReportData, kpis, chart } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '15d': startDate.setDate(now.getDate() - 15); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    const reportRecords = orders.map(o => {
      const extra = extras.find(e => e.id === o.id);
      const manager = team.find(m => m.branchId === o.branch_id && m.role === 'manager');
      const saleDate = new Date(o.order_date);
      
      const payDate = new Date(saleDate);
      payDate.setDate(payDate.getDate() + 1);

      const commissionRate = manager?.commissionRate || 0;
      const commissionAmount = (Number(o.amount) * commissionRate) / 100;

      return {
        orderId: o.id,
        buyerName: o.customerName || 'Cliente',
        orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
        deliveryStatus: extra?.status || 'Pendente',
        saleDate: saleDate.toLocaleDateString('pt-BR'),
        orderDateRaw: saleDate,
        amount: Number(o.amount),
        repasse: commissionAmount,
        payDate: payDate.toLocaleDateString('pt-BR'),
        managerName: manager?.name || 'N/A'
      };
    });

    const filteredRecords = reportRecords.filter(r => r.orderDateRaw >= startDate);
    
    // KPIs
    const totalCommissions = filteredRecords.reduce((acc, r) => acc + r.repasse, 0);
    const totalSales = filteredRecords.reduce((acc, r) => acc + r.amount, 0);
    const avgCommission = filteredRecords.length > 0 ? totalCommissions / filteredRecords.length : 0;
    const pendingCommissions = filteredRecords
      .filter(r => r.orderStatus !== 'Pago' || r.deliveryStatus !== 'Entregue')
      .reduce((acc, r) => acc + r.repasse, 0);

    const kpiList = [
      { title: 'Total Cashbacks', value: totalCommissions, trend: 0, isPositive: true },
      { title: 'Volume de Vendas', value: totalSales, trend: 0, isPositive: true },
      { title: 'Média por Pedido', value: avgCommission, trend: 0, isPositive: true },
      { title: 'Pendentes Liberação', value: pendingCommissions, trend: 0, isPositive: false }
    ];

    // Chart Data (simplified day grouping)
    const chartLabels: string[] = [];
    const chartValues: number[] = [];
    const days = period === '7d' ? 7 : period === '15d' ? 15 : 30;
    
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      chartLabels.push(label);
      
      const dayTotal = filteredRecords
        .filter(r => r.orderDateRaw.toDateString() === d.toDateString())
        .reduce((acc, r) => acc + r.repasse, 0);
      chartValues.push(dayTotal);
    }

    return { 
      financialReportData: reportRecords, // All records for the table
      kpis: kpiList,
      chart: { labels: chartLabels, values: chartValues }
    };
  }, [orders, extras, team, period]);

  if (loading) {
    return (
      <MerchantLayout title="Relatórios" subtitle="Analisando desempenho...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-midnight animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

  if (profile?.role === 'manager' && !profile?.branch_id) {
    return (
      <MerchantLayout title="Relatórios" subtitle="Acesso Restrito">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="size-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mb-6">
            <BarChart3 size={40} />
          </div>
          <h2 className="text-2xl font-black text-midnight italic uppercase tracking-tighter mb-2">Nenhuma Loja Vinculada</h2>
          <p className="text-slate-500 max-w-md font-medium">Seu perfil ainda não possui uma filial associada. Entre em contato com a administração para visualizar relatórios.</p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Relatórios de Cashbacks" subtitle="Controle de pagamentos para gerentes de filiais">
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
                  {Math.abs(kpi.trend).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-3xl font-black text-midnight tracking-tighter">
                {kpi.title.includes('Total') || kpi.title.includes('Volume') || kpi.title.includes('Média') || kpi.title.includes('Pendentes')
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpi.value)
                  : kpi.value}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* Charts Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Evolução de Cashbacks</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total de cashbacks geradas por dia</p>
              </div>
              <div className="size-12 bg-primary-blue/10 rounded-2xl flex items-center justify-center text-primary-blue">
                <LineChart size={24} />
              </div>
            </div>

            <div className="flex-1 relative min-h-[300px] flex items-end justify-between gap-1 sm:gap-2">
              {chart.values.map((val: number, i: number) => {
                const maxVal = Math.max(...chart.values, 1);
                const height = (val / maxVal) * 100;
                return (
                  <div key={i} className="relative w-full flex flex-col justify-end group h-full">
                    <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-midnight text-white text-[10px] font-black px-3 py-2 rounded-xl -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none mb-2 whitespace-nowrap z-10 shadow-xl">
                      R$ {val.toFixed(2).replace('.', ',')}
                    </div>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 5)}%` }}
                      transition={{ delay: i * 0.02, duration: 1, type: "spring" }}
                      className="w-full bg-slate-100 group-hover:bg-primary-blue rounded-t-lg transition-colors cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-6">
              {chart.labels.length > 0 && (
                <>
                  <span>{chart.labels[0]}</span>
                  <span>{chart.labels[Math.floor(chart.labels.length / 2)]}</span>
                  <span>{chart.labels[chart.labels.length - 1]}</span>
                </>
              )}
            </div>
          </div>

          {/* Secondary Charts Stack */}
          <div className="space-y-8">
            {/* Top Categories */}
            <div className="bg-midnight p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 size-40 bg-purple-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Cashbacks por Filial</h3>
                <PieChart className="text-slate-400" size={20} />
              </div>

              <div className="space-y-6 relative z-10">
                {team.filter(m => m.role === 'manager').length > 0 ? team.filter(m => m.role === 'manager').map((mgr: any, i: number) => {
                  const mgrTotal = financialReportData
                    .filter(r => r.managerName === mgr.name)
                    .reduce((acc, r) => acc + r.repasse, 0);
                  const percent = kpis[0].value > 0 ? (mgrTotal / kpis[0].value) * 100 : 0;
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">
                        <span>{mgr.name}</span>
                        <span className="text-white">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ delay: i * 0.2, duration: 1 }}
                          className={`h-full ${colors[i % colors.length]} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-slate-500 text-[10px] uppercase font-bold text-center py-4 italic">Nenhum gerente vinculado</p>
                )}
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

        {/* Financial Report Integration */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic leading-none">Extrato Financeiro</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalhamento de repasses e liquidações</p>
            </div>
          </div>
          
          <FinancialReportTable data={financialReportData} title="Relatório de Repasses Detalhado" />
        </div>

      </div>
    </MerchantLayout>
  );
}
