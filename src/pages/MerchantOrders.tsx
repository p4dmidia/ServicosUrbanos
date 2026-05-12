import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Check,
  Loader2,
  Activity as ActivityIcon,
  MapPin,
  CreditCard,
  Package,
  Key,
  Truck,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, OrderWithCode } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customerName: string;
  customerInitial: string;
  date: string;
  amount: number;
  status: 'Aguardando Pagamento' | 'Pago, Aguardando Retirada' | 'Concluído' | 'Cancelado' | 'Pendente' | 'Processando';
  items: any; // Armazena a lista de produtos (JSON)
  branchId: string;
  shippingAddress?: string;
  paymentMethod?: string;
  tracking_code?: string;
}

export default function MerchantOrders() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [withdrawalInput, setWithdrawalInput] = useState('');
  const [error, setError] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [extras, setExtras] = useState<Record<string, OrderWithCode>>({});

  useEffect(() => {
    if (profile) {
      if (profile.role === 'owner' || profile.branch_id) {
        loadData(profile.branch_id);
      } else {
        setLoading(false);
      }
    }
  }, [profile]);

  async function loadData(branchId?: string) {
    try {
      setLoading(true);
      const mId = await businessRules.getMerchantId(profile!.id);
      if (!mId) return;

      const allOrders = await businessRules.getMerchantOrders(mId, branchId);
      setOrders(allOrders);
      
      const extrasMap: Record<string, OrderWithCode> = {};
      // Carregamos os extras apenas se necessário ou em lote
      const extraPromises = allOrders.map(async (o) => {
        try {
          let extra = await businessRules.getOrderExtra(o.id);
          if (!extra) {
            // Tenta salvar, mas ignora se falhar por RLS
            await businessRules.saveOrderExtra(o.id, { status: o.status as any }).catch(() => null);
            extra = await businessRules.getOrderExtra(o.id);
          }
          return { id: o.id, extra };
        } catch (e) {
          return { id: o.id, extra: null };
        }
      });

      const results = await Promise.all(extraPromises);
      results.forEach(res => {
        if (res.extra) extrasMap[res.id] = res.extra;
      });

      setExtras(extrasMap);
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const extra = extras[selectedOrder.id];
    if (extra && extra.withdrawalCode === withdrawalInput.toUpperCase()) {
      try {
        setLoading(true);
        // Sucesso no código
        await businessRules.updateOrderStatus(selectedOrder.id, 'Concluído');
        
        // Atualiza estado local
        const updatedOrders = orders.map(o => 
          o.id === selectedOrder.id ? { ...o, status: 'Concluído' as const } : o
        );
        setOrders(updatedOrders);
        
        setExtras(prev => ({
          ...prev,
          [selectedOrder.id]: { ...prev[selectedOrder.id], status: 'Concluído' }
        }));
        
        toast.success('Retirada confirmada com sucesso!');
        setShowWithdrawalModal(false);
        setWithdrawalInput('');
        setError('');
      } catch (err) {
        console.error('Error confirming withdrawal:', err);
        toast.error('Erro ao processar retirada');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Código de retirada inválido. Verifique com o cliente.');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      await businessRules.updateOrderStatus(orderId, newStatus);
      
      const updatedOrders = orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);
      
      toast.success(`Pedido atualizado para ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando Pagamento': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Pago, Aguardando Retirada': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelado': return 'bg-red-50 text-red-600 border-red-100';
      case 'Processando': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pendente': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aguardando Pagamento': return <Clock size={12} />;
      case 'Pago, Aguardando Retirada': return <Key size={12} />;
      case 'Concluído': return <CheckCircle size={12} />;
      case 'Cancelado': return <XCircle size={12} />;
      case 'Processando': return <Clock size={12} />;
      case 'Pendente': return <Clock size={12} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Gestão de Pedidos" subtitle="Carregando pedidos...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-primary-blue animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

  if (profile?.role === 'manager' && !profile?.branch_id) {
    return (
      <MerchantLayout title="Gestão de Pedidos" subtitle="Acesso Restrito">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="size-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mb-6">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-black text-midnight italic uppercase tracking-tighter mb-2">Nenhuma Loja Vinculada</h2>
          <p className="text-slate-500 max-w-md font-medium">Seu perfil ainda não possui uma filial associada. Entre em contato com a administração para gerenciar pedidos.</p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Gestão de Pedidos" subtitle="Acompanhe e gerencie as vendas da sua loja">
      <div className="p-4 sm:p-6 lg:p-10 space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por ID ou Cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all text-midnight"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer text-midnight"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Aguardando Pagamento">Aguardando Pagamento</option>
              <option value="Pago, Aguardando Retirada">Aguardando Retirada</option>
              <option value="Concluído">Concluídos</option>
              <option value="Cancelado">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">ID</th>
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Data</th>
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Valor</th>
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
                    <th className="px-1 py-5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredOrders.length > 0 ? filteredOrders.map((o) => {
                      const extra = extras[o.id];
                      return (
                        <motion.tr 
                          key={o.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-1 py-5 font-black text-xs text-midnight">
                            {o.id.length > 12 ? `${o.id.substring(0, 8)}...` : o.id}
                          </td>
                          <td className="px-1 py-5">
                            <div className="flex items-center gap-1.5">
                              <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm shrink-0">
                                {o.customerInitial || o.customerName.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-midnight tracking-tight truncate max-w-[100px]">{o.customerName}</span>
                            </div>
                          </td>
                          <td className="px-1 py-5 text-[10px] font-bold text-slate-400 whitespace-nowrap">{o.date.split(',')[0]}</td>
                          <td className="px-1 py-5 text-center">
                            <span className="font-black text-midnight tracking-tighter text-xs whitespace-nowrap">R$ {o.amount.toFixed(2).replace('.', ',')}</span>
                          </td>
                          <td className="px-1 py-5 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${getStatusColor(o.status)}`}>
                              {getStatusIcon(o.status)}
                              {o.status}
                            </span>
                          </td>
                          <td className="px-1 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] whitespace-nowrap">
                              {o.status !== 'Concluído' && o.status !== 'Cancelado' && (
                                <div className="flex items-center gap-1.5 mr-1.5">
                                  <button 
                                    onClick={() => {
                                      if(confirm('Deseja realmente CANCELAR este pedido?')) {
                                        handleUpdateStatus(o.id, 'Cancelado');
                                      }
                                    }}
                                    className="size-9 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-100"
                                    title="Cancelar Pedido"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if(confirm('Confirmar recebimento do pagamento? Isso também liberará os cashbacks na rede.')) {
                                        handleUpdateStatus(o.id, 'Pago, Aguardando Retirada');
                                      }
                                    }}
                                    className="size-9 bg-primary-blue/10 text-primary-blue hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center transition-all border border-primary-blue/20"
                                    title="Marcar como Pago"
                                  >
                                    <DollarSign size={14} />
                                  </button>
                                  
                                  <button 
                                    onClick={() => {
                                      setSelectedOrder(o);
                                      setShowWithdrawalModal(true);
                                    }}
                                    className="size-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                                    title="Confirmar Retirada"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowDetailsModal(true);
                                }}
                                className="size-9 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-50">
                            <ShoppingBag size={48} className="text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase italic">Nenhum pedido encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
         </div>
      </div>

      {/* MODAL DE RETIRADA */}
      <AnimatePresence>
        {showWithdrawalModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-[12px]">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowWithdrawalModal(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Key size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-midnight uppercase italic tracking-tighter">Confirmar Retirada</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pedido {selectedOrder.id.substring(0,8)}... - {selectedOrder.customerName}</p>
                </div>
              </div>

              <form onSubmit={handleConfirmWithdrawal} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Retirada (pelo cliente)</label>
                  <input 
                    required 
                    autoFocus
                    placeholder="Ex: AB12XY" 
                    value={withdrawalInput} 
                    onChange={e => {
                      setWithdrawalInput(e.target.value.toUpperCase());
                      setError('');
                    }} 
                    disabled={loading}
                    className={`w-full bg-slate-50 border ${error ? 'border-red-500 animate-pulse' : 'border-slate-100'} px-6 py-4 rounded-2xl font-mono text-xl font-black text-center text-midnight tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all`} 
                  />
                  {error && <p className="text-red-500 text-[9px] font-black uppercase text-center mt-2">{error}</p>}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-500 text-[10px]">
                  O cliente deve apresentar o código disponível no aplicativo para confirmar a retirada física do produto.
                </div>

                <div className="flex gap-4">
                   <button type="button" disabled={loading} onClick={() => setShowWithdrawalModal(false)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
                   <button type="submit" disabled={loading} className="flex-1 bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-blue/20 flex items-center justify-center gap-2">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : 'Validar Código'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}


      </AnimatePresence>

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
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="size-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                >
                  <ActivityIcon size={24} className="rotate-45" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 overflow-y-auto">
                
                {/* Cliente */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-midnight text-white flex items-center justify-center text-xl font-black shadow-lg">
                        {selectedOrder.customerInitial}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Comprador</p>
                        <h4 className="text-lg font-black text-midnight leading-none">{selectedOrder.customerName}</h4>
                      </div>
                   </div>
                </div>

                {/* Itens do Pedido */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Produtos no Carrinho</h5>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary-blue">
                               <Package size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-midnight">{item.product_name || item.name || 'Produto'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qtd: {item.quantity || 1}</p>
                            </div>
                         </div>
                         <p className="text-sm font-black text-midnight italic tracking-tighter">R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}</p>
                      </div>
                    )) : (
                      <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary-blue">
                               <ShoppingBag size={20} />
                            </div>
                            <p className="text-sm font-black text-midnight">Carrinho de Compras</p>
                         </div>
                         <p className="text-sm font-black text-midnight italic tracking-tighter">R$ {selectedOrder.amount.toFixed(2).replace('.', ',')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagamento */}
                <div className="grid grid-cols-1 gap-4">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                         <CreditCard size={16} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</span>
                      </div>
                      <p className="text-xs font-bold text-midnight uppercase tracking-widest">
                        {selectedOrder.paymentMethod || 'Não informado'}
                      </p>
                   </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="border-t border-dashed border-slate-200 pt-6 space-y-3">
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>R$ {selectedOrder.amount.toFixed(2).replace('.', ',')}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Entrega / Frete</span>
                      <span className="text-emerald-500 font-black">Grátis</span>
                   </div>
                   <div className="flex justify-between items-center bg-midnight text-white p-6 rounded-2xl mt-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total do Pedido</span>
                      <span className="text-2xl font-black italic tracking-tighter">R$ {selectedOrder.amount.toFixed(2).replace('.', ',')}</span>
                   </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Fechar
                </button>
                {selectedOrder.status !== 'Concluído' && selectedOrder.status !== 'Cancelado' && (
                  <>
                    <button 
                      onClick={() => {
                        if(confirm('Deseja realmente CANCELAR este pedido?')) {
                          handleUpdateStatus(selectedOrder.id, 'Cancelado');
                          setShowDetailsModal(false);
                        }
                      }}
                      className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Cancelar Pedido
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Confirmar recebimento do pagamento? Isso também liberará os cashbacks na rede.')) {
                          handleUpdateStatus(selectedOrder.id, 'Pago, Aguardando Retirada');
                          setShowDetailsModal(false);
                        }
                      }}
                      className="flex-1 px-8 py-4 bg-primary-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-blue/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign size={16} /> Marcar como Pago
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
