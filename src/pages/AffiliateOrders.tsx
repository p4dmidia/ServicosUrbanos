import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import AffiliateLayout from '../components/AffiliateLayout';

export default function AffiliateOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [extras, setExtras] = useState<Record<string, any>>({});
  const [mmnConfig, setMmnConfig] = useState<any>(null);
  const [mmnLevels, setMmnLevels] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Unificamos tudo em um único useEffect para evitar race conditions
  useEffect(() => {
    async function loadAllData() {
      if (!user) return;
      
      try {
        setLoading(true);
        // Buscamos Pedidos, Configurações, Níveis e Transações em paralelo
        const [ordersRes, config, levels, transRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .eq('customer_id', user.id)
            .order('order_date', { ascending: false }),
          businessRules.getMMNConfig(),
          businessRules.getMMNLevels(),
          supabase
            .from('transactions')
            .select('*')
            .eq('profile_id', user.id)
            .eq('type', 'commission')
        ]);
        
        if (ordersRes.error) throw ordersRes.error;
        
        setOrders(ordersRes.data || []);
        setMmnConfig(config);
        setMmnLevels(levels || []);
        setTransactions(transRes.data || []);

        // Busca extras (códigos de retirada)
        if (ordersRes.data && ordersRes.data.length > 0) {
          const orderIds = ordersRes.data.map(o => o.id);
          const { data: extrasData } = await supabase
            .from('order_extras')
            .select('*')
            .in('id', orderIds);
          
          if (extrasData) {
            const extrasMap: Record<string, any> = {};
            extrasData.forEach(e => {
              extrasMap[e.id] = e;
            });
            setExtras(extrasMap);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do afiliado:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [user]);

  const calculateCashbackBreakdown = (order: any) => {
    if (!mmnConfig || !mmnLevels.length || !order) return { mensal: 0, digital: 0, anual: 0, total: 0 };
    
    const isPaid = order.status === 'Concluído' || order.status === 'Pago, Aguardando Retirada' || order.status === 'Enviado' || order.status === 'Entregue';
    const totalOrderAmount = Number(order.amount) || 0;

    // 1. SE O PEDIDO JÁ FOI PAGO: Histórico Real (Transações)
    if (isPaid) {
      const orderTransactions = transactions.filter(t => t.order_id === order.id || t.description?.includes(order.id?.substring(0, 8)));
      
      if (orderTransactions.length > 0) {
        const mensal = orderTransactions.filter(t => t.description?.toLowerCase().includes('mensal')).reduce((acc, t) => acc + Number(t.amount), 0);
        const digital = orderTransactions.filter(t => t.description?.toLowerCase().includes('cd') || t.description?.toLowerCase().includes('digital')).reduce((acc, t) => acc + Number(t.amount), 0);
        const anual = orderTransactions.filter(t => t.description?.toLowerCase().includes('anual')).reduce((acc, t) => acc + Number(t.amount), 0);
        const total = orderTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
        
        if (total > 0) return { mensal, digital, anual, total };
      }
    }

    // 2. SE O PEDIDO NÃO FOI PAGO (Aguardando Pagamento): Lógica Live do Banco
    // Pesos atuais definidos pelo Admin no Banco
    const pMensal = Number(mmnConfig.cashbackMensal) || 0;
    const pDigital = Number(mmnConfig.cashbackDigital) || 0;
    const pAnual = Number(mmnConfig.cashbackAnual) || 0;
    const totalRatios = (pMensal + pDigital + pAnual) || 4.5;

    // Percentual atual do Nível 1 (G1) definido no Banco
    const g1Level = mmnLevels.find(l => Number(l.level) === 1);
    const g1Value = g1Level ? Number(g1Level.value) : 0.75;

    let userTotalCashback = 0;
    if (mmnConfig.paymentType === 'percent') {
      userTotalCashback = totalOrderAmount * (g1Value / 100);
    } else {
      userTotalCashback = g1Value;
    }

    // Distribuição Proporcional baseada nos pesos ATUAIS
    const vMensal = userTotalCashback * (pMensal / totalRatios);
    const vDigital = userTotalCashback * (pDigital / totalRatios);
    const vAnual = userTotalCashback * (pAnual / totalRatios);
    
    return {
      mensal: Number(vMensal.toFixed(2)),
      digital: Number(vDigital.toFixed(2)),
      anual: Number(vAnual.toFixed(2)),
      total: Number(userTotalCashback.toFixed(2))
    };
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Concluído': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Aguardando Pagamento': return <Clock size={16} className="text-amber-500" />;
      case 'Pago, Aguardando Retirada': return <ShoppingBag size={16} className="text-indigo-500" />;
      case 'Processando': return <Clock size={16} className="text-blue-500" />;
      case 'Cancelado': return <XCircle size={16} className="text-red-500" />;
      default: return <Package size={16} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Aguardando Pagamento': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Pago, Aguardando Retirada': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Processando': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Cancelado': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };  return (
    <>
      <AffiliateLayout title="Meus Pedidos">
        <div className="max-w-6xl mx-auto p-8 lg:p-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-midnight uppercase tracking-tighter flex items-center gap-3">
                <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
                  <ShoppingBag size={24} />
                </div>
                Meus Pedidos
              </h1>
              <p className="text-slate-500 mt-2 font-medium">Acompanhe suas compras e histórico de pedidos</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-medium text-sm"
                />
              </div>
              <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="size-8 border-4 border-slate-200 border-t-primary-blue rounded-full animate-spin"></div>
                <p className="font-medium">Carregando seus pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Package size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-midnight uppercase tracking-widest mb-1">Nenhum Pedido Encontrado</h3>
                  <p className="text-sm">Você ainda não realizou compras no UrbaShop ou sua busca não retornou resultados.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order, idx) => {
                  const breakdown = calculateCashbackBreakdown(order);
                  return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailsModal(true);
                    }}
                    className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center justify-between gap-6 group cursor-pointer"
                  >
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                      <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h4 className="font-black text-midnight">Pedido #{order.id?.substring(0,8).toUpperCase()}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)} {order.status || 'Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Realizado em {new Date(order.order_date).toLocaleDateString('pt-BR')} às {new Date(order.order_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total</p>
                        <p className="font-black text-midnight text-lg">R$ {Number(order.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-left md:text-right min-w-[120px]">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-emerald-600">Cashback Recebido</p>
                        <div className="space-y-0.5">
                          <div className="flex justify-between md:justify-end gap-2 text-[10px] font-bold">
                            <span className="text-slate-400">Mensal ({mmnConfig?.cashbackMensal || '...'}%):</span>
                            <span className="text-emerald-600">R$ {breakdown.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between md:justify-end gap-2 text-[10px] font-bold">
                            <span className="text-slate-400">Digital ({mmnConfig?.cashbackDigital || '...'}%):</span>
                            <span className="text-emerald-600">R$ {breakdown.digital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between md:justify-end gap-2 text-[10px] font-bold border-b border-slate-100 pb-0.5">
                            <span className="text-slate-400">Anual ({mmnConfig?.cashbackAnual || '...'}%):</span>
                            <span className="text-emerald-600">R$ {breakdown.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <p className="font-black text-emerald-500 text-base mt-1 text-right">
                            R$ {breakdown.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="size-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-primary-blue group-hover:text-white group-hover:border-primary-blue transition-all shrink-0">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            )}
          </div>
        </div>
      </AffiliateLayout>

      {/* MODAL DE DETALHES DO PEDIDO */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowDetailsModal(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9, y: 20}} animate={{opacity:1, scale:1, y: 0}} exit={{opacity:0, scale:0.9, y: 20}} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black text-midnight uppercase italic tracking-tighter leading-none mb-2">Detalhes do Pedido</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {selectedOrder.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status || 'Pendente'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="size-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                >
                  <Clock size={24} className="rotate-45" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 overflow-y-auto">
                
                {/* Resumo de Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Pedido</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrder.status)}
                      <span className="text-sm font-black text-midnight">{selectedOrder.status || 'Pendente'}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data da Compra</p>
                    <span className="text-sm font-black text-midnight">{new Date(selectedOrder.order_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="p-4 bg-primary-blue/5 rounded-2xl border border-primary-blue/10">
                    <p className="text-[9px] font-black text-primary-blue uppercase tracking-widest mb-1">Cód. Retirada</p>
                    <span className="text-sm font-black text-primary-blue font-mono">{extras[selectedOrder.id]?.withdrawal_code || '---'}</span>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Produtos Adquiridos</h5>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary-blue">
                                <Package size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-midnight">{item.product_name || item.name || 'Produto'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quantidade: {item.quantity || 1}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-midnight italic tracking-tighter">R$ {Number(item.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )) : (
                      <div className="p-5 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs italic">
                        Detalhes dos itens indisponíveis para este pedido.
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="border-t border-dashed border-slate-200 pt-6 space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>R$ {Number(selectedOrder.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Breakdown de Cashback (Seu Nível)</p>
                          {(() => {
                            const breakdown = calculateCashbackBreakdown(selectedOrder);
                            return (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500">Bônus Mensal ({mmnConfig?.cashbackMensal || '...'}%)</span>
                                  <span className="text-sm font-black text-blue-600">R$ {breakdown.mensal.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500">Bônus Digital ({mmnConfig?.cashbackDigital || 1.00}%)</span>
                                  <span className="text-sm font-black text-emerald-600">R$ {breakdown.digital.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500">Bônus Anual ({mmnConfig?.cashbackAnual || 0.75}%)</span>
                                  <span className="text-sm font-black text-indigo-600">R$ {breakdown.anual.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="pt-4 border-t border-emerald-200 flex justify-between items-center">
                                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total a Receber</span>
                                  <span className="text-lg font-black text-emerald-600">R$ {breakdown.total.toFixed(2).replace('.', ',')}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                    <div className="flex justify-between items-center bg-midnight text-white p-6 rounded-2xl mt-4 shadow-xl shadow-midnight/20">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Pago</span>
                      <span className="text-2xl font-black italic tracking-tighter">R$ {Number(selectedOrder.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-midnight rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
