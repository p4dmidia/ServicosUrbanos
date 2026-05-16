import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Percent,
  Loader2,
  Building2,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, Branch } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';

export default function MerchantFinancials() {
  const { profile, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [platformRate, setPlatformRate] = useState(20);
  const [loading, setLoading] = useState(true);

  async function loadAppData() {
    try {
      setLoading(true);
      if (!profile) return;

      const mId = await businessRules.getMerchantId(profile.id);
      if (!mId) return;

      const [branchesData, finStats, ordersData, marketConfig] = await Promise.all([
        businessRules.getBranches(),
        businessRules.getMerchantFinancials(profile.id, profile.role, profile.branch_id),
        businessRules.getMerchantOrders(mId, profile.branch_id),
        businessRules.getMarketplaceConfig()
      ]);

      // Buscar extras (status de entrega) para os pedidos
      const extrasData = await Promise.all(
        ordersData.map(o => businessRules.getOrderExtra(o.id).catch(() => null))
      );

      setBranches(branchesData);
      setFinancials(finStats);
      setOrders(ordersData);
      setExtras(extrasData.filter(Boolean));
      setPlatformRate(marketConfig?.commissionRate || 20);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile && !authLoading) {
      loadAppData();
    }
  }, [profile, authLoading]);

  // Mapear dados para o formato do relatório
  const reportData: FinancialRecord[] = useMemo(() => {
    return orders.map(o => {
      const extra = extras.find(e => e.id === o.id);
      const saleDate = new Date(o.date);
      
      // Regra de Pagamento: Próximo dia às 17h (se quitado/entregue até as 17h do dia anterior)
      const payDate = new Date(saleDate);
      payDate.setDate(payDate.getDate() + 1);

      return {
        orderId: o.id,
        buyerName: o.customerName || 'Cliente',
        orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
        deliveryStatus: extra?.status || 'Pendente',
        saleDate: saleDate.toLocaleDateString('pt-BR'),
        amount: o.amount,
        repasse: o.amount * (1 - (platformRate / 100)),
        payDate: payDate.toLocaleDateString('pt-BR')
      };
    });
  }, [orders, extras, platformRate]);

  if (authLoading || loading) {
    return (
      <MerchantLayout title="Financeiro" subtitle="Carregando dados...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-primary-blue animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

  const isOwner = profile.role === 'owner';

  return (
    <MerchantLayout title="Financeiro" subtitle={`Gestão de Repasses - ${isOwner ? 'Matriz' : 'Filial'}`}>
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
           {[
             { title: 'Saldo Disponível', value: financials?.balance, icon: Wallet, color: 'emerald' },
             { title: 'Total Faturado', value: financials?.totalBilled, icon: TrendingUp, color: 'blue' },
             { title: 'A Receber', value: reportData.filter(r => r.orderStatus !== 'Pago' || r.deliveryStatus !== 'Entregue').reduce((a, b) => a + b.repasse, 0), icon: Clock, color: 'purple' },
             { title: 'Taxa Plataforma', value: `${platformRate}%`, icon: Percent, color: 'slate' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-midnight tracking-tighter">
                  {typeof stat.value === 'number' ? `R$ ${stat.value.toFixed(2).replace('.', ',')}` : stat.value}
                </h3>
             </div>
           ))}
        </div>

        {/* Novo Relatório Financeiro Detalhado */}
        <FinancialReportTable data={reportData} title="Histórico Financeiro Detalhado" platformRate={platformRate} />

      </div>
    </MerchantLayout>
  );
}
