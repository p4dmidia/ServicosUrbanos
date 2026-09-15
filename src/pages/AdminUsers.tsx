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
  Loader2,
  Pencil,
  User as UserIcon,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Lock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'merchant' | 'customer' | 'affiliate' | 'regional_reseller' | 'owner' | 'manager' | string;
  status: 'active' | 'blocked' | 'pending';
  joinedAt: string;
  location: string;
  avatar?: string;
  cpf?: string;
  cnpj?: string;
  personType?: 'PF' | 'PJ';
  companyName?: string;
  gender?: string;
  birthDate?: string;
  whatsapp?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  pixKey?: string;
  pixType?: string;
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
  const [pendingPjRequests, setPendingPjRequests] = useState<any[]>([]);
  const [showPjModal, setShowPjModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, pjRequestsData] = await Promise.all([
        businessRules.getAdminGlobalStats(),
        businessRules.getAdminUsers({ 
          page: currentPage, 
          search: searchTerm, 
          status: statusFilter 
        }),
        businessRules.getAdminPjMigrationRequests('pending')
      ]);
      setGlobalStats(statsData);
      setUsers(usersData.users);
      setTotalUsers(usersData.total);
      setPendingPjRequests(pjRequestsData || []);
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

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'regional_reseller' ? 'affiliate' : 'regional_reseller';
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(newRole === 'regional_reseller' ? 'Usuário definido como Revendedor!' : 'Usuário definido como Afiliado!');
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar cargo:', error);
      toast.error('Erro ao atualizar cargo do usuário: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const populateUserForm = (user: User) => ({
    name: user.name || '',
    email: user.email === '--' ? '' : user.email,
    role: user.role || 'customer',
    status: user.status || 'active',
    gender: user.gender || '',
    birthDate: user.birthDate || '',
    personType: user.personType || (user.cnpj ? 'PJ' : 'PF'),
    cpf: user.cpf || '',
    cnpj: user.cnpj || '',
    companyName: user.companyName || '',
    whatsapp: user.whatsapp || '',
    address: user.address || '',
    number: user.number || '',
    neighborhood: user.neighborhood || '',
    city: user.city || '',
    state: user.state || '',
    zipCode: user.zipCode || '',
    bankName: user.bankName || '',
    bankBranch: user.bankBranch || '',
    bankAccount: user.bankAccount || '',
    pixKey: user.pixKey || '',
    pixType: user.pixType || 'CPF',
    password: ''
  });

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm(populateUserForm(user));
    setIsEditing(true);
    setShowDetails(true);
  };

  const handleOpenView = (user: User) => {
    setSelectedUser(user);
    setEditForm(populateUserForm(user));
    setIsEditing(false);
    setShowDetails(true);
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
        email: editForm.email || selectedUser.email,
        role: editForm.role || selectedUser.role,
        status: editForm.status || selectedUser.status,
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        personType: editForm.personType,
        cpf: editForm.cpf,
        cnpj: editForm.cnpj,
        companyName: editForm.companyName,
        whatsapp: editForm.whatsapp,
        address: editForm.address,
        number: editForm.number,
        neighborhood: editForm.neighborhood,
        city: editForm.city,
        state: editForm.state,
        zipCode: editForm.zipCode,
        bankName: editForm.bankName,
        bankBranch: editForm.bankBranch,
        bankAccount: editForm.bankAccount,
        pixKey: editForm.pixKey,
        pixType: editForm.pixType,
        location: editForm.city ? `${editForm.city}, ${editForm.state || ''}` : selectedUser.location
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleApprovePj = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await businessRules.approvePjMigrationRequest(requestId);
      toast.success('Migração para PJ aprovada com sucesso! O perfil do usuário foi atualizado.');
      await loadData();
      if (selectedUser) {
        setShowDetails(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar migração PJ.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPj = async (requestId: string) => {
    const reason = window.prompt('Informe o motivo da recusa (será enviado ao usuário):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Informe um motivo para a recusa.');
      return;
    }

    setActionLoading(requestId);
    try {
      await businessRules.rejectPjMigrationRequest(requestId, reason.trim());
      toast.success('Solicitação recusada e usuário notificado.');
      await loadData();
      if (selectedUser) {
        setShowDetails(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao recusar solicitação.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    
    const headers = ['Nome', 'Email', 'Cargo', 'Status', 'Desde', 'Localização', 'CPF', 'WhatsApp'];
    const getRoleLabel = (role: string) => {
      switch (role) {
        case 'admin': return 'Admin';
        case 'merchant':
        case 'owner':
        case 'manager': return 'Lojista';
        case 'regional_reseller': return 'Segurado/Revendedor';
        case 'affiliate': return 'Afiliado';
        case 'customer':
        default: return 'Segurado';
      }
    };

    const rows = users.map(u => [
      u.name,
      u.email,
      getRoleLabel(u.role),
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
      case 'admin': 
        return <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">Admin</span>;
      case 'merchant': 
      case 'owner':
      case 'manager':
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Revendedor</span>;
      case 'regional_reseller':
        return <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-purple-500/20">Segurado/Revendedor</span>;
      case 'affiliate':
        return <span className="px-2 py-1 bg-pink-500/10 text-pink-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-pink-500/20">Afiliado</span>;
      case 'customer':
      default: 
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Segurado</span>;
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
            { label: 'Revendedores Ativos', value: globalStats?.branchCount?.toLocaleString('pt-BR') || '0', icon: Shield, color: 'text-emerald-500' },
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

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <button 
                onClick={() => setShowPjModal(true)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  pendingPjRequests.length > 0 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/20 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
                title="Visualizar solicitações de migração para PJ"
              >
                <Building2 size={16} className={pendingPjRequests.length > 0 ? 'text-white' : 'text-purple-400'} />
                Solicitações PJ ({pendingPjRequests.length})
              </button>
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
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-black text-white leading-none group-hover:text-indigo-400 transition-colors">{user.name}</p>
                              {pendingPjRequests.some(r => r.user_id === user.id) ? (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                  Solicitou PJ
                                </span>
                              ) : (user.personType === 'PJ' || (user.cnpj && user.cnpj.replace(/\D/g, '').length === 14)) ? (
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[8px] font-black uppercase tracking-widest">
                                  PJ
                                </span>
                              ) : null}
                            </div>
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
                            onClick={() => handleOpenEdit(user)}
                            className="px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                            title="Editar Perfil do Usuário"
                          >
                            <Pencil size={15} />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button 
                            onClick={() => handleToggleRole(user.id, user.role)}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-xl transition-all ${user.role === 'regional_reseller' ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-purple-500/10 text-purple-400'}`}
                            title={user.role === 'regional_reseller' ? 'Remover Revendedor' : 'Tornar Revendedor'}
                          >
                            {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-xl transition-all ${user.status === 'blocked' ? 'hover:bg-emerald-500/10 text-emerald-500' : 'hover:bg-red-500/10 text-red-500'}`}
                            title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                          >
                            {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : user.status === 'blocked' ? <CheckCircle size={18} /> : <Ban size={18} />}
                          </button>
                          <button 
                            onClick={() => handleOpenView(user)}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                            title="Ver Detalhes"
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

      {/* User Details & Edit Sidebar Drawer */}
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
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0a0e17] border-l border-white/5 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                      {isEditing ? 'Editar Perfil do Usuário' : 'Detalhes do Usuário'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {isEditing ? 'Atualize todos os dados do perfil' : 'Informações cadastrais e financeiras'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDetails(false)} 
                    className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Top Profile Card */}
                <div className="flex flex-col items-center gap-4 py-6 px-6 bg-white/5 rounded-[2rem] border border-white/5">
                  <div className="size-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-2xl shadow-lg shadow-indigo-500/10">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                  <div className="text-center w-full">
                    {isEditing ? (
                      <div className="space-y-3 max-w-md mx-auto">
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Nome Completo</label>
                          <input 
                            type="text" 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center font-bold focus:outline-none focus:border-indigo-500"
                            placeholder="Nome do Usuário"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">E-mail de Acesso</label>
                          <input 
                            type="email" 
                            value={editForm.email} 
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="E-mail"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Redefinir Senha (opcional)</label>
                          <input 
                            type="text" 
                            value={editForm.password} 
                            onChange={e => setEditForm({...editForm, password: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-center text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                            placeholder="Deixe em branco para manter a senha atual"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xl font-black text-white">{selectedUser.name}</h4>
                        <p className="text-sm font-bold text-slate-500">{selectedUser.email}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* CARD DE SOLICITAÇÃO DE MIGRAÇÃO PJ PENDENTE */}
                  {pendingPjRequests.find(r => r.user_id === selectedUser.id) && (() => {
                    const userReq = pendingPjRequests.find(r => r.user_id === selectedUser.id);
                    return (
                      <div className="p-5 bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-indigo-950/30 border border-purple-500/40 rounded-3xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                            <Building2 size={16} />
                            <span>Solicitação de Migração para PJ</span>
                          </div>
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Pendente
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="text-slate-300 font-bold">
                            CNPJ: <span className="text-white font-black">{userReq.cnpj}</span>
                          </p>
                          <p className="text-slate-300 font-bold">
                            Razão Social: <span className="text-white font-black">{userReq.company_name}</span>
                          </p>
                          {userReq.trade_name && (
                            <p className="text-slate-400 text-[11px]">
                              Nome Fantasia: <span className="text-slate-200 font-bold">{userReq.trade_name}</span>
                            </p>
                          )}
                          {userReq.pix_key && (
                            <p className="text-slate-400 text-[11px]">
                              Chave PIX: <span className="text-slate-200 font-bold">{userReq.pix_key}</span> ({userReq.pix_type || 'CNPJ'})
                            </p>
                          )}
                          {userReq.notes && (
                            <p className="text-slate-400 text-[11px] italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                              "{userReq.notes}"
                            </p>
                          )}
                          {userReq.document_url && (
                            <a href={userReq.document_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-bold">
                              Ver documento / comprovante anexo
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleRejectPj(userReq.id)}
                            disabled={actionLoading === userReq.id}
                            className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovePj(userReq.id)}
                            disabled={actionLoading === userReq.id}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === userReq.id ? <Loader2 size={14} className="animate-spin" /> : (
                              <>
                                <CheckCircle size={14} />
                                Aprovar Migração PJ
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SEÇÃO 1: ACESSO & CARGO */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Shield size={14} />
                      Acesso & Cargo no Sistema
                    </p>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Cargo / Função</label>
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={e => setEditForm({...editForm, role: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="customer" className="bg-[#0a0e17]">Segurado (Padrão)</option>
                            <option value="affiliate" className="bg-[#0a0e17]">Afiliado</option>
                            <option value="regional_reseller" className="bg-[#0a0e17]">Segurado / Revendedor</option>
                            <option value="merchant" className="bg-[#0a0e17]">Lojista</option>
                            <option value="admin" className="bg-[#0a0e17]">Administrador</option>
                          </select>
                        ) : (
                          <div className="text-xs font-bold text-white pt-1">
                            {getRoleBadge(selectedUser.role)}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Status da Conta</label>
                        {isEditing ? (
                          <select
                            value={editForm.status}
                            onChange={e => setEditForm({...editForm, status: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="active" className="bg-[#0a0e17]">Ativo</option>
                            <option value="blocked" className="bg-[#0a0e17]">Bloqueado</option>
                            <option value="pending" className="bg-[#0a0e17]">Pendente</option>
                          </select>
                        ) : (
                          <div className="text-xs font-bold text-white pt-1">
                            {getStatusBadge(selectedUser.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: DADOS PESSOAIS & IDENTIFICAÇÃO (GÊNERO, NASCIMENTO, ETC) */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <UserIcon size={14} />
                      Dados Pessoais & Documentos
                    </p>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tipo de Pessoa */}
                        <div>
                          <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Tipo de Pessoa</label>
                          {isEditing ? (
                            <select
                              value={editForm.personType || 'PF'}
                              onChange={e => setEditForm({...editForm, personType: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="PF" className="bg-[#0a0e17]">Pessoa Física (PF)</option>
                              <option value="PJ" className="bg-[#0a0e17]">Pessoa Jurídica (PJ)</option>
                            </select>
                          ) : (
                            <p className="text-xs font-bold text-white">
                              {selectedUser.personType === 'PJ' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)'}
                            </p>
                          )}
                        </div>

                        {/* Sexo / Gênero */}
                        <div>
                          <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                            Sexo / Gênero
                          </label>
                          {isEditing ? (
                            <select
                              value={editForm.gender || ''}
                              onChange={e => setEditForm({...editForm, gender: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="" className="bg-[#0a0e17]">Não informado</option>
                              <option value="M" className="bg-[#0a0e17]">Masculino</option>
                              <option value="F" className="bg-[#0a0e17]">Feminino</option>
                            </select>
                          ) : (
                            <p className="text-xs font-bold text-white">
                              {selectedUser.gender === 'M' ? 'Masculino' : (selectedUser.gender === 'F' ? 'Feminino' : (selectedUser.gender || 'Não informado'))}
                            </p>
                          )}
                        </div>

                        {/* Data de Nascimento */}
                        <div>
                          <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                            Data de Nascimento
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm.birthDate ? editForm.birthDate.split('T')[0] : ''}
                              onChange={e => setEditForm({...editForm, birthDate: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                            />
                          ) : (
                            <p className="text-xs font-bold text-white">
                              {selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informada'}
                            </p>
                          )}
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                            WhatsApp / Telefone
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.whatsapp || ''}
                              onChange={e => setEditForm({...editForm, whatsapp: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                              placeholder="(00) 00000-0000"
                            />
                          ) : (
                            <p className="text-xs font-bold text-white">
                              {selectedUser.whatsapp || 'Não informado'}
                            </p>
                          )}
                        </div>

                        {/* CPF */}
                        <div>
                          <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                            CPF
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.cpf || ''}
                              onChange={e => setEditForm({...editForm, cpf: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                              placeholder="000.000.000-00"
                            />
                          ) : (
                            <p className="text-xs font-bold text-white uppercase">
                              {selectedUser.cpf || 'Não informado'}
                            </p>
                          )}
                        </div>

                        {/* CNPJ (se PJ ou preenchido) */}
                        {(isEditing ? editForm.personType === 'PJ' : selectedUser.personType === 'PJ' || selectedUser.cnpj) && (
                          <div>
                            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                              CNPJ
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.cnpj || ''}
                                onChange={e => setEditForm({...editForm, cnpj: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                                placeholder="00.000.000/0000-00"
                              />
                            ) : (
                              <p className="text-xs font-bold text-white">
                                {selectedUser.cnpj || 'Não informado'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Razão Social (se PJ ou preenchido) */}
                        {(isEditing ? editForm.personType === 'PJ' : selectedUser.personType === 'PJ' || selectedUser.companyName) && (
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                              Razão Social / Nome Fantasia
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.companyName || ''}
                                onChange={e => setEditForm({...editForm, companyName: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                                placeholder="Nome empresarial"
                              />
                            ) : (
                              <p className="text-xs font-bold text-white">
                                {selectedUser.companyName || 'Não informado'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 3: ENDEREÇO */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} />
                      Endereço Completo
                    </p>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Rua / Logradouro</label>
                            <input type="text" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="Ex: Av. Brasil" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Número</label>
                            <input type="text" value={editForm.number || ''} onChange={e => setEditForm({...editForm, number: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="123" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Bairro</label>
                            <input type="text" value={editForm.neighborhood || ''} onChange={e => setEditForm({...editForm, neighborhood: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="Centro" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Cidade</label>
                            <input type="text" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="Cidade" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">UF</label>
                            <input type="text" value={editForm.state || ''} onChange={e => setEditForm({...editForm, state: e.target.value})} maxLength={2} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 uppercase" placeholder="BA" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">CEP</label>
                            <input type="text" value={editForm.zipCode || ''} onChange={e => setEditForm({...editForm, zipCode: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="00000-000" />
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
                            <p className="text-xs font-bold text-white">{selectedUser.city ? `${selectedUser.city} / ${selectedUser.state || ''}` : '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">CEP</p>
                            <p className="text-xs font-bold text-white">{selectedUser.zipCode || '--'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO 4: DADOS BANCÁRIOS & PIX */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} />
                      Dados Bancários & PIX
                    </p>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Banco</label>
                            <input type="text" value={editForm.bankName || ''} onChange={e => setEditForm({...editForm, bankName: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="Ex: Nubank, Banco do Brasil" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Agência</label>
                            <input type="text" value={editForm.bankBranch || ''} onChange={e => setEditForm({...editForm, bankBranch: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="0001" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Conta Corrente</label>
                            <input type="text" value={editForm.bankAccount || ''} onChange={e => setEditForm({...editForm, bankAccount: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="12345-6" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Tipo de Chave PIX</label>
                            <select 
                              value={editForm.pixType || 'CPF'} 
                              onChange={e => setEditForm({...editForm, pixType: e.target.value})}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="CPF" className="bg-[#0a0e17]">CPF</option>
                              <option value="CNPJ" className="bg-[#0a0e17]">CNPJ</option>
                              <option value="EMAIL" className="bg-[#0a0e17]">E-mail</option>
                              <option value="TELEFONE" className="bg-[#0a0e17]">Telefone</option>
                              <option value="ALEATORIA" className="bg-[#0a0e17]">Chave Aleatória</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Chave PIX</label>
                            <input type="text" value={editForm.pixKey || ''} onChange={e => setEditForm({...editForm, pixKey: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500" placeholder="Chave para recebimento" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Banco</p>
                            <p className="text-xs font-bold text-white">{selectedUser.bankName || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Agência</p>
                            <p className="text-xs font-bold text-white">{selectedUser.bankBranch || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Conta</p>
                            <p className="text-xs font-bold text-white">{selectedUser.bankAccount || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Tipo de Chave PIX</p>
                            <p className="text-xs font-bold text-white">{selectedUser.pixType || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Chave PIX</p>
                            <p className="text-xs font-bold text-white">{selectedUser.pixKey || '--'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                  {isEditing ? (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveUser}
                        disabled={savingDetails}
                        className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingDetails ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Pencil size={16} />
                        Editar Informações de Perfil
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                        disabled={actionLoading === selectedUser.id}
                        className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedUser.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20'}`}
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

      {/* Modal com Todas as Solicitações PJ Pendentes */}
      <AnimatePresence>
        {showPjModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPjModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0e17] rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-10 z-10 overflow-y-auto max-h-[85vh] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Solicitações de Migração PJ</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {pendingPjRequests.length} {pendingPjRequests.length === 1 ? 'solicitação aguardando' : 'solicitações aguardando'} aprovação
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPjModal(false)}
                  className="size-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {pendingPjRequests.length === 0 ? (
                  <p className="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Nenhuma solicitação de migração para PJ pendente.
                  </p>
                ) : (
                  pendingPjRequests.map((req) => (
                    <div key={req.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4 hover:border-purple-500/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{req.company_name}</p>
                          <p className="text-xs text-slate-400 font-bold">
                            CNPJ: <span className="text-indigo-400">{req.cnpj}</span> • Solicitante: <span className="text-white">{req.profiles?.full_name || 'Afiliado'}</span>
                          </p>
                        </div>
                        <span className="self-start sm:self-auto px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {new Date(req.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/20 p-4 rounded-2xl border border-white/5">
                        {req.trade_name && (
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Nome Fantasia</p>
                            <p className="text-white font-bold">{req.trade_name}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Chave PIX</p>
                          <p className="text-white font-bold">{req.pix_key || '--'} ({req.pix_type || 'CNPJ'})</p>
                        </div>
                        {req.notes && (
                          <div className="sm:col-span-2">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Observações</p>
                            <p className="text-slate-300 italic text-[11px]">"{req.notes}"</p>
                          </div>
                        )}
                        {req.document_url && (
                          <div className="sm:col-span-2">
                            <a href={req.document_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold text-[11px]">
                              Visualizar comprovante / documento
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => handleRejectPj(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleApprovePj(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : (
                            <>
                              <CheckCircle size={16} />
                              Aprovar Migração PJ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
