import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Loader2,
  Store
} from 'lucide-react';
import { motion } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import toast from 'react-hot-toast';

const ICON_MAP = {
  'TrendingUp': TrendingUp,
  'ShoppingBag': ShoppingBag,
  'Package': Package,
  'DollarSign': DollarSign,
};

export default function MerchantDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [performance, setPerformance] = useState<{ labels: string[], values: number[] }>({ labels: [], values: [] });

  useEffect(() => {
    if (profile) {
      if (profile.role === 'owner' || profile.branch_id) {
        fetchDashboardData(profile.branch_id);
      } else {
        setLoading(false);
      }
    }
  }, [profile]);

  const fetchDashboardData = async (branchId?: string) => {
    try {
      setLoading(true);
      const mId = await businessRules.getMerchantId(profile!.id);
      
      const [statsData, ordersData, productsData, perfData] = await Promise.all([
        businessRules.getMerchantDashboardStats(mId, branchId),
        businessRules.getMerchantRecentOrders(mId, branchId),
        businessRules.getMerchantTopProducts(mId, branchId),
        businessRules.getMerchantSalesPerformance(mId, branchId)
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);
      setPerformance(perfData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Dashboard" subtitle="Carregando dados...">
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 size={48} className="text-midnight animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

  // Somente gerentes são bloqueados se não tiverem filial. 
  // O dono sempre acessa para ver a visão global ou criar lojas.
  if (profile?.role === 'manager' && !profile?.branch_id) {
    return (
      <MerchantLayout title="Dashboard" subtitle="Visão Geral">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-primary-blue/10 rounded-full flex items-center justify-center mb-6">
            <Store className="text-primary-blue" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma Loja Vinculada</h2>
          <p className="text-slate-500 max-w-md">
            Seu perfil ainda não possui uma filial associada. Entre em contato com a administração para ativar seu acesso como lojista.
          </p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${profile?.full_name || 'Lojista'}`}>
      <div className="p-8 lg:p-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon as keyof typeof ICON_MAP] || TrendingUp;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-midnight group-hover:bg-midnight group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-midnight tracking-tighter">{stat.value}</h3>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Sales Chart Placeholder - Real Logic can be added with a library like Chart.js or Recharts */}
          <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Desempenho de Vendas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Últimos 30 dias de performance</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                {['Dia', 'Semana', 'Mês'].map(t => (
                  <button key={t} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t === 'Mês' ? 'bg-white text-midnight shadow-sm' : 'text-slate-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-end justify-end border-t border-dashed border-slate-100 relative">
              {/* Visual Representação do Gráfico */}
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 gap-2">
                {performance.values.length > 0 ? (
                  performance.values.slice(-15).map((val, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((val / Math.max(...performance.values)) * 100, 5)}%` }}
                      className="flex-1 bg-midnight rounded-t-lg min-w-[10px]"
                      title={`R$ ${val.toFixed(2)}`}
                    />
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-slate-300 font-bold italic">Sem dados de vendas nos últimos 30 dias</p>
                  </div>
                )}
              </div>
              <div className="w-full flex justify-between pt-4 mt-auto">
                {performance.labels.slice(-7).map((label, i) => (
                  <span key={i} className="text-[9px] font-black text-slate-300 uppercase">{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col">
            <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-8">Mais Vendidos</h3>
            <div className="space-y-6">
              {topProducts.length > 0 ? topProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-sm text-midnight`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-midnight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.sales} und. vendidas</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-midnight tracking-tighter">{item.revenue}</p>
                </div>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl">
                   <p className="text-xs font-bold text-slate-400 italic">Nenhum produto vendido ainda</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => window.location.href = '/lojista/produtos'}
              className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-midnight hover:text-midnight transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Adicionar Novo Produto
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Pedidos Recentes</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acompanhe o status das últimas transações</p>
            </div>
            <button 
              onClick={() => window.location.href = '/lojista/pedidos'}
              className="bg-slate-50 hover:bg-slate-100 text-midnight px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              Ver todos os pedidos <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6 font-black text-sm text-midnight">{order.id}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {order.customer.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-midnight">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-400">{order.date}</td>
                    <td className="px-10 py-6 text-sm font-black text-midnight tracking-tighter">{order.amount}</td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        order.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        order.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                        order.color === 'red' ? 'bg-red-50 text-red-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-bold italic">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
