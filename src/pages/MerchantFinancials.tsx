import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Percent,
  Loader2,
  Building2,
  TrendingDown,
  Calendar
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
  const [platformRate, setPlatformRate] = useState(18);
  const [loading, setLoading] = useState(true);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);

  async function loadAppData() {
    try {
      setLoading(true);
      if (!profile) return;

      const mId = await businessRules.getMerchantId(profile.id);
      if (!mId) return;

      const [branchesData, finStats, ordersData, marketConfig, affiliateStatsData] = await Promise.all([
        businessRules.getBranches(),
        businessRules.getMerchantFinancials(profile.id, profile.role, profile.branch_id),
        businessRules.getMerchantOrders(mId, profile.branch_id),
        businessRules.getMarketplaceConfig(),
        businessRules.getAffiliateStats(profile.id).catch(() => null)
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
      setAffiliateStats(affiliateStatsData);

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
      const saleDate = o.orderDate ? new Date(o.orderDate) : new Date();
      
      // Regra de Pagamento: Próximo dia às 17h (se quitado/entregue até as 17h do dia anterior)
      const payDate = new Date(saleDate);
      payDate.setDate(payDate.getDate() + 1);

      const branch = branches.find(b => b.id === o.branchId);
      const payeeName = branch ? branch.name : (profile?.store_name || profile?.full_name || 'Lojista Beneficiário');

      return {
        orderId: o.id,
        buyerName: o.customerName || 'Cliente',
        payeeName,
        payeeCpf: profile?.cnpj || profile?.cpf || '',
        payeePixKey: profile?.pix_key || '',
        paymentMethod: o.paymentMethod || 'Não informado',
        orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
        deliveryStatus: extra?.status || 'Pendente',
        saleDate: saleDate.toLocaleDateString('pt-BR'),
        amount: o.amount,
        repasse: o.status === 'Cancelado' ? 0 : o.amount * (1 - (platformRate / 100)),
        payDate: payDate.toLocaleDateString('pt-BR'),
        payoutStatus: o.payoutStatus
      };
    });
  }, [orders, extras, platformRate, branches, profile]);

  const saldoDisponivel = useMemo(() => {
    return reportData
      .filter(r => (r.payoutStatus || 'pending') === 'pending' && r.deliveryStatus === 'Concluído' && r.orderStatus !== 'Cancelado')
      .reduce((acc, r) => acc + r.repasse, 0);
  }, [reportData]);

  const aReceber = useMemo(() => {
    return reportData
      .filter(r => (r.payoutStatus || 'pending') === 'pending' && r.deliveryStatus !== 'Concluído' && r.orderStatus !== 'Cancelado')
      .reduce((acc, r) => acc + r.repasse, 0);
  }, [reportData]);

  const totalFaturado = useMemo(() => {
    return reportData
      .filter(r => r.orderStatus !== 'Cancelado' && r.orderStatus !== 'Aguardando Pagamento' && r.orderStatus !== 'Pendente')
      .reduce((acc, r) => acc + r.amount, 0);
  }, [reportData]);

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
             { title: 'Saldo Disponível', value: saldoDisponivel, icon: Wallet, color: 'emerald' },
             { title: 'Total Faturado', value: totalFaturado, icon: TrendingUp, color: 'blue' },
             { title: 'A Receber', value: aReceber, icon: Clock, color: 'purple' },
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

        {/* Carteiras de Cashback (Segurado/Revendedor) */}
        {affiliateStats && (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-midnight uppercase tracking-widest flex items-center gap-2">
              <Wallet size={18} className="text-emerald-500" />
              Carteiras de Cashback (Segurado/Revendedor)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Carteira Semanal */}
              <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[180px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Disponível</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Carteira Semanal</p>
                  </div>
                  <div className="size-10 rounded-xl flex items-center justify-center border bg-white/5 text-emerald-500 border-white/5">
                    <Wallet size={20} />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">
                    R$ {(affiliateStats.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resgate Disponível</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Cashback Mensal */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[180px]">
                <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest mb-1">Acúmulo por Nível</p>
                    <p className="text-[8px] font-bold text-blue-300/40 uppercase tracking-[0.2em]">Cashback Mensal</p>
                  </div>
                  <div className="size-10 rounded-xl flex items-center justify-center border bg-white/10 text-white border-white/10">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">
                    R$ {(affiliateStats.monthlyBonus || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-blue-400 rounded-full"></div>
                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Recorrente Mensal</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Cashback Anual */}
              <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[180px]">
                <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-emerald-200/60 uppercase tracking-widest mb-1">Saldo Disponível</p>
                    <p className="text-[8px] font-bold text-emerald-300/40 uppercase tracking-[0.2em]">Cashback Anual</p>
                  </div>
                  <div className="size-10 rounded-xl flex items-center justify-center border bg-white/10 text-white border-white/10">
                    <Calendar size={20} />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">
                    R$ {(affiliateStats.annualBonus || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">Pagamento Dia 10/Dez</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Novo Relatório Financeiro Detalhado */}
        <FinancialReportTable data={reportData} title="Histórico Financeiro Detalhado" platformRate={platformRate} />

      </div>
    </MerchantLayout>
  );
}
