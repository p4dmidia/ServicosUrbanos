import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Bell, 
  ChevronRight, 
  Filter, 
  Star, 
  Tag, 
  ShieldCheck, 
  ArrowLeft,
  LayoutGrid,
  ShoppingBag,
  TrendingUp,
  X,
  CreditCard,
  Truck,
  Plus,
  Minus,
  Trash2,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Smartphone,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';


interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews_count?: number;
  sales: number;
  category: string;
  cashback: number;
  condition: string;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Loja() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceRange, setPriceRange] = useState(5000);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('urbashop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('urbashop_cart', JSON.stringify(cartItems));
  }, [cartItems]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const { user: authUser, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mmnConfig, setMmnConfig] = useState<any>(null);
  const [g1Value, setG1Value] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        
        if (catError) throw catError;
        const baseCategories = catData || [];

        // Fetch Products
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('id, name, price, image, main_image, category, sales, cashback, stock, product_reviews(rating)')
          .eq('status', 'Ativo');

        if (prodError) throw prodError;

        // Map database products to UI interface
        const formattedProducts: Product[] = (prodData || []).map(p => ({
          id: p.id,
          name: p.name || 'Produto sem nome',
          price: Number(p.price) || 0,
          image: p.main_image || p.image || '📦',
          rating: p.product_reviews?.length > 0 
            ? p.product_reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / p.product_reviews.length 
            : 5.0,
          reviews_count: p.product_reviews?.length || 0,
          sales: Number(p.sales) || 0,
          category: p.category || 'Geral',
          cashback: Number(p.cashback) || 5,
          condition: 'Novo',
          stock: Number(p.stock) || 0
        }));

        // Merge categories from products and the categories table
        const productCategories = Array.from(new Set(formattedProducts.map(p => p.category)))
          .map(cat => ({ id: cat, name: cat }));
        
        // Use a map to ensure unique category names
        const uniqueCategoriesMap = new Map();
        baseCategories.forEach(c => uniqueCategoriesMap.set(c.name, c));
        productCategories.forEach(c => {
          if (!uniqueCategoriesMap.has(c.name)) {
            uniqueCategoriesMap.set(c.name, c);
          }
        });

        // Fetch MMN Config
        const mmn = await businessRules.getMMNConfig();
        const levels = await businessRules.getMMNLevels();
        setMmnConfig(mmn);
        const g1 = levels.find(l => l.level === 1);
        if (g1) setG1Value(g1.value);

        setCategories(Array.from(uniqueCategoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error loading store data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const productName = p.name?.toLowerCase() || '';
      const productCategory = p.category?.toLowerCase() || '';
      const searchLower = search.toLowerCase();
      
      const matchesSearch = productName.includes(searchLower) ||
                          productCategory.includes(searchLower);
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesPrice = p.price <= priceRange;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [search, selectedCategory, priceRange, products]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalCashback = cartItems.reduce((acc, item) => {
    return acc + (item.price * (item.cashback / 100) * item.quantity);
  }, 0);

  const pMensal = Number(mmnConfig?.cashbackMensal || 2.75);
  const pDigital = Number(mmnConfig?.cashbackDigital || 1.0);
  const pAnual = Number(mmnConfig?.cashbackAnual || 0.75);
  const totalRatios = pMensal + pDigital + pAnual || 4.5;

  // O totalCashback aqui já deve considerar o G1 do usuário para ser o "Seu Retorno"
  const userTotalCashback = cartItems.reduce((acc, item) => {
    // A lógica correta é: Preço * (G1 / 100)
    return acc + (item.price * (g1Value / 100) * item.quantity);
  }, 0);

  const totalMensal = userTotalCashback * (pMensal / totalRatios);
  const totalDigital = userTotalCashback * (pDigital / totalRatios);
  const totalAnual = userTotalCashback * (pAnual / totalRatios);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      {/* Search Header */}
      <header className="bg-midnight py-4 md:py-6 px-6 lg:px-20 sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden size-10 flex items-center justify-center bg-white/5 rounded-xl text-white"
            >
              <Menu size={20} />
            </button>
            <Link to="/marketplace" className="text-white hover:text-primary-blue transition-colors flex items-center gap-2 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden md:inline font-bold text-sm">Voltar</span>
            </Link>
          </div>

          <div className="flex-1 relative hidden md:block">
            <input 
              type="text" 
              placeholder="O que você está procurando hoje?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 text-white border-white/10 border py-2.5 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/30 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsCartOpen(true)} className="relative text-white/80 hover:text-white transition-colors">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 size-5 bg-emerald-500 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-midnight text-white">
                  {cartCount}
                </span>
              )}
            </button>
            {authUser ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:text-white transition-colors group px-2 py-1 rounded-xl hover:bg-white/5"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black tracking-tight text-white">{profile?.full_name?.split(' ')[0] || 'Meu Perfil'}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{authUser.email}</p>
                  </div>
                  <div className="size-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-accent/50 transition-all">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-100 p-2 text-midnight"
                      >
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                          <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-black truncate text-midnight">{profile?.full_name || 'Usuário'}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate">{authUser.email}</p>
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          {profile?.role === 'admin' ? (
                            <Link 
                              to="/admin/dashboard" 
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors text-xs font-bold text-indigo-600"
                            >
                              <ShieldCheck size={16} /> Painel Administrativo
                            </Link>
                          ) : (
                            <>
                              <Link 
                                to="/afiliado/dashboard" 
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600 hover:text-primary-blue"
                              >
                                <LayoutDashboard size={16} /> Painel do Afiliado
                              </Link>
                              <Link 
                                to="/afiliado/perfil" 
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600 hover:text-primary-blue"
                              >
                                <User size={16} /> Meu Perfil
                              </Link>
                              <Link 
                                to="/afiliado/pedidos" 
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600 hover:text-primary-blue"
                              >
                                <ShoppingBag size={16} /> Meus Pedidos
                              </Link>
                            </>
                          )}
                        </div>
                        <div className="p-2 border-t border-slate-100">
                          <button 
                            onClick={async () => {
                              await signOut();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-xs font-black uppercase tracking-wider group"
                          >
                            Sair da conta
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold text-sm">
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} />
                </div>
                Minha Conta
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search - Only visible on small screens */}
        <div className="mt-4 md:hidden">
          <div className="relative group">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..." 
              className="w-full bg-white/10 text-white placeholder-white/50 py-2.5 pl-5 pr-12 rounded-lg focus:outline-none transition-all focus:bg-white focus:text-midnight focus:placeholder-slate-400 border border-white/5"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 text-white/50">
              <Search size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-md z-[100] md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-midnight z-[101] md:hidden p-8 flex flex-col shadow-2xl border-r border-white/5"
            >
              <div className="flex items-center justify-between mb-12">
                <Link to="/" className="flex items-center gap-2 text-white shrink-0">
                  <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                    <LayoutGrid size={18} />
                  </div>
                  <span className="text-xl font-black tracking-tighter uppercase italic">URBA<span className="text-primary-blue">SHOP</span></span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                <Link to="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white transition-all">Marketplace</Link>
                <Link to="/lojista/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white transition-all">Área do Lojista</Link>
              </nav>

              <div className="mt-auto pt-8 border-t border-white/5">
                {authUser ? (
                  <>
                    <div className="flex items-center gap-4 px-4 mb-6">
                      <div className="size-12 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <User size={24} className="text-slate-500 m-auto h-full" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-sm text-white truncate">{profile?.full_name || 'Usuário'}</p>
                        <p className="text-[10px] font-bold text-slate-500 truncate">{authUser.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Link to="/afiliado/pedidos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-xs font-bold text-slate-300">
                        <ShoppingBag size={16} /> Meus Pedidos
                      </Link>
                      <Link to="/afiliado/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-xs font-bold text-slate-300">
                        <User size={16} /> Meu Perfil
                      </Link>
                      <button 
                        onClick={async () => {
                          await signOut();
                          setIsMobileMenuOpen(false);
                        }} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-xs font-black uppercase tracking-widest text-red-400 transition-all mt-4"
                      >
                        <LogOut size={16} /> Sair da Conta
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-4 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs">Entrar</Link>
                    <Link to="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-4 rounded-2xl bg-accent text-midnight font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20">Cadastrar</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-10 flex flex-col md:flex-row gap-10">
        {/* Mobile Filter Toggle */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-primary-blue" />
            <span className="font-black text-midnight uppercase tracking-tighter">Filtros Avançados</span>
          </div>
          <ChevronRight size={20} className={`text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
        </button>

        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0 space-y-10 animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Filter size={18} className="text-primary-blue" />
              <h3 className="font-black text-midnight uppercase tracking-tighter">Filtros Avançados</h3>
            </div>

            <div className="space-y-8">
              {/* Categories */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categorias</h4>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedCategory('Todos')}
                    className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === 'Todos' ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.name ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Preço Máximo: R$ {priceRange}</h4>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="50"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full account-slider accent-primary-blue"
                />
                <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400">
                  <span>R$ 0</span>
                  <span>R$ 5.000+</span>
                </div>
              </div>

              {/* Badges */}
              <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-3 text-emerald-600">
                  <TrendingUp size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Garantia Cashback</span>
                </div>
                <p className="text-[11px] text-emerald-700/70 leading-relaxed font-medium">
                  Todos os produtos desta loja garantem cashback real via Pix direto no seu checkout.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Active Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-sm font-bold text-slate-400 mr-2">{filteredProducts.length} itens encontrados</span>
            {selectedCategory !== 'Todos' && (
              <button 
                onClick={() => setSelectedCategory('Todos')}
                className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black text-midnight flex items-center gap-2 hover:border-red-500 transition-colors uppercase"
              >
                {selectedCategory} <X size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-[2rem] border border-slate-100 h-[400px] animate-pulse">
                    <div className="aspect-square bg-slate-50"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-slate-50 w-1/2"></div>
                      <div className="h-8 bg-slate-50 w-full"></div>
                      <div className="h-10 bg-slate-50 w-full mt-auto"></div>
                    </div>
                  </div>
                ))
              ) : filteredProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-midnight border border-white/50">
                        {p.condition}
                      </div>
                      {p.stock === 0 && (
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">
                          Esgotado
                        </div>
                      )}
                    </div>
                    {p.image.length > 4 ? (
                      <img src={p.image} alt={p.name} className={`w-full h-full object-cover ${p.stock === 0 ? 'grayscale opacity-70' : ''}`} />
                    ) : (
                      <span className="text-7xl">{p.image}</span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (p.stock > 0) addToCart(p);
                      }}
                      disabled={p.stock === 0}
                      title={p.stock > 0 ? "Adicionar ao carrinho" : "Esgotado"}
                      className={`absolute bottom-4 right-4 size-12 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl z-10 ${
                        p.stock > 0 ? 'bg-midnight hover:bg-primary-blue' : 'bg-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {p.stock > 0 ? <Plus size={24} /> : <X size={24} />}
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span className="text-xs font-black text-midnight">{p.rating.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">({p.reviews_count || 0})</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sales} vendidos</span>
                    </div>

                    <h4 className="text-sm font-black text-midnight mb-1 line-clamp-2 min-h-[2.5rem] tracking-tight">{p.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{p.category}</p>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-black text-midnight tracking-tighter">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {(() => {
                          const pMensal = Number(mmnConfig?.cashbackMensal || 2.75);
                          const pDigital = Number(mmnConfig?.cashbackDigital || 1.0);
                          const pAnual = Number(mmnConfig?.cashbackAnual || 0.75);
                          const totalRatios = pMensal + pDigital + pAnual || 4.5;
                          
                          // Ganho do usuário (G1) direto sobre o valor do produto
                          const userShare = p.price * (g1Value / 100);
                          
                          const mensal = userShare * (pMensal / totalRatios);
                          const digital = userShare * (pDigital / totalRatios);
                          const anual = userShare * (pAnual / totalRatios);
                          
                          return (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp size={10} /> Mensal: R$ {mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                <Smartphone size={10} /> Digital: R$ {digital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                <Calendar size={10} /> Anual: R$ {anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <Link to={`/produto/${p.id}`} className="size-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-primary-blue transition-colors">
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-32 text-center">
              <div className="size-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-midnight mb-2">Nenhum produto encontrado</h3>
              <p className="text-slate-400 text-sm font-medium">Tente ajustar seus filtros ou buscar por outro termo.</p>
              <button 
                onClick={() => {setSearch(''); setSelectedCategory('Todos'); setPriceRange(1000);}}
                className="mt-8 text-primary-blue font-black text-xs uppercase tracking-widest hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Cart Drawer Overlay (Reused from Marketplace for consistency) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-midnight text-white rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-midnight uppercase tracking-tighter">Meu Carrinho</h3>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{cartCount} items selecionados</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="size-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length > 0 ? (
                  cartItems.map(item => (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <div className="size-20 bg-white rounded-xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
                        {item.image.length > 4 ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">{item.image}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-midnight mb-1 truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{item.category}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-sm font-black text-midnight">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="size-6 text-slate-400"><Minus size={14} /></button>
                            <span className="text-xs font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="size-6 text-midnight"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                      <ShoppingBag size={48} />
                    </div>
                    <h4 className="text-lg font-black text-midnight mb-2">Seu carrinho está vazio</h4>
                    <p className="text-slate-400 text-sm font-medium px-10">Explore nossa loja e encontre os melhores produtos com cashback real.</p>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-slate-500 font-medium font-bold uppercase tracking-widest text-[10px]">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Seu Retorno:</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-600">Mensal</span>
                        <span className="text-xs font-black text-emerald-600">+ R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-600">Digital</span>
                        <span className="text-xs font-black text-blue-600">+ R$ {totalDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-600">Anual</span>
                        <span className="text-xs font-black text-indigo-600">+ R$ {totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                      <span className="text-xl font-black text-midnight uppercase tracking-tighter">Total</span>
                      <span className="text-2xl font-black text-midnight tracking-tighter">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/checkout')} className="w-full bg-midnight text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:bg-slate-800 uppercase tracking-tighter">
                    Finalizar Pedido
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
