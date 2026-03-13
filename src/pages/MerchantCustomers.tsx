import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  spent: number;
  lastOrder: string;
  status: 'Ativo' | 'Inativo';
  rating: number;
}

export default function MerchantCustomers() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [customers] = useState<Customer[]>([
    { id: 'C-1029', name: 'João Silva', email: 'joao.silva@email.com', phone: '(11) 98765-4321', location: 'São Paulo, SP', orders: 12, spent: 2450.00, lastOrder: 'Hoje', status: 'Ativo', rating: 5 },
    { id: 'C-1028', name: 'Maria Santos', email: 'maria.santos@email.com', phone: '(21) 99876-5432', location: 'Rio de Janeiro, RJ', orders: 5, spent: 890.50, lastOrder: '2 dias atrás', status: 'Ativo', rating: 4.5 },
    { id: 'C-1027', name: 'Pedro Costa', email: 'pedro.costa@email.com', phone: '(31) 97654-3210', location: 'Belo Horizonte, MG', orders: 1, spent: 120.00, lastOrder: '1 mês atrás', status: 'Inativo', rating: 3 },
    { id: 'C-1026', name: 'Ana Oliveira', email: 'ana.oliveira@email.com', phone: '(41) 98521-4789', location: 'Curitiba, PR', orders: 28, spent: 5600.00, lastOrder: 'Ontem', status: 'Ativo', rating: 5 },
    { id: 'C-1025', name: 'Carlos Mendes', email: 'carlos.mendes@email.com', phone: '(71) 99632-1458', location: 'Salvador, BA', orders: 3, spent: 450.00, lastOrder: '1 semana atrás', status: 'Ativo', rating: 4 },
  ]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <MerchantLayout title="Meus Clientes" subtitle="Gerencie e conheça sua base de compradores">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por Nome ou E-mail..." 
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
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de Clientes</p>
              <p className="text-xl font-black text-midnight tracking-tighter leading-none">{customers.length}</p>
            </div>
            <div className="size-10 bg-primary-blue/10 rounded-xl flex items-center justify-center text-primary-blue">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Gasto</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {filteredCustomers.map((c) => (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 shadow-sm">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-black text-midnight block">{c.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin size={10} /> {c.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 space-y-1">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" /> {c.email}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" /> {c.phone}
                        </span>
                      </td>
                      <td className="px-8 py-6 space-y-1">
                        <span className="text-sm font-black text-midnight block">{c.orders} pedidos</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 w-fit px-2 py-0.5 rounded-full">
                          <Clock size={10} /> Último: {c.lastOrder}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black text-emerald-500 tracking-tighter text-sm">R$ {c.spent.toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${c.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <div className="flex items-center gap-0.5 bg-amber-50 text-amber-500 px-2 py-1 rounded-lg text-[10px] font-black mr-2">
                            {c.rating} <Star size={10} className="fill-amber-500" />
                          </div>
                          <button className="size-9 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all shadow-sm">
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

          {filteredCustomers.length === 0 && (
            <div className="p-24 text-center">
              <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-black text-midnight mb-2 uppercase tracking-tighter">Nenhum cliente encontrado</h3>
              <p className="text-slate-400 text-sm font-medium">Tente ajustar seus filtros de busca ou status.</p>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exibindo {filteredCustomers.length} de {customers.length} clientes</p>
            <div className="flex items-center gap-3">
              <button disabled className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed transition-all">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                <button className="size-10 rounded-xl bg-primary-blue text-white font-black text-xs shadow-lg shadow-primary-blue/20">1</button>
              </div>
              <button disabled className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed transition-all shadow-sm">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
