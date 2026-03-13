import React, { useState } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

export default function MerchantDashboard() {
  const stats = [
    { title: 'Vendas Totais', value: 'R$ 12.450,00', change: '+12.5%', isPositive: true, icon: TrendingUp },
    { title: 'Novos Pedidos', value: '28', change: '+5', isPositive: true, icon: ShoppingBag },
    { title: 'Produtos Ativos', value: '142', change: '-2', isPositive: false, icon: Package },
    { title: 'Cashback Distribuído', value: 'R$ 1.240,00', change: '+8.2%', isPositive: true, icon: DollarSign },
  ];

  const recentOrders = [
    { id: '#8492', customer: 'João Silva', date: 'Hoje, 14:20', amount: 'R$ 199,90', status: 'Processando', color: 'blue' },
    { id: '#8491', customer: 'Maria Santos', date: 'Hoje, 12:45', amount: 'R$ 349,00', status: 'Enviado', color: 'green' },
    { id: '#8490', customer: 'Pedro Costa', date: 'Ontem, 21:10', amount: 'R$ 89,90', status: 'Cancelado', color: 'red' },
    { id: '#8489', customer: 'Ana Oliveira', date: 'Ontem, 18:30', amount: 'R$ 1.250,00', status: 'Concluído', color: 'gray' },
  ];

  return (
    <MerchantLayout title="Dashboard" subtitle="Bem-vindo de volta, Urban Pro Store">
      <div className="p-8 lg:p-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-midnight group-hover:bg-midnight group-hover:text-white transition-colors">
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-midnight tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Sales Chart Placeholder */}
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
            <div className="flex-1 flex flex-col items-center justify-center border-t border-dashed border-slate-100">
              <div className="text-center">
                <PieChart size={64} className="text-slate-100 mx-auto mb-6" />
                <p className="text-slate-300 font-bold italic">Gráfico de desempenho será exibido aqui...</p>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col">
            <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-8">Mais Vendidos</h3>
            <div className="space-y-6">
              {[ 
                { name: 'Fone Pro Noise', sales: '842', revenue: 'R$ 168k', color: 'blue' },
                { name: 'Smartwatch G2', sales: '512', revenue: 'R$ 178k', color: 'emerald' },
                { name: 'Tênis Street', sales: '298', revenue: 'R$ 83k', color: 'orange' },
                { name: 'Mochila Tech', sales: '142', revenue: 'R$ 22k', color: 'purple' },
              ].map((item, i) => (
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
              ))}
            </div>
            <button className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-primary-blue hover:text-primary-blue transition-all flex items-center justify-center gap-2">
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
            <button className="bg-slate-50 hover:bg-slate-100 text-midnight px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
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
                {recentOrders.map((order, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
