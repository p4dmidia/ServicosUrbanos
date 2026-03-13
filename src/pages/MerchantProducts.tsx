import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

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
}

export default function MerchantProducts() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<MerchantProduct>>({
    name: '',
    category: 'Eletrônicos',
    price: 0,
    stock: 0,
    status: 'Ativo',
    image: '📦',
    cashback: 0
  });

  const [products, setProducts] = useState<MerchantProduct[]>([
    { id: '1', name: 'Fone Pro Noise', category: 'Eletrônicos', price: 199.90, stock: 45, sales: 842, cashback: 15, status: 'Ativo', image: '🎧' },
    { id: '2', name: 'Smartwatch G2', category: 'Wearables', price: 349.00, stock: 12, sales: 512, cashback: 25, status: 'Ativo', image: '⌚' },
    { id: '3', name: 'Tênis Street', category: 'Calçados', price: 279.50, stock: 0, sales: 298, cashback: 20, status: 'Inativo', image: '👟' },
    { id: '4', name: 'Mochila Tech', category: 'Acessórios', price: 159.00, stock: 88, sales: 142, cashback: 12, status: 'Ativo', image: '🎒' },
    { id: '5', name: 'Kindle Paper', category: 'Eletrônicos', price: 699.00, stock: 5, sales: 120, cashback: 50, status: 'Ativo', image: '📖' },
  ]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
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
      image: newProduct.image || '📦'
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
      cashback: 0
    });
  };

  return (
    <MerchantLayout title="Gerenciamento de Produtos" subtitle="Controle total do seu catálogo de ofertas">
      <div className="p-8 lg:p-12 space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por nome ou ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer"
            >
              <option value="Todos">Todas Categorias</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Wearables">Wearables</option>
              <option value="Calçados">Calçados</option>
              <option value="Acessórios">Acessórios</option>
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer"
            >
              <option value="Todos">Todos Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendas</th>
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
                          <div className="size-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                            {p.image}
                          </div>
                          <div>
                            <p className="font-black text-midnight tracking-tight">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black text-midnight tracking-tighter text-lg">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                          <span className={`font-bold text-sm ${p.stock === 0 ? 'text-red-500' : 'text-midnight'}`}>{p.stock} un.</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                          <TrendingUp size={12} />
                          {p.cashback}% 
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-500">{p.sales}</span>
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
                        <div className="flex items-center justify-end gap-2">
                          <button className="size-9 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteProduct(p.id)}
                            className="size-9 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="size-9 bg-slate-50 hover:bg-midnight hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-24 text-center">
              <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Package size={40} />
              </div>
              <h3 className="text-xl font-black text-midnight mb-2 uppercase tracking-tighter">Nenhum produto encontrado</h3>
              <p className="text-slate-400 text-sm font-medium">Tente ajustar seus filtros ou cadastre um novo produto.</p>
              <button 
                onClick={() => {setSearch(''); setFilterCategory('Todos'); setFilterStatus('Todos');}}
                className="mt-8 text-primary-blue font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exibindo {filteredProducts.length} de {products.length} produtos</p>
            <div className="flex items-center gap-3">
              <button disabled className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed transition-all">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                <button className="size-10 rounded-xl bg-primary-blue text-white font-black text-xs shadow-lg shadow-primary-blue/20">1</button>
                <button className="size-10 rounded-xl bg-white text-midnight font-bold text-xs hover:bg-slate-100 transition-all">2</button>
              </div>
              <button className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-midnight hover:bg-slate-100 transition-all shadow-sm">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
              <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic">Adicionar Produto</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Preencha os dados do novo item do catálogo</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="size-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-colors"
                >
                  <EyeOff size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                      <input 
                        type="text" 
                        required
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        placeholder="Ex: Tênis Esportivo Pro"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight appearance-none cursor-pointer"
                      >
                        <option value="Eletrônicos">Eletrônicos</option>
                        <option value="Wearables">Wearables</option>
                        <option value="Calçados">Calçados</option>
                        <option value="Acessórios">Acessórios</option>
                        <option value="Vestuário">Vestuário</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ícone / Imagem (Emoji temporário)</label>
                      <input 
                        type="text" 
                        value={newProduct.image}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        placeholder="📦"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        min="0"
                        value={newProduct.price || ''}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cashback Oferecido (%)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        max="100"
                        value={newProduct.cashback || ''}
                        onChange={e => setNewProduct({...newProduct, cashback: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        placeholder="Ex: 5"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque Inicial</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={newProduct.stock || ''}
                        onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Inicial</label>
                      <select 
                        value={newProduct.status}
                        onChange={e => setNewProduct({...newProduct, status: e.target.value as 'Ativo' | 'Inativo'})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight appearance-none cursor-pointer"
                      >
                        <option value="Ativo">Ativo e Visível</option>
                        <option value="Inativo">Inativo (Rascunho)</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="add-product-form"
                  className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-blue/20 flex items-center gap-2"
                >
                  Salvar Produto <Plus size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
