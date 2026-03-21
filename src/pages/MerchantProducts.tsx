import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, MerchantUser, Branch } from '../lib/businessRules';

interface MerchantProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  cashback: number;
  status: 'Ativo' | 'Inativo';
  image: string;
  branchId: string;
}

export default function MerchantProducts() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterBranch, setFilterBranch] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<MerchantUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [newProduct, setNewProduct] = useState<Partial<MerchantProduct>>({
    name: '',
    category: 'Eletrônicos',
    price: 0,
    stock: 0,
    status: 'Ativo',
    image: '📦',
    cashback: 0,
    branchId: ''
  });

  const [products, setProducts] = useState<MerchantProduct[]>([
    { id: '1', name: 'Fone Pro Noise', category: 'Eletrônicos', price: 199.90, stock: 45, sales: 842, cashback: 15, status: 'Ativo', image: '🎧', branchId: '1' },
    { id: '2', name: 'Smartwatch G2', category: 'Wearables', price: 349.00, stock: 12, sales: 512, cashback: 25, status: 'Ativo', image: '⌚', branchId: '1' },
    { id: '3', name: 'Tênis Street', category: 'Calçados', price: 279.50, stock: 0, sales: 298, cashback: 20, status: 'Inativo', image: '👟', branchId: '2' },
    { id: '4', name: 'Mochila Tech', category: 'Acessórios', price: 159.00, stock: 88, sales: 142, cashback: 12, status: 'Ativo', image: '🎒', branchId: '1' },
    { id: '5', name: 'Kindle Paper', category: 'Eletrônicos', price: 699.00, stock: 5, sales: 120, cashback: 50, status: 'Ativo', image: '📖', branchId: '3' },
  ]);

  useEffect(() => {
    const user = businessRules.getCurrentUser();
    setCurrentUser(user);
    setBranches(businessRules.getBranches());
    if (user.role === 'manager') {
      setNewProduct(prev => ({ ...prev, branchId: user.branchId }));
    }
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
    const matchesBranch = currentUser?.role === 'owner' 
      ? (filterBranch === 'Todos' || p.branchId === filterBranch)
      : p.branchId === currentUser?.branchId;
    return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
  });

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'Ativo' ? 'Inativo' : 'Ativo' } : p
    ));
  };

  const deleteProduct = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productToAdd: MerchantProduct = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name || 'Novo Produto',
      category: newProduct.category || 'Outros',
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      cashback: Number(newProduct.cashback) || 0,
      sales: 0,
      status: newProduct.status as 'Ativo' | 'Inativo' || 'Ativo',
      image: newProduct.image || '📦',
      branchId: newProduct.branchId || '1'
    };
    
    setProducts(prev => [productToAdd, ...prev]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      category: 'Eletrônicos',
      price: 0,
      stock: 0,
      status: 'Ativo',
      image: '📦',
      cashback: 0,
      branchId: currentUser?.role === 'manager' ? currentUser.branchId : ''
    });
  };

  return (
    <MerchantLayout title="Gerenciamento de Produtos" subtitle="Controle total do seu catálogo de ofertas">
      <div className="p-8 lg:p-12 space-y-8 text-[13px]">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-4xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por nome ou ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all text-midnight"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            
            {currentUser?.role === 'owner' && (
              <select 
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer text-midnight"
              >
                <option value="Todos">Todas as Filiais</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer text-midnight"
            >
              <option value="Todos">Categorias</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Wearables">Wearables</option>
              <option value="Calçados">Calçados</option>
              <option value="Acessórios">Acessórios</option>
            </select>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-midnight hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-midnight/20 flex items-center justify-center gap-3 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Novo Produto
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-[13px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  {currentUser?.role === 'owner' && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filial</th>}
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {filteredProducts.map((p) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                            {p.image}
                          </div>
                          <div>
                            <p className="font-black text-midnight tracking-tight">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      {currentUser?.role === 'owner' && (
                        <td className="px-8 py-6">
                          <span className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                            <Building2 size={12} /> {branches.find(b => b.id === p.branchId)?.name || 'Matriz'}
                          </span>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <span className="font-black text-midnight tracking-tighter text-sm">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                          <span className={`font-bold text-xs ${p.stock === 0 ? 'text-red-500' : 'text-midnight'}`}>{p.stock} un.</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                          {p.cashback}% 
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => toggleStatus(p.id)}
                          className={`inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            p.status === 'Ativo' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-[10px]">
                          <button className="size-10 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteProduct(p.id)}
                            className="size-10 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all font-black uppercase"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-[12px]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div>
                  <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic">Adicionar Produto</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Catálogo da {currentUser?.role === 'manager' ? 'Filial' : 'Matriz/Filiais'}</p>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                      <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight font-black" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filial Responsável</label>
                      <select 
                        required 
                        disabled={currentUser?.role === 'manager'}
                        value={newProduct.branchId} 
                        onChange={e => setNewProduct({...newProduct, branchId: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Selecionar Filial</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight appearance-none cursor-pointer">
                        <option value="Eletrônicos">Eletrônicos</option>
                        <option value="Wearables">Wearables</option>
                        <option value="Calçados">Calçados</option>
                        <option value="Acessórios">Acessórios</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
                      <input type="number" required step="0.01" min="0" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque Inicial</label>
                      <input type="number" required min="0" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowAddModal(false)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all font-black">Cancelar</button>
                <button type="submit" form="add-product-form" className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-blue/20">Salvar Produto</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
