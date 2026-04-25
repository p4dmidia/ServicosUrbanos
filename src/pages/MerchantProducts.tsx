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
  Building2,
  Loader2,
  Truck,
  Maximize,
  Image as ImageIcon,
  FileText,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, Branch } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MerchantProduct {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  stock: number;
  sales: number;
  cashback: number;
  status: 'Ativo' | 'Inativo';
  image: string;
  mainImage?: string;
  gallery?: string[];
  branchId: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export default function MerchantProducts() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterBranch, setFilterBranch] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');

  const [newProduct, setNewProduct] = useState<Partial<MerchantProduct>>({
    name: '',
    category: '',
    categoryId: '',
    price: 0,
    stock: 0,
    status: 'Ativo',
    image: '',
    mainImage: '',
    gallery: [],
    cashback: 0,
    branchId: '',
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    description: ''
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        
        // Determinar o ID do Lojista (Dono) para isolamento de dados
        const mId = await businessRules.getMerchantId(profile!.id);
        if (!mId) {
          setLoading(false);
          return;
        }

        const fetchedBranches = await businessRules.getBranches(mId);
        setBranches(fetchedBranches);

        const fetchedCategories = await businessRules.getCategories(mId);
        setCategoriesList(fetchedCategories);
        
        if (profile?.branch_id) {
          // Gerente vê apenas sua filial
          const fetchedProducts = await businessRules.getBranchProducts(profile.branch_id);
          setProducts(fetchedProducts);
          setNewProduct(prev => ({ ...prev, branchId: profile.branch_id }));
        } else if (profile?.role === 'owner') {
          // Dono vê produtos de todas as suas filiais (visão global)
          const fetchedProducts = await businessRules.getMerchantProducts(mId);
          setProducts(fetchedProducts);
        }
      } catch (err) {
        console.error('Error loading products data:', err);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    
    if (profile) {
      loadInitialData();
    }
  }, [profile]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
    const matchesBranch = profile?.role === 'owner' 
      ? (filterBranch === 'Todos' || p.branchId === filterBranch)
      : p.branchId === profile?.branch_id;
    return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
      await businessRules.updateProduct(id, { status: newStatus });
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: newStatus as 'Ativo' | 'Inativo' } : p
      ));
      toast.success('Status atualizado');
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Erro ao atualizar status');
    }
  };

  const deleteProduct = async (id: string) => {
    setProductToDelete(id);
    toast((t) => (
      <div className="flex flex-col gap-4 p-2">
        <p className="font-bold text-midnight">Tem certeza que deseja excluir este produto?</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={async () => {
              try {
                await businessRules.deleteProduct(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                toast.success('Produto excluído');
                toast.dismiss(t.id);
              } catch (err) {
                toast.error('Erro ao excluir');
              }
            }}
            className="px-4 py-2 text-xs font-black uppercase bg-red-500 text-white rounded-lg shadow-lg"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const mId = await businessRules.getMerchantId(profile!.id);
      
      const productData = {
        name: newProduct.name || 'Novo Produto',
        category: newProduct.category || categoriesList.find(c => c.id === newProduct.categoryId)?.name || 'Outros',
        price: Number(newProduct.price) || 0,
        stock: Number(newProduct.stock) || 0,
        cashback: Number(newProduct.cashback) || 0,
        status: (newProduct.status || 'Ativo') as 'Ativo' | 'Inativo',
        image: newProduct.mainImage || '📦',
        main_image: newProduct.mainImage,
        gallery: newProduct.gallery || [],
        branch_id: newProduct.branchId === 'matriz' || !newProduct.branchId ? null : newProduct.branchId,
        category_id: newProduct.categoryId || null,
        merchant_id: mId,
        weight: Number(newProduct.weight) || 0,
        height: Number(newProduct.height) || 0,
        width: Number(newProduct.width) || 0,
        length: Number(newProduct.length) || 0,
        description: newProduct.description || ''
      };
      
      if (isEditing && editingId) {
        await businessRules.updateProduct(editingId, productData);
        setProducts(prev => prev.map(p => p.id === editingId ? {
          ...p,
          ...productData,
          category: productData.category,
          categoryId: productData.category_id,
          branchId: productData.branch_id,
          mainImage: productData.main_image,
          image: productData.image,
          gallery: productData.gallery,
          weight: productData.weight,
          height: productData.height,
          width: productData.width,
          length: productData.length,
          description: productData.description
        } : p));
        toast.success('Produto atualizado com sucesso!');
      } else {
        const created = await businessRules.createProduct(productData);
        const mappedCreated: MerchantProduct = {
          id: created.id,
          name: created.name,
          category: created.category,
          categoryId: created.category_id,
          price: Number(created.price),
          stock: created.stock,
          sales: created.sales || 0,
          cashback: Number(created.cashback),
          status: created.status,
          image: created.image,
          mainImage: created.main_image,
          gallery: created.gallery,
          branchId: created.branch_id,
          weight: Number(created.weight),
          height: Number(created.height),
          width: Number(created.width),
          length: Number(created.length),
          description: created.description
        };
        setProducts(prev => [mappedCreated, ...prev]);
        toast.success('Produto cadastrado com sucesso!');
      }

      closeModal();
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setEditingId(null);
    setNewProduct({
      name: '',
      category: '',
      categoryId: '',
      price: 0,
      stock: 0,
      status: 'Ativo',
      image: '',
      mainImage: '',
      gallery: [],
      cashback: 0,
      branchId: profile?.branch_id || '',
      weight: 0,
      height: 0,
      width: 0,
      length: 0,
      description: ''
    });
  };

  const handleEdit = (p: MerchantProduct) => {
    setIsEditing(true);
    setEditingId(p.id);
    setNewProduct({
      name: p.name,
      category: p.category,
      categoryId: p.categoryId,
      price: p.price,
      stock: p.stock,
      status: p.status,
      image: p.image,
      mainImage: p.mainImage,
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      cashback: p.cashback,
      branchId: p.branchId || 'matriz',
      weight: p.weight || 0,
      height: p.height || 0,
      width: p.width || 0,
      length: p.length || 0,
      description: p.description || ''
    });
    setShowAddModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    try {
      const mId = await businessRules.getMerchantId(profile!.id);
      if (!mId) return;

      const created = await businessRules.addCategory({
        name: newCategoryName,
        parentId: newCategoryParent || undefined,
        merchantId: mId
      });

      setCategoriesList(prev => [...prev, created]);
      setNewProduct(prev => ({ ...prev, categoryId: created.id }));
      setNewCategoryName('');
      setNewCategoryParent('');
      setShowAddCategory(false);
      toast.success('Categoria criada!');
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      if (isGallery) {
        const uploadPromises = Array.from(files).map(file => businessRules.uploadProductImage(file));
        const urls = await Promise.all(uploadPromises);
        setNewProduct(prev => ({
          ...prev,
          gallery: [...(prev.gallery || []), ...urls]
        }));
        toast.success(`${urls.length} imagem(ns) adicionada(s) à galeria`);
      } else {
        const url = await businessRules.uploadProductImage(files[0]);
        setNewProduct(prev => ({ ...prev, mainImage: url }));
        toast.success('Imagem de capa enviada!');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      gallery: prev.gallery?.filter((_, i) => i !== index)
    }));
  };


  if (loading) {
    return (
      <MerchantLayout title="Gerenciamento de Produtos" subtitle="Carregando produtos...">
        <div className="flex items-center justify-center p-20">
          <Loader2 size={42} className="text-primary-blue animate-spin opacity-20" />
        </div>
      </MerchantLayout>
    );
  }

  if (profile?.role === 'manager' && !profile?.branch_id) {
    return (
      <MerchantLayout title="Produtos" subtitle="Gestão de Catálogo">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-primary-blue/10 rounded-full flex items-center justify-center mb-6">
            <Package className="text-primary-blue" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma Loja Vinculada</h2>
          <p className="text-slate-500 max-w-md">
            Seu perfil ainda não possui uma filial associada. Entre em contato com a administração para gerenciar produtos.
          </p>
        </div>
      </MerchantLayout>
    );
  }

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
            
            {profile?.role === 'owner' && (
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
              <option value="Todos">Todas as Categorias</option>
              {categoriesList.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {profile?.role === 'owner' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-midnight hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-midnight/20 flex items-center justify-center gap-3 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Novo Produto
            </button>
          )}
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-[13px] min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                    {profile?.role === 'owner' && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filial</th>}
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                              {p.image?.startsWith('http') ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                p.image || '📦'
                              )}
                            </div>
                            <div>
                              <p className="font-black text-midnight tracking-tight">{p.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.category}</p>
                            </div>
                          </div>
                        </td>
                        {profile?.role === 'owner' && (
                          <td className="px-8 py-6">
                            <span className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                              <Building2 size={12} /> {branches.find(b => b.id === p.branchId)?.name || `Matriz - ${profile?.store_name || profile?.full_name}`}
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
                            onClick={() => toggleStatus(p.id, p.status)}
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
                            <button 
                              onClick={() => handleEdit(p)}
                              className="size-10 bg-slate-50 hover:bg-primary-blue hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all font-black uppercase"
                            >
                              <Edit3 size={16} />
                            </button>
                            {profile?.role === 'owner' && (
                              <button 
                                onClick={() => deleteProduct(p.id)}
                                className="size-10 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all font-black uppercase"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )) : (
                      <tr>
                        <td colSpan={profile?.role === 'owner' ? 7 : 6} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-50">
                            <Package size={48} className="text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase italic">Nenhum produto cadastrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
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
                  <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic">
                    {profile?.role === 'manager' ? 'Ajustar Estoque' : (isEditing ? 'Editar Produto' : 'Adicionar Produto')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {profile?.role === 'manager' ? 'Acesso limitado ao estoque' : `Catálogo da ${profile?.role === 'manager' ? 'Filial' : 'Matriz/Filiais'}`}
                  </p>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informações Básicas */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                      <input type="text" required disabled={profile?.role === 'manager'} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight disabled:opacity-50" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local do Estoque</label>
                      <select 
                        required 
                        disabled={profile?.role === 'manager'}
                        value={newProduct.branchId || 'matriz'} 
                        onChange={e => setNewProduct({...newProduct, branchId: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="matriz">LOJA MATRIZ (Sede)</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                        Categoria
                        {profile?.role === 'owner' && (
                          <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="text-primary-blue hover:underline lowercase font-bold tracking-normal">
                            {showAddCategory ? 'cancelar' : '+ nova'}
                          </button>
                        )}
                      </label>
                      
                      {!showAddCategory ? (
                        <select 
                          disabled={profile?.role === 'manager'}
                          value={newProduct.categoryId} 
                          onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Selecionar Categoria</option>
                          {categoriesList.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.parentId ? '↳ ' : ''}{c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex flex-col gap-2 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                          <input 
                            type="text" 
                            placeholder="Nome da categoria..." 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs text-midnight"
                          />
                          <select 
                            value={newCategoryParent} 
                            onChange={e => setNewCategoryParent(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs text-midnight"
                          >
                            <option value="">É uma categoria pai</option>
                            {categoriesList.filter(c => !c.parentId).map(c => (
                              <option key={c.id} value={c.id}>Sub de: {c.name}</option>
                            ))}
                          </select>
                          <button 
                            type="button" 
                            onClick={handleAddCategory}
                            className="bg-midnight text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            Criar Categoria
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
                      <input type="number" required disabled={profile?.role === 'manager'} step="0.01" min="0" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight disabled:opacity-50" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque</label>
                      <input type="number" required min="0" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-primary-blue/30 px-6 py-4 rounded-2xl font-black text-midnight focus:ring-4 focus:ring-primary-blue/10" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cashback (%)</label>
                      <input type="number" required disabled={profile?.role === 'manager'} min="0" max="100" value={newProduct.cashback || ''} onChange={e => setNewProduct({...newProduct, cashback: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight disabled:opacity-50" />
                    </div>

                    {/* Logística */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-midnight uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Truck size={14} /> Detalhes de Entrega
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Peso (kg)</label>
                          <input type="number" disabled={profile?.role === 'manager'} step="0.001" value={newProduct.weight || ''} onChange={e => setNewProduct({...newProduct, weight: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-xs text-midnight disabled:opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Altura (cm)</label>
                          <input type="number" disabled={profile?.role === 'manager'} value={newProduct.height || ''} onChange={e => setNewProduct({...newProduct, height: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-xs text-midnight disabled:opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Largura (cm)</label>
                          <input type="number" disabled={profile?.role === 'manager'} value={newProduct.width || ''} onChange={e => setNewProduct({...newProduct, width: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-xs text-midnight disabled:opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Comprimento (cm)</label>
                          <input type="number" disabled={profile?.role === 'manager'} value={newProduct.length || ''} onChange={e => setNewProduct({...newProduct, length: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-xs text-midnight disabled:opacity-50" />
                        </div>
                      </div>
                    </div>

                    {/* Descrição e Imagens */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Produto</label>
                      <textarea 
                        rows={4} 
                        disabled={profile?.role === 'manager'}
                        value={newProduct.description} 
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight resize-none disabled:opacity-50"
                        placeholder="Detalhes sobre o produto, materiais, uso, etc..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagem de Capa</label>
                      <div className="flex flex-col gap-4">
                        {newProduct.mainImage && (
                          <div className="relative size-32 rounded-2xl overflow-hidden border border-slate-200 group">
                            <img src={newProduct.mainImage} alt="Capa" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setNewProduct({...newProduct, mainImage: ''})}
                              disabled={profile?.role === 'manager'}
                              className="absolute top-2 right-2 size-8 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:hidden"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <label className={`
                          relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                          ${uploading ? 'bg-slate-50 border-slate-200 cursor-wait' : 'bg-slate-50 border-slate-200 hover:border-primary-blue hover:bg-primary-blue/5'}
                        `}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, false)} 
                            disabled={uploading || profile?.role === 'manager'}
                          />
                          {uploading ? (
                            <Loader2 size={24} className="text-primary-blue animate-spin" />
                          ) : (
                            <ImageIcon size={24} className="text-slate-400" />
                          )}
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                            {uploading ? 'Enviando...' : 'Escolher Imagem do PC'}
                          </span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ou cole uma URL</label>
                          <input 
                            type="text" 
                            value={newProduct.mainImage || ''} 
                            onChange={e => setNewProduct({...newProduct, mainImage: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-midnight text-xs"
                            placeholder="https://exemplo.com/imagem.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Galeria de Imagens</label>
                      <div className="flex flex-col gap-4">
                        {newProduct.gallery && newProduct.gallery.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {newProduct.gallery.map((url, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                                <img src={url} alt={`G-${idx}`} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => removeGalleryImage(idx)}
                                  className="absolute top-1 right-1 size-6 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className={`
                          relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                          ${uploading ? 'bg-slate-50 border-slate-200 cursor-wait' : 'bg-slate-50 border-slate-200 hover:border-primary-blue hover:bg-primary-blue/5'}
                        `}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, true)} 
                            disabled={uploading}
                          />
                          <Plus size={24} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Adicionar à Galeria
                          </span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ou cole URLs (separadas por vírgula)</label>
                          <input 
                            type="text" 
                            placeholder="URL1, URL2, URL3..." 
                            onChange={e => setNewProduct({...newProduct, gallery: e.target.value.split(',').map(s => s.trim())})} 
                            className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-midnight text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button disabled={saving} onClick={closeModal} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all font-black">Cancelar</button>
                <button type="submit" form="add-product-form" disabled={saving} className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-blue/20 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Salvar Produto')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
