import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight,
  FolderTree,
  Loader2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules, Category } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    parentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await businessRules.getAdminCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parentId: category.parentId || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parentId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await businessRules.updateCategory(editingCategory.id, {
          name: formData.name,
          parentId: formData.parentId || null
        } as any);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await businessRules.addCategory({
          name: formData.name,
          parentId: formData.parentId || null,
          merchantId: null
        } as any);
        toast.success('Categoria criada com sucesso!');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar produtos vinculados.')) return;
    
    setIsDeleting(id);
    try {
      await businessRules.deleteCategory(id);
      toast.success('Categoria excluída!');
      loadCategories();
    } catch (error) {
      toast.error('Erro ao excluir categoria.');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getParentName = (parentId?: string) => {
    if (!parentId) return '--';
    return categories.find(c => c.id === parentId)?.name || 'Pai não encontrado';
  };

  return (
    <AdminLayout title="Categorias" subtitle="Gerenciamento de categorias do marketplace">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Pesquisar categorias..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a0e17] border border-white/5 py-4 pl-12 pr-6 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-white placeholder:text-slate-600 w-full md:w-80 transition-all shadow-xl"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-3 bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            <Plus size={18} /> Nova Categoria
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.02]">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Categoria</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria Pai</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tipo</th>
                  <th className="py-6 px-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-8 text-primary-blue animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando categorias...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${category.parentId ? 'bg-slate-800/50 text-slate-500' : 'bg-primary-blue/10 text-primary-blue shadow-lg shadow-primary-blue/5'}`}>
                            {category.parentId ? <ChevronRight size={18} /> : <Tag size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-primary-blue transition-all">{category.name}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ID: {category.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <span className={`text-xs font-bold ${category.parentId ? 'text-slate-300' : 'text-slate-600'}`}>
                          {getParentName(category.parentId)}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          category.parentId 
                            ? 'bg-slate-800/20 border-white/5 text-slate-500' 
                            : 'bg-primary-blue/10 border-primary-blue/20 text-primary-blue'
                        }`}>
                          {category.parentId ? 'Sub-categoria' : 'Categoria Pai'}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(category)}
                            className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all shadow-sm"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)}
                            disabled={isDeleting === category.id}
                            className="p-3 bg-white/5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm disabled:opacity-50"
                            title="Excluir"
                          >
                            {isDeleting === category.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-600">
                        <FolderTree size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma categoria encontrada</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create/Edit */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-midnight/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/10"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                        {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Configure os detalhes da categoria</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-full transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Categoria</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-white placeholder:text-slate-600"
                        placeholder="Ex: Eletrônicos, Alimentação..."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria Pai (Opcional)</label>
                      <select 
                        value={formData.parentId}
                        onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#0f172a]">Nenhuma (Esta será uma categoria pai)</option>
                        {categories
                          .filter(c => c.id !== editingCategory?.id && !c.parentId) // Evita auto-referência e níveis profundos demais (apenas 2 níveis por enquanto)
                          .map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.name}</option>
                          ))
                        }
                      </select>
                      <p className="text-[9px] text-slate-600 font-medium ml-1 italic">Dica: Selecione uma categoria pai para criar uma sub-categoria.</p>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-8 py-5 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-8 py-5 bg-primary-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-primary-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
