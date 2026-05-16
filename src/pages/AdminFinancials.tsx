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
  const [dynamicPlatformRate, setDynamicPlatformRate] = useState(20);
  const [loading, setLoading] = useState(true);
  
  // Payment Flow State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<FinancialRecord[]>([]);
  
  // View State
  const [viewType, setViewType] = useState<'merchants' | 'affiliates'>('merchants');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [affiliateReport, setAffiliateReport] = useState<any[]>([]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [ordersData, extrasData, settingsData, affiliateData, marketConfig] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras(),
        supabase.from('system_settings').select('key, value').in('key', ['matrix_pix_key', 'matrix_cpf']),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`),
        businessRules.getMarketplaceConfig()
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
      setAffiliateReport(affiliateData);
      const rateFromDb = marketConfig?.commissionRate || 12; // Mudei para 12 como fallback
      console.log('!!! DEBUG V2 - TAXA DO BANCO:', rateFromDb);
      setDynamicPlatformRate(rateFromDb);
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
  }, [profile, authLoading, dateRange]);

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
          repasse: o.amount * (1 - (dynamicPlatformRate / 100)),
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
  }, [orders, extras, payees, profile, matrixPixKey, matrixCpf, dynamicPlatformRate]);

  // Filtro para mostrar apenas afiliados com saldo pendente
  const filteredAffiliateData = useMemo(() => {
    return affiliateReport.filter(r => (r.mensal + r.digital + r.anual) > 0.01);
  }, [affiliateReport]);

  const handleGeneratePayments = (selectedItems: any[]) => {
    if (selectedItems.length === 0) {
      toast.error('Nenhum registro selecionado para pagamento.');
      return;
    }

    // Se estiver no modo afiliados, transformamos para o formato que o PaymentModal espera
    if (viewType === 'affiliates') {
      const transformed = selectedItems.map(r => ({
        orderId: `CASH-${r.id.substring(0, 5)}`,
        buyerName: 'Rede MMN',
        payeeName: r.name,
        orderStatus: 'Concluído',
        deliveryStatus: 'Concluído',
        saleDate: new Date().toLocaleDateString('pt-BR'),
        amount: r.mensal,
        repasse: r.mensal, // No modo afiliado, o repasse líquido a pagar é apenas o mensal
        payDate: new Date().toLocaleDateString('pt-BR'),
        payeeId: r.id,
        payeePixKey: r.pix_key,
        payeeCpf: r.cpf,
        paymentMethod: 'PIX',
        items: [
          { name: 'Cashback Mensal', price: r.mensal },
          { name: 'Cashback Digital', price: r.digital },
          { name: 'Cashback Anual', price: r.anual }
        ]
      }));
      setSelectedForPayment(transformed);
    } else {
      setSelectedForPayment(selectedItems);
    }
    
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (payeeGroup: any) => {
    try {
      if (viewType === 'merchants') {
        const orderIds = payeeGroup.orders.map((o: any) => o.orderId);
        await businessRules.updateOrderPayoutStatus(orderIds, 'paid');
        
        setOrders(prev => prev.map(o => 
          orderIds.includes(String(o.id)) ? { ...o, payoutStatus: 'paid' } : o
        ));
      } else {
        // 1. Registramos o histórico na tabela de relatórios
        await businessRules.registerAffiliatePayout({
          profile_id: payeeGroup.payeeId,
          amount: payeeGroup.totalAmount,
          mensal: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Mensal'))?.price || 0,
          digital: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Digital'))?.price || 0,
          anual: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Anual'))?.price || 0,
          pix_key: payeeGroup.payeePixKey
        });

        // 2. Mudamos o status das transações para 'paid' (IGUAL AO LOJISTA)
        const { error: updateError } = await supabase
          .from('commissions')
          .update({ status: 'paid' })
          .eq('affiliate_id', payeeGroup.payeeId)
          .eq('status', 'released');

        if (updateError) throw updateError;
        
        toast.success(`Pagamento de R$ ${payeeGroup.totalAmount.toFixed(2)} para ${payeeGroup.payeeName} liquidado.`);
        
        // 3. Recarrega os dados
        await loadAdminData();
      }
      
      toast.success('Pagamento processado com sucesso!');
    } catch (error: any) {
      console.error('Erro detalhado ao confirmar pagamento:', error);
      // Mostra o erro real do banco para sabermos o que está faltando
      const errorMsg = error.message || error.details || 'Falha ao atualizar status no banco.';
      toast.error(`Erro no Banco: ${errorMsg}`);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Financeiro Global" subtitle="Sincronizando auditoria...">
        <div className="flex items-center justify-center p-20">
          <div className="flex flex-col">
            <h2 className="text-4xl font-black text-midnight italic uppercase tracking-tighter">Financeiro [Sincronizado]</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestão de Repasses e Auditoria de Fluxo</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pendingPayoutTotal = reportData.reduce((a, b) => a + b.repasse, 0);

  return (
    <AdminLayout title="Gestão de Pagamentos PIX [Sincronizado]" subtitle="Auditoria global de repasses para lojistas e parceiros">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Toggle de Visualização e Filtros */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setViewType('merchants')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'merchants' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Lojistas
            </button>
            <button
              onClick={() => setViewType('affiliates')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'affiliates' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Afiliados
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Clock size={16} className="text-indigo-500" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[10px] font-black text-slate-600 outline-none"
              />
              <span className="text-slate-300 text-[10px]">Até</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-[10px] font-black text-slate-600 outline-none"
              />
            </div>
            
            <button 
              onClick={() => {
                const now = new Date();
                setDateRange({
                  start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
              }}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              Este Mês
            </button>
          </div>
        </div>
        
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
                          Repasses automáticos em D+1. <br/> Taxa de Administração: {dynamicPlatformRate}%.
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
              data={viewType === 'merchants' ? reportData : []} 
              affiliateData={viewType === 'affiliates' ? filteredAffiliateData : []}
              title={viewType === 'merchants' ? "Auditoria de Pedidos Pendentes" : "Relatório de Cashbacks por Afiliado"} 
              isAdmin={true} 
              mode={viewType}
              onGeneratePayments={handleGeneratePayments}
              hideReceiptButton={true}
              hidePdfButton={true}
              platformRate={dynamicPlatformRate}
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
