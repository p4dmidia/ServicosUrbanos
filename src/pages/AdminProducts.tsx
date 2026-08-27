import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Loader2, 
  X,
  Clock,
  DollarSign,
  CheckCircle,
  Ban,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  cashback: number;
  status: 'Ativo' | 'Inativo';
  image: string;
  is_subscription: boolean;
  plan_type: 'mensal' | 'trimestral' | 'semestral' | 'anual' | string;
  duration_days: number;
  created_at: string;
}

export default function AdminProducts() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: 0,
    duration_days: 30,
    plan_type: 'mensal',
    image: '📅',
    status: 'Ativo' as 'Ativo' | 'Inativo'
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_subscription', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      toast.error('Erro ao carregar planos de assinatura.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleToggleStatus = async (planId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    setActionLoading(planId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;
      toast.success(newStatus === 'Ativo' ? 'Plano ativado!' : 'Plano inativado!');
      loadPlans();
    } catch (err: any) {
      toast.error('Erro ao alterar status do plano.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano permanente?')) return;
    setActionLoading(planId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      toast.success('Plano excluído com sucesso!');
      loadPlans();
    } catch (err: any) {
      toast.error('Erro ao excluir o plano. Ele pode estar vinculado a pedidos.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0 || form.duration_days <= 0) {
      toast.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    setLoading(true);
    try {
      const planData = {
        name: form.name,
        price: form.price,
        duration_days: form.duration_days,
        plan_type: form.plan_type,
        image: form.image,
        status: form.status,
        category: 'Assinatura',
        is_subscription: true,
        stock: 999999, // estoque infinito para planos
        cashback: 0 // cashbacks de planos são configurados nas regras gerais de MMN
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('products')
          .update(planData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Plano atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([planData]);

        if (error) throw error;
        toast.success('Novo plano criado com sucesso!');
      }

      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      toast.error('Erro ao salvar plano: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      name: '',
      price: 0,
      duration_days: 30,
      plan_type: 'mensal',
      image: '📅',
      status: 'Ativo'
    });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setForm({
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      plan_type: plan.plan_type,
      image: plan.image,
      status: plan.status
    });
    setIsEditing(true);
    setEditingId(plan.id);
    setShowModal(true);
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.plan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Planos de Assinatura" subtitle="Gerencie os planos de licenciamento MMN do ecossistema">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Filters & Actions */}
        <div className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou tipo de plano..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 py-3.5 pl-12 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>

            <button 
              onClick={openAddModal}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 animate-glow"
            >
              <Plus size={16} />
              Criar Novo Plano
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificador</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-right py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-8 text-indigo-500 animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando planos...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center text-lg">
                            {plan.image || '📦'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-indigo-400 transition-colors">{plan.name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {plan.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4 font-black text-white font-mono text-sm">
                        R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                          <Clock size={12} className="text-slate-600" />
                          {plan.duration_days} DIAS
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className="px-2 py-1 bg-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                          {plan.plan_type}
                        </span>
                      </td>
                      <td className="py-5 px-4 font-bold text-xs">
                        {plan.status === 'Ativo' ? (
                          <span className="flex items-center gap-1.5 text-emerald-500 uppercase tracking-widest"><div className="size-1.5 rounded-full bg-emerald-500" /> Ativo</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 uppercase tracking-widest"><div className="size-1.5 rounded-full bg-red-500" /> Inativo</span>
                        )}
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(plan)}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                            title="Editar Plano"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(plan.id, plan.status)}
                            disabled={actionLoading === plan.id}
                            className={`p-2 rounded-xl transition-all ${plan.status === 'Ativo' ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`}
                            title={plan.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                          >
                            {actionLoading === plan.id ? <Loader2 size={16} className="animate-spin" /> : plan.status === 'Ativo' ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(plan.id)}
                            disabled={actionLoading === plan.id}
                            className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all"
                            title="Excluir Plano"
                          >
                            {actionLoading === plan.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">Nenhum plano encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-[#000]/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl overflow-hidden text-slate-300"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                    {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure as características do licenciamento</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="size-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Plano *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Plano Trimestral Premium"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço de Venda (R$) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={form.price || ''}
                      onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duração (Dias) *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Ex: 90"
                      value={form.duration_days || ''}
                      onChange={e => setForm({ ...form, duration_days: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificador MMN *</label>
                    <select
                      value={form.plan_type}
                      onChange={e => setForm({ ...form, plan_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold"
                    >
                      <option value="mensal" className="bg-[#0a0e17]">mensal</option>
                      <option value="trimestral" className="bg-[#0a0e17]">trimestral</option>
                      <option value="semestral" className="bg-[#0a0e17]">semestral</option>
                      <option value="anual" className="bg-[#0a0e17]">anual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ícone / Emoji *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: 🏆"
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white text-center text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                  >
                    Salvar Plano
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
