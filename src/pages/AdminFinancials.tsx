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
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';

export default function AdminFinancials() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [ordersData, extrasData] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras()
      ]);

      setOrders(ordersData);
      setExtras(extrasData);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros admin:', error);
      toast.error('Erro ao carregar dados globais');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile && !authLoading) {
      loadAdminData();
    }
  }, [profile, authLoading]);

  const reportData: FinancialRecord[] = useMemo(() => {
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

  if (authLoading || loading) {
    return (
      <AdminLayout title="Financeiro Global" subtitle="Carregando auditoria...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-indigo-500 animate-spin opacity-20" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Auditoria Financeira" subtitle="Controle global de repasses e faturamento">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
           {[
             { title: 'Faturamento Total', value: orders.reduce((a, b) => a + b.amount, 0), icon: DollarSign, color: 'text-indigo-500' },
             { title: 'Taxas Plataforma (20%)', value: orders.reduce((a, b) => a + b.amount, 0) * 0.2, icon: ShieldCheck, color: 'text-purple-500' },
             { title: 'Total Repasses', value: reportData.reduce((a, b) => a + b.repasse, 0), icon: CreditCard, color: 'text-emerald-500' },
             { title: 'Pedidos Totais', value: orders.length, icon: Building2, color: 'text-amber-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl group">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  {typeof stat.value === 'number' && i < 3 ? `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : stat.value}
                </h3>
             </div>
           ))}
        </div>

        {/* Relatório Financeiro Global */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
           <FinancialReportTable data={reportData} title="Auditoria de Pedidos do Ecossistema" isAdmin={true} />
        </div>

      </div>
    </AdminLayout>
  );
}
