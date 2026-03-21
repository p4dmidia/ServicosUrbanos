import React, { useState } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Tag, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

interface Merchant {
  id: string;
  name: string;
  category: string;
  products: number;
  sales: string;
  status: 'active' | 'under_review' | 'inactive';
  rating: number;
  featured: boolean;
}

export default function AdminMarketplace() {
  const [merchants, setMerchants] = useState<Merchant[]>([
    { id: '1', name: 'Eletro Mundo', category: 'Eletrônicos', products: 124, sales: 'R$ 45.200', status: 'active', rating: 4.8, featured: true },
    { id: '2', name: 'Moda Urbana', category: 'Vestuário', products: 86, sales: 'R$ 12.400', status: 'active', rating: 4.5, featured: false },
    { id: '3', name: 'Pet Shop Amigo', category: 'Pets', products: 45, sales: 'R$ 3.800', status: 'active', rating: 4.9, featured: true },
    { id: '4', name: 'Tech Store', category: 'Informática', products: 210, sales: 'R$ 89.000', status: 'under_review', rating: 0, featured: false },
    { id: '5', name: 'Casa & Conforto', category: 'Decoração', products: 67, sales: 'R$ 8.900', status: 'inactive', rating: 3.2, featured: false },
  ]);

  const stats = [
    { label: 'GMV Mensal', value: 'R$ 1,2M', trend: '+12%', isPositive: true, icon: TrendingUp, color: 'text-indigo-500' },
    { label: 'Lojistas Ativos', value: '1.240', trend: '+5%', isPositive: true, icon: Store, color: 'text-emerald-500' },
    { label: 'Produtos Ativos', value: '15.670', trend: '+8%', isPositive: true, icon: Package, color: 'text-purple-500' },
    { label: 'Ticket Médio', value: 'R$ 245', trend: '-2%', isPositive: false, icon: ShoppingBag, color: 'text-amber-500' },
  ];

  return (
    <AdminLayout title="Gestão Marketplace" subtitle="Controle Geral da UrbaShop e Lojistas">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={100} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Global Configuration Banner */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-[2.5rem] border border-white/5 p-8 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <Settings size={14} /> Configuração Global
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">Parâmetros do Marketplace</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                A comissão padrão atual da UrbaShop é de <strong>12%</strong>. Você pode ajustar este valor global ou definir taxas específicas por categoria de produto.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                Categorias
              </button>
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                Ajustar Taxas
              </button>
            </div>
          </div>
        </div>

        {/* Merchants Table */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Lojistas Registrados</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestão de parceiros comerciais</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pesquisar lojista..." 
                  className="bg-white/5 border border-white/5 py-3 pl-10 pr-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 w-full sm:w-64"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all">
                <Filter size={16} /> Filtros
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Parceiro</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Produtos</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendas</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Avaliação</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="py-6 px-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black relative">
                          <Store size={24} />
                          {merchant.featured && (
                            <div className="absolute -top-1 -right-1 size-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#0a0e17]">
                              <Star size={10} className="text-[#0a0e17] fill-current" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-indigo-400 transition-all">{merchant.name}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID: UX-{merchant.id}092</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Tag size={12} /> {merchant.category}
                      </span>
                    </td>
                    <td className="py-6 px-8 font-black text-white text-sm">{merchant.products}</td>
                    <td className="py-6 px-8 font-black text-white text-sm">{merchant.sales}</td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-1">
                        <Star size={14} className={merchant.rating > 0 ? 'text-amber-500 fill-current' : 'text-slate-700'} />
                        <span className="text-xs font-black text-white">{merchant.rating || '--'}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <div className={`size-1.5 rounded-full ${
                          merchant.status === 'active' ? 'bg-emerald-500 animate-pulse' : 
                          merchant.status === 'under_review' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          merchant.status === 'active' ? 'text-emerald-500' : 
                          merchant.status === 'under_review' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {merchant.status === 'active' ? 'Ativo' : merchant.status === 'under_review' ? 'Em Análise' : 'Suspenso'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {merchant.status === 'under_review' && (
                          <button className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all" title="Aprovar Lojista">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando 5 lojistas de alta performance</p>
            <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all">
              Ver todos os lojistas
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
