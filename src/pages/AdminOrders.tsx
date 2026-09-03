import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  X, 
  Clock, 
  DollarSign, 
  User, 
  CreditCard, 
  Calendar,
  MapPin,
  Users,
  Target,
  Building2,
  Sparkles,
  Share2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Phone,
  Mail,
  FileText,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_initial: string;
  amount: number;
  status: string;
  items: any; // JSON array of items
  cashback_amount: number;
  payment_method: string;
  shipping_address: string;
  created_at: string;
  reseller_id?: string | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados para Inteligência e Rastreabilidade Completa do Pedido
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      toast.error('Erro ao carregar faturas de planos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setOrderDetailsLoading(true);
    setOrderDetails(null);

    try {
      // 1. Buscar perfil do comprador (G0)
      const { data: customer } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.customer_id)
        .maybeSingle();

      // 2. Buscar todas as transações vinculadas a este pedido
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`order_id.eq.${order.id},description.ilike.%#${order.id}%`);

      // 3. Buscar perfil do G1 (patrocinador direto)
      let g1Profile: any = null;
      if (customer?.referred_by) {
        const { data: pG1 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customer.referred_by)
          .maybeSingle();
        g1Profile = pG1;
      }

      // 4. Buscar perfil do G2 (upline do G1)
      let g2Profile: any = null;
      if (g1Profile?.referred_by) {
        const { data: pG2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', g1Profile.referred_by)
          .maybeSingle();
        g2Profile = pG2;
      }

      // 5. Buscar perfil do Revendedor Regional
      const resellerTx = (transactions || []).find(t => 
        t.description?.includes('Revendedor') || t.description?.includes('Regional')
      );
      let resellerId = order.reseller_id || customer?.reseller_id || resellerTx?.profile_id;
      if (!resellerId && g1Profile?.role === 'regional_reseller') resellerId = g1Profile.id;
      if (!resellerId && g2Profile?.role === 'regional_reseller') resellerId = g2Profile.id;

      let resellerProfile: any = null;
      if (resellerId) {
        const { data: pReseller } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', resellerId)
          .maybeSingle();
        resellerProfile = pReseller;
      }

      // 6. Calcular comissões triplas pagas por perfil
      const calcCommissions = (profileId?: string, isReseller: boolean = false) => {
        if (!profileId || !transactions) return { semanal: 0, mensal: 0, anual: 0, total: 0 };
        const userTxs = transactions.filter(t => {
          if (t.profile_id !== profileId) return false;
          const isRes = t.description?.includes('Revendedor') || t.description?.includes('Regional');
          return isReseller ? isRes : !isRes;
        });
        const semanal = userTxs
          .filter(t => t.description?.includes('Semanal'))
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const mensal = userTxs
          .filter(t => t.description?.includes('Mensal'))
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const anual = userTxs
          .filter(t => t.description?.includes('Anual'))
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        return {
          semanal,
          mensal,
          anual,
          total: semanal + mensal + anual,
          status: userTxs[0]?.status || 'pending',
          rawTxs: userTxs
        };
      };

      const g0Commissions = calcCommissions(customer?.id, false);
      const g1Commissions = calcCommissions(g1Profile?.id, false);
      const g2Commissions = calcCommissions(g2Profile?.id, false);
      const resellerCommissions = calcCommissions(resellerProfile?.id, true);

      // Localização exata de onde foi o pedido
      const location = {
        city: customer?.city || 'Salvador',
        state: customer?.state || 'BA',
        fullAddress: customer?.address 
          ? `${customer.address}, ${customer.number || 'S/N'}${customer.neighborhood ? ` - ${customer.neighborhood}` : ''}, ${customer.city || ''}/${customer.state || ''}${customer.zip_code ? ` (CEP: ${customer.zip_code})` : ''}`
          : order.shipping_address || 'Ativação Digital'
      };

      setOrderDetails({
        customer,
        location,
        g0: {
          profile: customer,
          commissions: g0Commissions
        },
        g1: {
          profile: g1Profile,
          commissions: g1Commissions
        },
        g2: {
          profile: g2Profile,
          commissions: g2Commissions
        },
        reseller: {
          profile: resellerProfile,
          commissions: resellerCommissions
        },
        transactions: transactions || []
      });
    } catch (err) {
      console.error('Erro ao buscar detalhes da linhagem do pedido:', err);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Status do pedido atualizado para: ${newStatus}`);
      
      // Se tiver o modal aberto, atualiza o item selecionado
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      loadOrders();
    } catch (err: any) {
      toast.error('Erro ao atualizar status do pedido.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' 
      ? true 
      : statusFilter === 'Pago'
        ? (o.status === 'Pago' || o.status === 'Pago, Aguardando Retirada' || o.status === 'Concluído')
        : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago':
      case 'Pago, Aguardando Retirada':
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400"></span>
            Ativo / Pago
          </span>
        );
      case 'Aguardando Pagamento':
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="size-1.5 rounded-full bg-amber-400"></span>
            Aguardando
          </span>
        );
      case 'Cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="size-1.5 rounded-full bg-red-400"></span>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Faturas e Assinaturas MMN">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Header com Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              Faturas de <span className="text-indigo-400">Assinaturas</span>
            </h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              Gestão de compras de licenças, pagamentos e distribuição MMN
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por ID ou Cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all w-64"
              />
            </div>

            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
              {['Todos', 'Pago', 'Pendente', 'Cancelado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.01]">
                  <th className="py-5 px-6">ID Pedido</th>
                  <th className="py-5 px-4">Cliente / Comprador</th>
                  <th className="py-5 px-4">Valor Total</th>
                  <th className="py-5 px-4">Método</th>
                  <th className="py-5 px-4">Status</th>
                  <th className="py-5 px-4">Data/Hora</th>
                  <th className="py-5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando pedidos...</span>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => handleOpenOrderDetails(order)}
                      className="hover:bg-white/[0.03] transition-colors border-b border-white/5 cursor-pointer group"
                    >
                      <td className="py-5 px-6 font-mono text-xs font-black text-indigo-400 group-hover:underline">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                            {order.customer_initial || '?'}
                          </div>
                          <span className="text-sm font-black text-white">{order.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 font-black text-white font-mono text-xs">
                        R$ {order.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.payment_method || 'Pix'}</span>
                      </td>
                      <td className="py-5 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-5 px-4 text-xs font-bold text-slate-500 font-mono">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenOrderDetails(order)}
                            className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Ver Detalhes Completos"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {(order.status === 'Aguardando Pagamento' || order.status === 'Pendente') && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'Concluído')}
                                disabled={actionLoading === order.id}
                                className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all cursor-pointer"
                                title="Aprovar Pagamento"
                              >
                                {actionLoading === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'Cancelado')}
                                disabled={actionLoading === order.id}
                                className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all cursor-pointer"
                                title="Cancelar Pedido"
                              >
                                {actionLoading === order.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detalhes Ampliado com Rastreabilidade MMN & Localização */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="fixed inset-0 bg-[#000]/75 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0e17] rounded-[2.5rem] border border-white/10 p-6 sm:p-10 shadow-3xl overflow-y-auto custom-scrollbar text-slate-300 space-y-8 my-auto z-10"
            >
              {/* Header do Modal */}
              <div className="flex justify-between items-start border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      Pedido #{selectedOrder.id}
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <span>Fatura de Assinatura MMN</span>
                    <span>•</span>
                    <span className="text-indigo-400">Rastreabilidade Completa de Linhagem & Comissões</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="size-10 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {orderDetailsLoading ? (
                <div className="py-20 text-center">
                  <Loader2 className="animate-spin text-indigo-400 mx-auto mb-3" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Carregando inteligência de linhagem e comissões...
                  </p>
                </div>
              ) : (
                <div className="space-y-8">

                  {/* 1. LOCALIZAÇÃO DO PEDIDO (ONDE QUE FOI ESSE PEDIDO) */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                        <MapPin size={26} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Origem e Localização do Pedido
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                            Polo Regional: {orderDetails?.location?.city || 'Salvador'} - {orderDetails?.location?.state || 'BA'}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white tracking-tight">
                          {orderDetails?.location?.city} / {orderDetails?.location?.state}
                        </h4>
                        <p className="text-xs text-slate-300 font-medium">
                          <strong>Endereço Completo de Cadastro:</strong> {orderDetails?.location?.fullAddress}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Modalidade: {selectedOrder.shipping_address || 'Licenciamento MMN Digital'} • Data: {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. DADOS DO CLIENTE & PLANO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dados do Comprador */}
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider mb-2">
                        <User size={16} />
                        Dados do Titular Comprador (G0)
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Nome:</span>
                        <span className="text-white font-bold">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">CPF:</span>
                        <span className="text-white font-mono">{orderDetails?.customer?.cpf || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Telefone / WhatsApp:</span>
                        <span className="text-white font-mono">{orderDetails?.customer?.whatsapp || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">E-mail:</span>
                        <span className="text-slate-300 font-mono">{orderDetails?.customer?.email || 'Não informado'}</span>
                      </div>
                    </div>

                    {/* Resumo Financeiro da Venda */}
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                        <DollarSign size={16} />
                        Plano e Pagamento
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Plano / Produto:</span>
                        <span className="text-white font-bold">
                          {Array.isArray(selectedOrder.items) && selectedOrder.items[0]?.name 
                            ? selectedOrder.items[0].name 
                            : 'Licenciamento MMN'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Forma de Pagamento:</span>
                        <span className="text-white font-bold uppercase">{selectedOrder.payment_method || 'Pix'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Cashback Estimado do Pedido:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          R$ {Number(selectedOrder.cashback_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-black">
                        <span className="text-white uppercase">Total Pago:</span>
                        <span className="text-indigo-400 font-mono text-base">
                          R$ {Number(selectedOrder.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. DIVISÃO DETALHADA DE COMISSÕES: G0, G1, G2 E REVENDEDOR REGIONAL */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 className="text-indigo-400" size={20} />
                        <h4 className="text-base font-black text-white uppercase italic tracking-tight">
                          Divisão de Comissões e Repasses (MMN G0 ao G2 + Regional)
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        Tri-Split Semanal, Mensal e Anual
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* CARD G0: TITULAR COMPRADOR */}
                      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🟡</span>
                            <span className="font-black text-xs text-amber-400 uppercase tracking-wide">
                              G0 - Titular da Compra
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                            Cashback Próprio (6%)
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">{orderDetails?.g0?.profile?.full_name || selectedOrder.customer_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">CPF: {orderDetails?.g0?.profile?.cpf || '---'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">PIX: {orderDetails?.g0?.profile?.pix_key || '---'}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl text-center text-xs font-mono">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Semanal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g0?.commissions?.semanal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Mensal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g0?.commissions?.mensal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Anual (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g0?.commissions?.anual?.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Pago ao G0:</span>
                          <span className="text-amber-400 font-mono font-black text-sm">
                            R$ {orderDetails?.g0?.commissions?.total?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* CARD G1: PATROCINADOR DIRETO */}
                      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🟢</span>
                            <span className="font-black text-xs text-emerald-400 uppercase tracking-wide">
                              G1 - Indicador Direto
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                            1º Nível Upline (6%)
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {orderDetails?.g1?.profile?.full_name || 'Sic Comercio / Matriz (Sem Indicador Direto)'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">CPF: {orderDetails?.g1?.profile?.cpf || '---'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">PIX: {orderDetails?.g1?.profile?.pix_key || '---'}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl text-center text-xs font-mono">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Semanal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g1?.commissions?.semanal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Mensal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g1?.commissions?.mensal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Anual (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g1?.commissions?.anual?.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Pago ao G1:</span>
                          <span className="text-emerald-400 font-mono font-black text-sm">
                            R$ {orderDetails?.g1?.commissions?.total?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* CARD G2: REDE INDIRETA (2º NÍVEL) */}
                      <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🔵</span>
                            <span className="font-black text-xs text-sky-400 uppercase tracking-wide">
                              G2 - Rede Indireta
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                            2º Nível Upline (6%)
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {orderDetails?.g2?.profile?.full_name || 'Sic Comercio / Matriz (Sem Upline G2)'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">CPF: {orderDetails?.g2?.profile?.cpf || '---'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">PIX: {orderDetails?.g2?.profile?.pix_key || '---'}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl text-center text-xs font-mono">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Semanal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g2?.commissions?.semanal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Mensal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g2?.commissions?.mensal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Anual (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.g2?.commissions?.anual?.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Pago ao G2:</span>
                          <span className="text-sky-400 font-mono font-black text-sm">
                            R$ {orderDetails?.g2?.commissions?.total?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* CARD REVENDEDOR REGIONAL */}
                      <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🏢</span>
                            <span className="font-black text-xs text-purple-400 uppercase tracking-wide">
                              Revendedor Regional
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                            Repasse Regional (6%)
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {orderDetails?.reseller?.profile?.full_name || 'Sic Comercio / Sem Revendedor Regional'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            CPF: {orderDetails?.reseller?.profile?.cpf || '---'} • Polo: {orderDetails?.reseller?.profile?.city || 'Regional'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">PIX: {orderDetails?.reseller?.profile?.pix_key || '---'}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl text-center text-xs font-mono">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Semanal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.reseller?.commissions?.semanal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Mensal (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.reseller?.commissions?.mensal?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Anual (2%)</span>
                            <span className="text-white font-bold">R$ {orderDetails?.reseller?.commissions?.anual?.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Pago à Revenda:</span>
                          <span className="text-purple-400 font-mono font-black text-sm">
                            R$ {orderDetails?.reseller?.commissions?.total?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Resumo Geral da Repartição */}
                    {(() => {
                      const totalDistributed = 
                        (orderDetails?.g0?.commissions?.total || 0) +
                        (orderDetails?.g1?.commissions?.total || 0) +
                        (orderDetails?.g2?.commissions?.total || 0) +
                        (orderDetails?.reseller?.commissions?.total || 0);
                      const platformMargin = Math.max(0, selectedOrder.amount - totalDistributed);

                      return (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px] uppercase font-sans">
                              Total Distribuído em Comissões (24%):
                            </span>
                            <span className="text-indigo-400 font-black text-sm">
                              R$ {totalDistributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase font-sans">
                              Margem Retida pela Empresa (76%):
                            </span>
                            <span className="text-emerald-400 font-black text-sm">
                              R$ {platformMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 4. TRANSAÇÕES DETALHADAS REGISTRADAS NO BANCO */}
                  {orderDetails?.transactions?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} />
                        Transações Registradas no Sistema ({orderDetails.transactions.length})
                      </h4>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 divide-y divide-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                        {orderDetails.transactions.map((tx: any) => (
                          <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                            <div>
                              <p className="text-white font-bold">{tx.description}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{new Date(tx.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-emerald-400 font-black block">
                                R$ {Number(tx.amount).toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-sans">
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações Pendentes */}
                  {(selectedOrder.status === 'Aguardando Pagamento' || selectedOrder.status === 'Pendente') && (
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelado')}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Recusar / Cancelar
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Concluído')}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 cursor-pointer"
                      >
                        Aprovar e Ativar Plano
                      </button>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
