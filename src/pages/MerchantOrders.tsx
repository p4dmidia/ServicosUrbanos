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
  Truck,
  Key,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, MerchantUser, OrderWithCode } from '../lib/businessRules';

interface Order {
  id: string;
  customerName: string;
  customerInitial: string;
  date: string;
  amount: number;
  status: 'Pendente' | 'Processando' | 'Enviado' | 'Concluído' | 'Cancelado';
  items: number;
  branchId: string;
}

export default function MerchantOrders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [currentUser, setCurrentUser] = useState<MerchantUser | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [withdrawalInput, setWithdrawalInput] = useState('');
  const [error, setError] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Pedidos vindos do businessRules
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const user = businessRules.getCurrentUser();
    setCurrentUser(user);
    
    // Buscar pedidos centralizados
    const allOrders = businessRules.getOrders();
    setOrders(allOrders);
    
    // Garantir que todos os pedidos tenham um código de retirada no localStorage
    allOrders.forEach(o => {
      if (!businessRules.getOrderExtra(o.id)) {
        businessRules.saveOrderExtra(o.id, { status: o.status as any });
      }
    });
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    const matchesBranch = currentUser?.role === 'owner' || o.branchId === currentUser?.branchId;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleConfirmWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const extra = businessRules.getOrderExtra(selectedOrder.id);
    if (extra && extra.withdrawalCode === withdrawalInput.toUpperCase()) {
      // Sucesso
      const updatedOrders = orders.map(o => 
        o.id === selectedOrder.id ? { ...o, status: 'Concluído' as const } : o
      );
      setOrders(updatedOrders);
      businessRules.saveOrderExtra(selectedOrder.id, { status: 'Concluído' });
      setShowWithdrawalModal(false);
      setWithdrawalInput('');
      setError('');
    } else {
      setError('Código de retirada inválido. Verifique com o cliente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processando': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Enviado': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelado': return 'bg-red-50 text-red-600 border-red-100';
      case 'Pendente': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processando': return <Clock size={12} />;
      case 'Enviado': return <Truck size={12} />;
      case 'Concluído': return <CheckCircle size={12} />;
      case 'Cancelado': return <XCircle size={12} />;
      case 'Pendente': return <Clock size={12} />;
      default: return null;
    }
  };

  return (
    <MerchantLayout title="Gestão de Pedidos" subtitle="Acompanhe e gerencie as vendas da sua loja">
      <div className="p-8 lg:p-12 space-y-8">
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
              <option value="Pendente">Pendentes</option>
              <option value="Processando">Em Processamento</option>
              <option value="Enviado">Enviados</option>
              <option value="Concluído">Concluídos</option>
              <option value="Cancelado">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cód. Retirada</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {filteredOrders.map((o) => {
                    const extra = businessRules.getOrderExtra(o.id);
                    return (
                      <motion.tr 
                        key={o.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6 font-black text-sm text-midnight">{o.id}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                              {o.customerInitial}
                            </div>
                            <span className="text-sm font-bold text-midnight tracking-tight">{o.customerName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{o.date}</td>
                        <td className="px-8 py-6">
                          <span className="font-black text-midnight tracking-tighter text-sm">R$ {o.amount.toFixed(2).replace('.', ',')}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="bg-slate-50 px-3 py-1.5 rounded-xl font-mono font-black text-xs text-primary-blue border border-slate-100">
                             {extra?.withdrawalCode || '---'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusColor(o.status)}`}>
                            {getStatusIcon(o.status)}
                            {o.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-[10px]">
                            {o.status !== 'Concluído' && o.status !== 'Cancelado' && (
                              <button 
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowWithdrawalModal(true);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                              >
                                <Check size={14} /> Retirada
                              </button>
                            )}
                            <button className="size-9 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm">
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
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
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-midnight uppercase italic tracking-tighter">Confirmar Retirada</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pedido {selectedOrder.id} - {selectedOrder.customerName}</p>
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
                    className={`w-full bg-slate-50 border ${error ? 'border-red-500 animate-pulse' : 'border-slate-100'} px-6 py-4 rounded-2xl font-mono text-xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all`} 
                  />
                  {error && <p className="text-red-500 text-[9px] font-black uppercase text-center mt-2">{error}</p>}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-500 text-[10px]">
                  O cliente deve apresentar o código disponível no aplicativo para confirmar a retirada física do produto.
                </div>

                <div className="flex gap-4">
                   <button type="button" onClick={() => setShowWithdrawalModal(false)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
                   <button type="submit" className="flex-1 bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-blue/20">Validar Código</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
