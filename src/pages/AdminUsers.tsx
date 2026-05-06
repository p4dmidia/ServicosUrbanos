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
  Star,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'merchant' | 'customer' | 'affiliate';
  status: 'active' | 'blocked' | 'pending';
  joinedAt: string;
  location: string;
  avatar?: string;
  cpf?: string;
  whatsapp?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingDetails, setSavingDetails] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        businessRules.getAdminGlobalStats(),
        businessRules.getAdminUsers({ 
          page: currentPage, 
          search: searchTerm, 
          status: statusFilter 
        })
      ]);
      setGlobalStats(statsData);
      setUsers(usersData.users);
      setTotalUsers(usersData.total);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [currentPage, statusFilter]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) loadData();
      else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    setActionLoading(userId);
    try {
      await businessRules.updateUserStatus(userId, newStatus);
      toast.success(newStatus === 'active' ? 'Usuário desbloqueado!' : 'Usuário bloqueado!');
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar status do usuário.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingDetails(true);
    try {
      await businessRules.updateUserByAdmin(selectedUser.id, editForm);
      toast.success('Usuário atualizado com sucesso!');
      setIsEditing(false);
      loadData();
      setSelectedUser({
        ...selectedUser,
        name: editForm.name,
        email: editForm.email,
        cpf: editForm.cpf,
        whatsapp: editForm.whatsapp,
        address: editForm.address,
        number: editForm.number,
        neighborhood: editForm.neighborhood,
        city: editForm.city,
        state: editForm.state,
        zipCode: editForm.zipCode
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    
    const headers = ['Nome', 'Email', 'Cargo', 'Status', 'Desde', 'Localização', 'CPF', 'WhatsApp'];
    const rows = users.map(u => [
      u.name,
      u.email,
      u.role,
      u.status,
      u.joinedAt,
      u.location,
      u.cpf || '',
      u.whatsapp || ''
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usuarios_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            { label: 'Total Usuários', value: globalStats?.userCount?.toLocaleString('pt-BR') || '0', icon: Users, color: 'text-indigo-500' },
            { label: 'Lojistas Ativos', value: globalStats?.branchCount?.toLocaleString('pt-BR') || '0', icon: Shield, color: 'text-emerald-500' },
            { label: 'Crescimento Mês', value: (globalStats?.userTrend >= 0 ? '+' : '') + (globalStats?.userTrend?.toFixed(1) || '0') + '%', icon: UserPlus, color: 'text-purple-500' },
            { label: 'Contas Bloqueadas', value: globalStats?.blockedUserCount?.toLocaleString('pt-BR') || '0', icon: Ban, color: 'text-red-500' },
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
                className="flex-1 md:flex-none bg-white/5 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all" className="bg-[#0a0e17]">Filtro: Todos</option>
                <option value="active" className="bg-[#0a0e17]">Filtro: Ativos</option>
                <option value="blocked" className="bg-[#0a0e17]">Filtro: Bloqueados</option>
                <option value="pending" className="bg-[#0a0e17]">Filtro: Pendentes</option>
              </select>
              <button 
                onClick={handleExportCSV}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
              >
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-8 text-indigo-500 animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando usuários...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                            {user.name?.charAt(0) || '?'}
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
                          <button 
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-xl transition-all ${user.status === 'blocked' ? 'hover:bg-emerald-500/10 text-emerald-500' : 'hover:bg-red-500/10 text-red-500'}`}
                            title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                          >
                            {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : user.status === 'blocked' ? <CheckCircle size={18} /> : <Ban size={18} />}
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setEditForm({
                                name: user.name,
                                email: user.email,
                                cpf: user.cpf || '',
                                whatsapp: user.whatsapp || '',
                                address: user.address || '',
                                number: user.number || '',
                                neighborhood: user.neighborhood || '',
                                city: user.city || '',
                                state: user.state || '',
                                zipCode: user.zipCode || '',
                                password: ''
                              });
                              setIsEditing(false);
                              setShowDetails(true);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">Nenhum usuário encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Mostrando {users.length} de {totalUsers.toLocaleString()} resultados
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 bg-white/5 rounded-xl text-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalUsers / 10)) }, (_, i) => i + 1).map(n => (
                  <button 
                    key={n} 
                    onClick={() => setCurrentPage(n)}
                    className={`size-8 rounded-xl font-black text-[10px] flex items-center justify-center transition-all ${n === currentPage ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
                  >
                    {String(n).padStart(2, '0')}
                  </button>
                ))}
                {Math.ceil(totalUsers / 10) > 5 && <span className="text-slate-700 px-2 italic">...</span>}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalUsers / 10), prev + 1))}
                disabled={currentPage >= Math.ceil(totalUsers / 10) || loading}
                className="p-2 bg-white/5 rounded-xl text-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Sidebar */}
      <AnimatePresence>
        {showDetails && selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0e17] border-l border-white/5 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Detalhes do Usuário</h3>
                  <button onClick={() => setShowDetails(false)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 py-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                  <div className="size-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-3xl">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                  <div className="text-center w-full px-6">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-center font-bold focus:outline-none focus:border-indigo-500"
                          placeholder="Nome do Usuário"
                        />
                        <input 
                          type="email" 
                          value={editForm.email} 
                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
                          placeholder="E-mail"
                        />
                        <input 
                          type="text" 
                          value={editForm.password} 
                          onChange={e => setEditForm({...editForm, password: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500 placeholder:text-red-400/50"
                          placeholder="Nova senha (deixe vazio para manter)"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xl font-black text-white">{selectedUser.name}</h4>
                        <p className="text-sm font-bold text-slate-500">{selectedUser.email}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Documento (CPF)</p>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.cpf} 
                          onChange={e => setEditForm({...editForm, cpf: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white uppercase italic">
                          {selectedUser.cpf || 'Não informado'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">WhatsApp</p>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.whatsapp} 
                          onChange={e => setEditForm({...editForm, whatsapp: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white">
                          {selectedUser.whatsapp || 'Não informado'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Endereço Completo</p>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Rua / Logradouro</p>
                            <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Número</p>
                            <input type="text" value={editForm.number} onChange={e => setEditForm({...editForm, number: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Bairro</p>
                            <input type="text" value={editForm.neighborhood} onChange={e => setEditForm({...editForm, neighborhood: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Cidade</p>
                            <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">UF</p>
                            <input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">CEP</p>
                            <input type="text" value={editForm.zipCode} onChange={e => setEditForm({...editForm, zipCode: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Rua / Logradouro</p>
                            <p className="text-xs font-bold text-white">{selectedUser.address || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Número</p>
                            <p className="text-xs font-bold text-white">{selectedUser.number || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Bairro</p>
                            <p className="text-xs font-bold text-white">{selectedUser.neighborhood || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Cidade / UF</p>
                            <p className="text-xs font-bold text-white">{selectedUser.city ? `${selectedUser.city} / ${selectedUser.state}` : '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">CEP</p>
                            <p className="text-xs font-bold text-white">{selectedUser.zipCode || '--'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4">
                  {isEditing ? (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveUser}
                        disabled={savingDetails}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingDetails ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all"
                      >
                        Editar Informações
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                        disabled={actionLoading === selectedUser.id}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedUser.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20'}`}
                      >
                        {actionLoading === selectedUser.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : selectedUser.status === 'blocked' ? (
                          <><CheckCircle size={16} /> Desbloquear Conta</>
                        ) : (
                          <><Ban size={16} /> Bloquear Conta</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
