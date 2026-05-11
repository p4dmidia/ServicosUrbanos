import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  DollarSign as Money,
  TrendingUp, 
  Wallet, 
  Clock, 
  Percent,
  Loader2,
  Building2,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';
import PaymentModal from '../components/PaymentModal';

export default function AdminFinancials() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [payees, setPayees] = useState<Record<string, any>>({});
  const [matrixPixKey, setMatrixPixKey] = useState('31998007412');
  const [matrixCpf, setMatrixCpf] = useState('123.456.789-00');
  const [loading, setLoading] = useState(true);
  
  // Payment Flow State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<FinancialRecord[]>([]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [ordersData, extrasData, settingsData] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras(),
        supabase.from('system_settings').select('key, value').in('key', ['matrix_pix_key', 'matrix_cpf'])
      ]);

      if (settingsData.data) {
        const pix = settingsData.data.find(s => s.key === 'matrix_pix_key')?.value;
        const cpf = settingsData.data.find(s => s.key === 'matrix_cpf')?.value || '000.000.000-00';
        setMatrixPixKey(pix || '31998007412');
        setMatrixCpf(cpf);
      }

      // Somente pedidos com repasse pendente
      const pendingOrders = ordersData.filter(o => o.payoutStatus === 'pending');
      
      // Coletar todos os IDs de destinatários (IDs numéricos)
      const potentialPayeeIds = [...new Set(
        pendingOrders.map(o => o.affiliateId || o.userId).filter(Boolean)
      )].map(id => Number(id));
      
      if (potentialPayeeIds.length > 0) {
        const payeesData = await businessRules.getPayeeDetails(potentialPayeeIds);
        const payeesMap: Record<string, any> = {};
        payeesData.forEach((p: any) => {
          payeesMap[String(p.id)] = p;
        });
        setPayees(payeesMap);
      }

      setOrders(ordersData);
      setExtras(extrasData);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros admin:', error);
      toast.error('Erro ao carregar dados financeiros');
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
    console.log('[DEBUG-FINANCEIRO] Profile Atual:', profile);
    
    const mapped = orders
      .filter(o => o.payoutStatus === 'pending')
      .map(o => {
        const extra = extras.find(e => e.id === o.id);
        const saleDate = new Date(o.date || o.created_at);
        
        const payDate = new Date(saleDate);
        payDate.setDate(payDate.getDate() + 1);

        const affiliateId = o.affiliateId;
        const payeeId = affiliateId || null; 
        const payeeKey = payeeId ? String(payeeId) : null;
        const payee = payeeKey ? payees[payeeKey] : null;

        const record = {
          orderId: String(o.id),
          buyerName: o.customerName || 'Cliente',
          payeeName: payee?.full_name || (payeeId ? `ID ${payeeId} (Pendente)` : 'Lojista Matriz'),
          orderStatus: o.status === 'Concluído' || o.status === 'Pago' ? 'Pago' : o.status,
          deliveryStatus: (extra?.status as any) || 'Pendente',
          saleDate: saleDate.toLocaleDateString('pt-BR'),
          amount: o.amount,
          repasse: o.amount * 0.8,
          payDate: payDate.toLocaleDateString('pt-BR'),
          payeeId: String(payeeId || 'matriz'),
          payeePixKey: payee?.pix_key || (!payeeId ? profile?.pix_key || matrixPixKey || '' : ''),
          payeeCpf: payee?.cpf || (!payeeId ? profile?.cpf || matrixCpf || '' : ''),
          paymentMethod: o.paymentMethod || 'PIX',
          items: o.items || []
        };
        
        if (record.payeeId === 'matriz') {
          // Log discreto para confirmação se necessário
        }
        
        return record;
      });

    console.log('[DEBUG-FINANCEIRO] Dados Mapeados:', mapped);
    return mapped;
  }, [orders, extras, payees, profile, matrixPixKey, matrixCpf]);

  const handleGeneratePayments = (selectedRecords: FinancialRecord[]) => {
    if (selectedRecords.length === 0) {
      toast.error('Nenhum registro selecionado para pagamento.');
      return;
    }

    setSelectedForPayment(selectedRecords);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (payeeGroup: any) => {
    try {
      const orderIds = payeeGroup.orders.map((o: any) => o.orderId);
      await businessRules.updateOrderPayoutStatus(orderIds, 'paid');
      
      setOrders(prev => prev.map(o => 
        orderIds.includes(String(o.id)) ? { ...o, payoutStatus: 'paid' } : o
      ));
      
      toast.success('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao atualizar status no banco.');
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Financeiro Global" subtitle="Sincronizando auditoria...">
        <div className="flex items-center justify-center p-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={42} className="text-indigo-500 animate-spin opacity-40" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Carregando Fluxo Financeiro</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pendingPayoutTotal = reportData.reduce((a, b) => a + b.repasse, 0);

  return (
    <AdminLayout title="Gestão de Pagamentos PIX" subtitle="Auditoria global de repasses para lojistas e parceiros">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Banner de Regras */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           <div className="xl:col-span-2 bg-amber-50/50 border border-amber-200/50 p-8 rounded-[2.5rem] flex gap-6 items-start shadow-sm">
              <div className="size-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                 <ShieldCheck size={32} />
              </div>
              <div className="space-y-4">
                 <h4 className="text-lg font-black text-amber-900 italic uppercase tracking-tighter">Regras de Liberação de Valores</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Condição de Repasse</p>
                       <p className="text-xs text-amber-800 leading-relaxed font-medium">
                         Os valores só serão liberados ao lojista quando o status do pedido e status da entrega estiverem <span className="font-black">PAGOS E ENTREGUES</span>.
                       </p>
                    </div>
                    <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
                       <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Padrão de Liquidação</p>
                       <p className="text-[10px] text-amber-800 font-bold leading-tight uppercase">
                         Repasses automáticos em D+1. <br/> Taxa de Administração: 20%.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 group relative overflow-hidden flex flex-col justify-between">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <QrCode size={100} className="text-white" />
               </div>
               <div>
                 <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-1">Total a Pagar Hoje</p>
                 <h3 className="text-4xl font-black text-white tracking-tighter italic leading-none">
                    R$ {pendingPayoutTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </h3>
               </div>
               <div className="mt-4">
                  <span className="text-[9px] text-indigo-100 font-black uppercase tracking-[0.2em] border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm">Sistema PIX Pronto</span>
               </div>
           </div>
        </div>

        {/* Tabela de Relatórios */}
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
           <FinancialReportTable 
             data={reportData} 
             title="Auditoria de Pedidos Pendentes" 
             isAdmin={true} 
             onGeneratePayments={handleGeneratePayments}
           />
        </div>

      </div>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedRecords={selectedForPayment}
            onConfirmPayment={handleConfirmPayment}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
