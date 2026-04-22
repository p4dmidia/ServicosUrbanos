import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Loader2,
  Activity,
  TrendingUp,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleViewOrders = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      setShowOrdersModal(true);
      setLoadingOrders(true);
      setActiveMenu(null);
      
      const mId = await businessRules.getMerchantId(profile!.id);
      if (!mId) return;

      // Buscar pedidos reais do cliente
      const orders = await businessRules.getMerchantRecentOrders(mId, profile?.branch_id);
      // Filtrar apenas os deste cliente (no front por enquanto, ideal seria no back)
      const filtered = orders.filter((o: any) => o.customer === customer.name);
      setCustomerOrders(filtered);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Não foi possível carregar os pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        if (profile?.role === 'manager' && !profile?.branch_id) {
          setLoading(false);
          return;
        }
        
        const mId = await businessRules.getMerchantId(profile!.id);
        if (!mId) return;

        const data = await businessRules.getMerchantCustomers(mId, profile?.branch_id);
        setCustomers(data);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar base de clientes');
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadCustomers();
    }
  }, [profile]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!profile || loading) {
    return (
      <MerchantLayout title="Meus Clientes" subtitle="Carregando base de dados...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-primary-blue animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

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
        {profile?.role === 'manager' && !profile?.branch_id ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Users size={42} />
            </div>
            <h3 className="text-xl font-black text-midnight mb-2 uppercase tracking-tighter">Nenhuma Loja Vinculada</h3>
            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
              Sua conta ainda não possui uma filial configurada para visualizar a base de clientes.
            </p>
          </div>
        ) : (
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
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => (
                        <motion.tr 
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-midnight text-white flex items-center justify-center text-lg font-black shadow-lg shadow-midnight/10">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-black text-midnight block leading-none mb-1">{c.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                  <MapPin size={10} /> {c.location || 'Localização Oculta'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Mail size={12} className="text-slate-400" />
                                <span className="text-xs font-medium">{c.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500">
                                <Phone size={12} className="text-slate-400" />
                                <span className="text-xs font-medium">{c.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-midnight leading-none">{c.orders} pedidos</p>
                              <div className="flex items-center gap-1 bg-slate-100 w-fit px-2 py-0.5 rounded-full uppercase">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 tracking-widest">Último: {c.lastOrder}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-emerald-600 tracking-tighter">R$ {c.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                              c.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right relative">
                            <div className="flex items-center justify-end gap-2 text-slate-400">
                              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-500 px-2 py-1 rounded-lg text-[10px] font-black mr-2">
                                {c.rating} <Star size={10} className="fill-amber-500" />
                              </div>
                              <button 
                                onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                                className="size-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:bg-white group-hover:shadow-md"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {activeMenu === c.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setActiveMenu(null)}
                                    />
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      className="absolute right-8 top-16 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20 text-left overflow-hidden"
                                    >
                                      <button 
                                        onClick={() => handleViewOrders(c)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-midnight uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                      >
                                        <Clock size={16} className="text-primary-blue" />
                                        Ver Pedidos
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setActiveMenu(null);
                                          toast.success(`Abrindo perfil detalhado de ${c.name}`);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-midnight uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                      >
                                        <Users size={16} className="text-primary-blue" />
                                        Ver Detalhes
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setActiveMenu(null);
                                          toast.success(`Cupom de 10% enviado para ${c.name}!`);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-midnight uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                      >
                                        <TrendingUp size={16} className="text-amber-500" />
                                        Enviar Cupom
                                      </button>
                                      <div className="h-px bg-slate-100 my-2" />
                                      <a 
                                        href={`mailto:${c.email}`}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-midnight uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                      >
                                        <Mail size={16} className="text-primary-blue" />
                                        Enviar E-mail
                                      </a>
                                      <a 
                                        href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-midnight uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                      >
                                        <Phone size={16} className="text-emerald-500" />
                                        WhatsApp
                                      </a>
                                      <div className="h-px bg-slate-100 my-2" />
                                      <button 
                                        onClick={() => {
                                          setActiveMenu(null);
                                          const action = c.status === 'Ativo' ? 'Inativar' : 'Ativar';
                                          toast.success(`Cliente ${c.name} ${action}do com sucesso!`);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all ${c.status === 'Ativo' ? 'text-red-500' : 'text-emerald-500'}`}
                                      >
                                        <Activity size={16} />
                                        {c.status === 'Ativo' ? 'Inativar Cliente' : 'Ativar Cliente'}
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-24 text-center">
                          <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                            <Users size={32} />
                          </div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum cliente encontrado</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

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

      {/* Orders Modal */}
      <AnimatePresence>
        {showOrdersModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrdersModal(false)}
              className="absolute inset-0 bg-midnight/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-midnight italic uppercase tracking-tighter leading-none mb-2">Pedidos de {selectedCustomer.name}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Histórico completo de compras</p>
                </div>
                <button 
                  onClick={() => setShowOrdersModal(false)}
                  className="size-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                >
                  <Activity size={24} className="rotate-45" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {loadingOrders ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="text-primary-blue animate-spin opacity-20" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Buscando pedidos...</p>
                  </div>
                ) : customerOrders.length > 0 ? (
                  <div className="space-y-4">
                    {customerOrders.map((order, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-midnight font-black shadow-sm">
                            {order.id}
                          </div>
                          <div>
                            <span className="text-xs font-black text-midnight block mb-1">{order.date}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-${order.color}-50 text-${order.color}-600 border border-${order.color}-100`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-midnight tracking-tighter">{order.amount}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Valor Total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                      <Clock size={40} />
                    </div>
                    <h3 className="text-xl font-black text-midnight mb-2 uppercase tracking-tighter">Nenhum pedido</h3>
                    <p className="text-slate-400 text-sm font-medium">Este cliente ainda não possui vendas registradas.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowOrdersModal(false)}
                  className="px-10 py-4 bg-midnight text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-midnight/20 hover:scale-105 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
