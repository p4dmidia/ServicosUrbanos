import React, { useState } from 'react';
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
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

interface Order {
  id: string;
  customerName: string;
  customerInitial: string;
  date: string;
  amount: number;
  status: 'Pendente' | 'Processando' | 'Enviado' | 'Concluído' | 'Cancelado';
  items: number;
}

export default function MerchantOrders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [orders] = useState<Order[]>([
    { id: '#8492', customerName: 'João Silva', customerInitial: 'J', date: 'Hoje, 14:20', amount: 199.90, status: 'Processando', items: 2 },
    { id: '#8491', customerName: 'Maria Santos', customerInitial: 'M', date: 'Hoje, 12:45', amount: 349.00, status: 'Enviado', items: 1 },
    { id: '#8490', customerName: 'Pedro Costa', customerInitial: 'P', date: 'Ontem, 21:10', amount: 89.90, status: 'Cancelado', items: 3 },
    { id: '#8489', customerName: 'Ana Oliveira', customerInitial: 'A', date: 'Ontem, 18:30', amount: 1250.00, status: 'Concluído', items: 1 },
    { id: '#8488', customerName: 'Carlos Mendes', customerInitial: 'C', date: '12 Nov, 09:15', amount: 450.50, status: 'Pendente', items: 4 },
    { id: '#8487', customerName: 'Fernanda Lima', customerInitial: 'F', date: '11 Nov, 16:40', amount: 210.00, status: 'Concluído', items: 2 },
  ]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {filteredOrders.map((o) => (
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
                      <td className="px-8 py-6 text-xs font-bold text-slate-500">{o.items} un.</td>
                      <td className="px-8 py-6">
                        <span className="font-black text-midnight tracking-tighter text-sm">R$ {o.amount.toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusColor(o.status)}`}>
                          {getStatusIcon(o.status)}
                          {o.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="size-9 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm">
                            <Eye size={16} />
                          </button>
                          <button className="size-9 bg-slate-50 hover:bg-midnight hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-24 text-center">
              <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                <ShoppingBag size={40} />
              </div>
              <h3 className="text-xl font-black text-midnight mb-2 uppercase tracking-tighter">Nenhum pedido encontrado</h3>
              <p className="text-slate-400 text-sm font-medium">Tente ajustar seus filtros de busca ou status.</p>
              <button 
                onClick={() => {setSearch(''); setFilterStatus('Todos');}}
                className="mt-8 text-primary-blue font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exibindo {filteredOrders.length} de {orders.length} pedidos</p>
            <div className="flex items-center gap-3">
              <button disabled className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed transition-all">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                <button className="size-10 rounded-xl bg-primary-blue text-white font-black text-xs shadow-lg shadow-primary-blue/20">1</button>
                <button className="size-10 rounded-xl bg-white text-midnight font-bold text-xs hover:bg-slate-100 transition-all">2</button>
              </div>
              <button className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-midnight hover:bg-slate-100 transition-all shadow-sm">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
