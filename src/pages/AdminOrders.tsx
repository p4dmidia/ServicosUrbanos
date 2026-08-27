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
  Calendar
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
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago, Aguardando Retirada':
      case 'Concluído':
        return <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-emerald-500" /> Pago</span>;
      case 'Cancelado':
        return <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-red-500" /> Cancelado</span>;
      case 'Aguardando Pagamento':
      case 'Pendente':
      default:
        return <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-amber-500 animate-pulse" /> Pendente</span>;
    }
  };

  return (
    <AdminLayout title="Pedidos de Planos" subtitle="Monitore e aprove as faturas de licenciamento MMN do ecossistema">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Filters & Actions */}
        <div className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Buscar por cliente ou ID do pedido..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 py-3.5 pl-12 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-56 bg-white/5 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="Todos" className="bg-[#0a0e17]">Status: Todos</option>
                <option value="Aguardando Pagamento" className="bg-[#0a0e17]">Status: Pendentes</option>
                <option value="Pago, Aguardando Retirada" className="bg-[#0a0e17]">Status: Pagos</option>
                <option value="Cancelado" className="bg-[#0a0e17]">Status: Cancelados</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pedido ID</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Forma Pagamento</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                  <th className="text-right py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-8 text-indigo-500 animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando faturas...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-4 font-bold text-xs text-indigo-400 group-hover:text-indigo-300">
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
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                            title="Ver Detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {(order.status === 'Aguardando Pagamento' || order.status === 'Pendente') && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'Pago, Aguardando Retirada')}
                                disabled={actionLoading === order.id}
                                className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"
                                title="Aprovar Pagamento"
                              >
                                {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'Cancelado')}
                                disabled={actionLoading === order.id}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                                title="Cancelar Pedido"
                              >
                                {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">Nenhuma fatura encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detalhes */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-[#000]/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl overflow-hidden text-slate-300"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                    Pedido #{selectedOrder.id.substring(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fatura de Assinatura MMN</p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="size-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Status Indicator */}
                <div className="p-5 bg-white/5 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Atual</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dados do Cliente</span>
                  <div className="p-5 bg-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-bold">Nome:</span>
                      <span className="text-xs text-white font-black">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-bold">Endereço de Ativação:</span>
                      <span className="text-xs text-indigo-400 font-black">{selectedOrder.shipping_address || 'Licenciamento MMN Digital'}</span>
                    </div>
                  </div>
                </div>

                {/* Itens do Carrinho */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Plano Adquirido</span>
                  <div className="p-5 bg-white/5 rounded-2xl divide-y divide-white/5">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.image || '📅'}</span>
                          <div>
                            <span className="text-xs text-white font-black block">{item.name}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Identificador: {item.plan_type}</span>
                          </div>
                        </div>
                        <span className="text-xs text-white font-mono font-black">
                          R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="p-5 bg-white/5 rounded-2xl space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Forma de Pagamento:</span>
                    <span className="text-white uppercase font-sans font-bold">{selectedOrder.payment_method || 'Pix'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Data do Pedido:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="border-t border-dashed border-white/10 pt-2 flex justify-between font-black text-sm text-white">
                    <span>Total Pago:</span>
                    <span className="text-indigo-400">R$ {selectedOrder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Ações Pendentes */}
                {(selectedOrder.status === 'Aguardando Pagamento' || selectedOrder.status === 'Pendente') && (
                  <div className="flex gap-4 pt-6">
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelado')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Recusar / Cancelar
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'Pago, Aguardando Retirada')}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
                    >
                      Aprovar e Ativar Plano
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
