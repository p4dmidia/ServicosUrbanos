import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Shield, 
  UserPlus, 
  Ban, 
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'merchant' | 'customer';
  status: 'active' | 'blocked' | 'pending';
  joinedAt: string;
  location: string;
  avatar?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Ana Silva', email: 'ana.silva@email.com', role: 'customer', status: 'active', joinedAt: '2024-03-15', location: 'São Paulo, SP' },
    { id: '2', name: 'Marketplace Master', email: 'contato@urbashop.com', role: 'merchant', status: 'active', joinedAt: '2024-02-10', location: 'Rio de Janeiro, RJ' },
    { id: '3', name: 'Carlos Admin', email: 'carlos@servicosurbanos.com', role: 'admin', status: 'active', joinedAt: '2023-12-01', location: 'Curitiba, PR' },
    { id: '4', name: 'Marcos Oliveira', email: 'marcos.o@email.com', role: 'customer', status: 'blocked', joinedAt: '2024-03-01', location: 'Belo Horizonte, MG' },
    { id: '5', name: 'Juliana Costa', email: 'juliana.c@loja.com', role: 'merchant', status: 'pending', joinedAt: '2024-03-19', location: 'Porto Alegre, RS' },
    { id: '6', name: 'Roberto Santos', email: 'roberto.s@email.com', role: 'customer', status: 'active', joinedAt: '2024-03-18', location: 'Salvador, BA' },
  ]);

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin': return <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">Admin</span>;
      case 'merchant': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Lojista</span>;
      default: return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Cliente</span>;
    }
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativo</span>;
      case 'blocked': return <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-red-500" /> Bloqueado</span>;
      default: return <span className="flex items-center gap-1.5 text-orange-500 text-[10px] font-black uppercase tracking-widest"><div className="size-1.5 rounded-full bg-orange-500" /> Pendente</span>;
    }
  };

  return (
    <AdminLayout title="Gestão de Usuários" subtitle="Administração de Contas do Ecossistema">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Usuários', value: '45.672', icon: Users, color: 'text-indigo-500' },
            { label: 'Lojistas Ativos', value: '1.234', icon: Shield, color: 'text-emerald-500' },
            { label: 'Novos Hoje', value: '+128', icon: UserPlus, color: 'text-purple-500' },
            { label: 'Contas Bloqueadas', value: '42', icon: Ban, color: 'text-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0a0e17] p-6 rounded-3xl border border-white/5 flex items-center gap-5 shadow-xl">
              <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-xl font-black text-white">{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Pesquisar por nome, e-mail ou CPF..." 
                className="w-full bg-white/5 border border-white/5 py-3.5 pl-12 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                <Filter size={16} />
                Filtrar por Status
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Desde</th>
                  <th className="text-right py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-indigo-400 transition-colors">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail size={12} />
                            <span className="text-[10px] font-bold">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                        <MapPin size={12} className="text-slate-600" />
                        {user.location}
                      </div>
                    </td>
                    <td className="py-5 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} className="text-slate-600" />
                        {user.joinedAt}
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all">
                          <CheckCircle size={18} />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-500 transition-all">
                          <Ban size={18} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Mostrando 6 de 45.672 resultados</p>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white/5 rounded-xl text-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(n => (
                  <button key={n} className={`size-8 rounded-xl font-black text-[10px] flex items-center justify-center transition-all ${n === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                    {String(n).padStart(2, '0')}
                  </button>
                ))}
                <span className="text-slate-700 px-2 italic">...</span>
              </div>
              <button className="p-2 bg-white/5 rounded-xl text-slate-600 hover:text-white">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
