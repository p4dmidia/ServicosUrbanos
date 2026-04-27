import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutGrid, 
  Search, 
  ShoppingCart, 
  Bell, 
  User, 
  Tag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Package,
  CreditCard,
  ChevronRight,
  Star,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  ShoppingBag,
  Menu,
  LogOut,
  LayoutDashboard,
  Store,
  Smartphone,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';

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
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ fullName: '', email: '', phone: '', businessName: '' });
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user: authUser, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Oferta Relâmpago!", message: "Fones de ouvido com 30% de cashback hoje.", time: "5 min ago", read: false },
    { id: 2, title: "Sua compra chegou", message: "O pedido #1234 foi entregue com sucesso.", time: "2 horas ago", read: true },
    { id: 3, title: "Novo Lojista", message: "A loja 'Urban Sports' agora faz parte da rede.", time: "1 dia ago", read: true },
  ]);
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
          .select(`
            id, 
            name, 
            price, 
            image, 
            main_image,
            cashback,
            category_id,
            stock,
            sales,
            product_reviews(rating)
          `)
          .eq('status', 'Ativo');

        if (prodError) throw prodError;

        // Map database products to UI interface
        const formattedProducts: Product[] = (prodData || []).map(p => {
          const price = Number(p.price) || 0;
          // Map category name from the categories table using category_id
          const categoryFromTable = baseCategories.find(c => c.id === p.category_id);
          const categoryName = categoryFromTable?.name || p.category || 'Geral';
          
          return {
            id: p.id,
            name: p.name || 'Produto sem nome',
            price: price,
            image: p.main_image || p.image || '📦',
            rating: p.product_reviews?.length > 0 
              ? p.product_reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / p.product_reviews.length 
              : 5.0,
            reviews_count: p.product_reviews?.length || 0,
            sales: Number(p.sales) || 0,
            category: categoryName,
            cashback: Number(p.cashback) || 5,
            stock: Number(p.stock) || 0
          };
        });

        // Use ONLY categories from the categories table for the filter bar
        // This avoids duplicates from old text fields in products
        // Fetch MMN Config
        const mmn = await businessRules.getMMNConfig();
        const levels = await businessRules.getMMNLevels();
        setMmnConfig(mmn);
        const g1 = levels.find(l => l.level === 1);
        if (g1) setG1Value(g1.value);
        
        setCategories(baseCategories.filter(c => !(c as any).parent_id)); // Only show top-level categories
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productName = product.name?.toLowerCase() || '';
      const productCategory = product.category?.toLowerCase() || '';
      const searchLower = search.toLowerCase();
      
      const matchesSearch = productName.includes(searchLower) ||
                          productCategory.includes(searchLower);
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory, products]);

  // Cart Logic
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
  
  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistForm.fullName || !waitlistForm.email || !waitlistForm.phone) return;

    setIsSubmittingWaitlist(true);
    try {
      const { error } = await supabase.from('merchant_waitlist').insert({
        full_name: waitlistForm.fullName,
        email: waitlistForm.email,
        phone: waitlistForm.phone,
        business_name: waitlistForm.businessName
      });

      if (error) throw error;
      setWaitlistSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao entrar na lista de espera. Tente novamente.');
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const totalCashback = cartItems.reduce((acc, item) => {
    return acc + (item.price * (item.cashback / 100) * item.quantity);
  }, 0);

  const pMensal = Number(mmnConfig?.cashbackMensal || 2.75);
  const pDigital = Number(mmnConfig?.cashbackDigital || 1.0);
  const pAnual = Number(mmnConfig?.cashbackAnual || 0.75);
  const totalRatios = pMensal + pDigital + pAnual || 4.5;

  // Ganho total do usuário (G1) sobre os itens no carrinho
  const userTotalCashback = cartItems.reduce((acc, item) => {
    // Lógica correta: Preço * (G1 / 100)
    return acc + (item.price * (g1Value / 100) * item.quantity);
  }, 0);

  const totalMensal = userTotalCashback * (pMensal / totalRatios);
  const totalDigital = userTotalCashback * (pDigital / totalRatios);
  const totalAnual = userTotalCashback * (pAnual / totalRatios);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans flex flex-col overflow-x-hidden">
      {/* Marketplace Custom Header */}
      <header className="bg-midnight py-4 md:py-6 px-6 lg:px-20 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden size-10 flex items-center justify-center bg-white/5 rounded-xl text-white"
            >
              <Menu size={20} />
            </button>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-white shrink-0">
              <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                <LayoutGrid size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">URBA<span className="text-primary-blue">SHOP</span></span>
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile, visible on md+ */}
          <div className="flex-1 relative group max-w-2xl hidden md:block">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos, marcas e muito mais..." 
              className="w-full bg-white text-midnight py-2.5 pl-5 pr-12 rounded-lg focus:outline-none shadow-lg transition-all focus:ring-2 focus:ring-primary-blue/20"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 text-slate-400 hover:text-primary-blue transition-colors border-l border-slate-100">
              <Search size={20} />
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-6 text-white/80 shrink-0 relative">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`hover:text-primary-blue transition-colors relative p-1 ${showNotifications ? 'text-primary-blue' : ''}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 bg-orange-500 rounded-full border-2 border-midnight text-[8px] font-black flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                    <motion.div 
                      key="notifications-panel"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-100"
                    >
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-midnight font-black text-xs uppercase tracking-wider">Notificações</h3>
                        <button onClick={markAllAsRead} className="text-[10px] font-black text-primary-blue hover:underline uppercase">Marcar lidas</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                              <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${!n.read ? 'bg-primary-blue/10 text-primary-blue' : 'bg-slate-100 text-slate-400'}`}>
                                <Bell size={18} />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-midnight mb-0.5">{n.title}</p>
                                <p className="text-[11px] text-slate-500 leading-tight mb-2">{n.message}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.time}</span>
                              </div>
                              {!n.read && <div className="size-2 bg-orange-500 rounded-full mt-1"></div>}
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center text-slate-400">Nenhuma notificação por enquanto.</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Icon */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="hover:text-primary-blue transition-colors p-1 relative"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 bg-emerald-500 rounded-full border-2 border-midnight text-[8px] font-black flex items-center justify-center text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <Link to="/lojista/login" className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Área do Lojista</span>
            </Link>

            {authUser ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:text-primary-blue transition-colors group px-2 py-1 rounded-xl hover:bg-white/5"
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
              <Link to="/login" className="flex items-center gap-2 hover:text-primary-blue transition-colors group">
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5 transition-all group-hover:bg-white/20">
                  <User size={18} />
                </div>
                <span className="text-sm font-bold hidden md:inline tracking-tight text-white">Fazer Login</span>
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
                <Link to="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                  <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                    <LayoutGrid size={18} />
                  </div>
                  <span className="text-xl font-black tracking-tighter uppercase italic text-white">URBA<span className="text-primary-blue">SHOP</span></span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                <Link to="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-accent bg-white/10">Marketplace</Link>
                <Link to="/lojista/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white transition-all flex items-center gap-3">
                  <Store size={18} /> Área do Lojista
                </Link>
                <Link to="/afiliado/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white transition-all flex items-center gap-3">
                  <LayoutDashboard size={18} /> Escritório Virtual
                </Link>
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
                    <Link to="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-4 rounded-2xl bg-primary-blue text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-blue/20">Cadastrar</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer Overlay */}
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
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{item.image}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-midnight mb-1 truncate">{item.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">{item.category}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-sm font-black text-midnight">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="size-6 rounded-lg hover:bg-slate-50 flex items-center justify-center lg:transition-colors text-slate-400"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="size-6 rounded-lg hover:bg-slate-50 flex items-center justify-center lg:transition-colors text-midnight"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="size-8 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
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
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-8 text-primary-blue font-black text-xs uppercase tracking-widest hover:underline"
                    >
                      Começar a comprar
                    </button>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-slate-500 font-medium">
                      <span className="text-sm tracking-tight">Subtotal</span>
                      <span className="text-sm font-bold text-midnight">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Seu Retorno:</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-600">Mensal</span>
                        <span className="text-xs font-black text-emerald-600">+ R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-600">Digital</span>
                        <span className="text-xs font-black text-blue-600">+ R$ {totalDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-600">Anual</span>
                        <span className="text-xs font-black text-indigo-600">+ R$ {totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                      <span className="text-lg font-black text-midnight tracking-tighter uppercase">Total</span>
                      <span className="text-2xl font-black text-midnight tracking-tighter">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/checkout')} className="w-full bg-midnight hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-midnight/20 active:scale-[0.98] uppercase tracking-tighter">
                    Finalizar Pedido
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck size={12} /> Compra 100% segura e garantida
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlist && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-midnight/80 backdrop-blur-md"
              onClick={() => setShowWaitlist(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 lg:p-16 max-w-2xl w-full shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setShowWaitlist(false)}
                  className="size-12 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="size-24 bg-primary-blue/10 rounded-3xl flex items-center justify-center text-primary-blue mx-auto mb-8">
                <TrendingUp size={48} />
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-black text-midnight mb-6 tracking-tighter uppercase">Em Breve: <span className="text-primary-blue italic">Marketplace para Todos</span></h3>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                Atualmente, nossa plataforma está aberta exclusivamente para curadoria interna. Em breve, permitiremos que novos lojistas parceiros exponham seus produtos para milhares de clientes.
              </p>
              
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left mb-10">
                <h4 className="text-xs font-black text-midnight uppercase tracking-widest mb-4">Entre na Lista de Prioridade</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="email" 
                    placeholder="Seu e-mail profissional" 
                    className="flex-1 bg-white border border-slate-200 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 font-bold"
                  />
                  <button className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Quero Ser Avisado
                  </button>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Já é um parceiro convidado? <Link to="/lojista/login" className="text-primary-blue hover:underline">Acesse seu painel</Link>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-8">
        {/* Main Banner */}
        <section className="mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-r from-primary-blue to-midnight rounded-[2rem] p-10 lg:p-16 overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
              <div className="absolute top-10 right-10 size-40 bg-white/10 rounded-3xl rotate-12"></div>
              <div className="absolute bottom-10 right-40 size-32 bg-white/5 rounded-3xl -rotate-12"></div>
            </div>
            
            <div className="max-w-lg relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-orange-500/20">
                  Exclusivo UrbaShop
                </span>
                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                  Retirada Grátis
                </span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tighter italic">
                Sua cidade em um só clique.
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Segurança total com cashback em todas as compras. O único marketplace que te devolve dinheiro real via Pix.
              </p>
              <Link to="/loja" className="inline-flex bg-white text-midnight px-10 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all items-center gap-3 shadow-xl active:scale-95 group">
                Explorar Ofertas <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
          <button 
            onClick={() => setSelectedCategory('Todos')}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === 'Todos' ? 'bg-midnight text-white border-midnight' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat.name ? 'bg-midnight text-white border-midnight' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Link to="/loja" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer">
            <div>
              <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Seleção Especial</p>
              <h3 className="text-2xl font-black text-midnight mb-4 tracking-tighter">Ver Ofertas do Dia</h3>
              <p className="text-slate-500 text-sm font-medium">Os melhores preços com cashback dobrado.</p>
            </div>
            <div className="size-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:-rotate-12 shadow-sm">
              <Tag size={32} />
            </div>
          </Link>

          <div 
            onClick={() => setShowWaitlist(true)}
            className="bg-midnight p-8 rounded-[2rem] shadow-xl flex items-center justify-center text-center relative overflow-hidden group cursor-pointer border border-white/5"
          >
            <div className="absolute inset-0 bg-primary-blue/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic"><span className="text-primary-blue">Lista de Espera:</span> Venda aqui</h3>
              <p className="text-slate-400 text-sm mb-6 font-medium">Cadastre-se para ser um dos primeiros lojistas da rede.</p>
              <button className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-widest shadow-xl shadow-primary-blue/20">
                Entrar na Lista
              </button>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-black text-midnight uppercase tracking-tighter border-l-4 border-emerald-500 pl-4 italic">
              {search || selectedCategory !== 'Todos' ? `${filteredProducts.length} Achados em "${search || selectedCategory}"` : 'Recomendados para você'}
            </h2>
            <Link to="/loja" className="text-primary-blue font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-1 group">
              Ver tudo <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[450px] animate-pulse">
                  <div className="aspect-square bg-slate-100 rounded-[2rem] mb-6"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-slate-100 rounded w-full mb-4"></div>
                  <div className="mt-auto h-12 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link 
                  to={`/produto/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 block"
                >
                  <div className="aspect-square bg-slate-50 rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                    {product.stock === 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10 shadow-lg">
                        Esgotado
                      </div>
                    )}
                    {product.image.length > 4 ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${product.stock === 0 ? 'grayscale opacity-70' : ''}`}
                      />
                    ) : (
                      <span className="text-6xl drop-shadow-2xl transition-transform group-hover:scale-110 relative z-10">{product.image}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(() => {
                          const pMensal = Number(mmnConfig?.cashbackMensal || 2.75);
                          const pDigital = Number(mmnConfig?.cashbackDigital || 1.0);
                          const pAnual = Number(mmnConfig?.cashbackAnual || 0.75);
                          const totalRatios = pMensal + pDigital + pAnual || 4.5;
                          
                          // Ganho do usuário (G1) direto sobre o valor do produto
                          const userShare = product.price * (g1Value / 100);
                          
                          const mensal = userShare * (pMensal / totalRatios);
                          const digital = userShare * (pDigital / totalRatios);
                          const anual = userShare * (pAnual / totalRatios);
                          
                          return (
                            <>
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-tight border border-emerald-100 flex items-center gap-1 shadow-sm">
                                <TrendingUp size={8} />
                                Mensal ({pMensal}%): R$ {mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-tight border border-blue-100 flex items-center gap-1 shadow-sm">
                                <Smartphone size={8} />
                                Digital ({pDigital}%): R$ {digital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-tight border border-indigo-100 flex items-center gap-1 shadow-sm">
                                <Calendar size={8} />
                                Anual ({pAnual}%): R$ {anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                    </div>
                    <h4 className="text-slate-800 font-black mb-2 line-clamp-2 min-h-[48px] text-lg leading-tight tracking-tight">{product.name}</h4>
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="text-yellow-400 fill-yellow-400" size={14} />
                      <span className="text-xs font-black text-midnight">{product.rating.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">({product.reviews_count || 0})</span>
                      <span className="text-slate-300 mx-1">|</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sales} vendidos</span>
                    </div>
                    <div className="mt-auto">
                      <div className="mb-4">
                        <p className="text-2xl font-black text-midnight leading-none mb-1 tracking-tighter">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product.stock > 0) addToCart(product);
                        }}
                        disabled={product.stock === 0}
                        className={`w-full text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg group/btn overflow-hidden relative ${
                          product.stock > 0 
                          ? 'bg-midnight hover:bg-slate-800' 
                          : 'bg-slate-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        {product.stock > 0 && (
                          <motion.div 
                            className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 skew-x-12"
                          />
                        )}
                        <div className="size-6 bg-white/10 rounded-lg flex items-center justify-center transition-all group-hover/btn:scale-110 group-hover/btn:bg-white/20">
                          {product.stock > 0 ? <Plus size={16} /> : <X size={16} />}
                        </div>
                        {product.stock > 0 ? 'Adicionar ao Carrinho' : 'ESGOTADO'}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-inner">
              <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
                <Search size={48} />
              </div>
              <h3 className="text-2xl font-black text-midnight mb-2 tracking-tighter uppercase">Nenhum tesouro encontrado</h3>
              <p className="text-slate-400 font-medium max-w-sm mx-auto">Tente ajustar seus filtros ou buscar por algo diferente no nosso ecossistema.</p>
              <button onClick={() => setSearch('')} className="mt-10 px-8 py-3 bg-midnight text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-midnight/20">Limpar filtros</button>
            </div>
          )}
        </section>

        {/* Seção de Confiança */}
        <section className="bg-white rounded-[3rem] p-12 lg:p-16 border border-slate-100 shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary-blue"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <div className="flex flex-col items-center">
              <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-primary-blue mb-8 shadow-sm">
                <CreditCard size={36} />
              </div>
              <h5 className="font-black text-midnight mb-3 uppercase tracking-tighter text-lg">Pague com Liberdade</h5>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[220px]">Pix Instantâneo ou parcelado em até 12x no cartão com segurança total.</p>
            </div>

            <div className="flex flex-col items-center border-x border-slate-100 px-6">
              <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-orange-500 mb-8 shadow-sm">
                <Truck size={36} />
              </div>
              <h5 className="font-black text-midnight mb-3 uppercase tracking-tighter text-lg">Entrega Inteligente</h5>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[220px]">Sua compra chega voando através da nossa malha logística integrada ao UrbaFood.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-8 shadow-sm">
                <ShieldCheck size={36} />
              </div>
              <h5 className="font-black text-midnight mb-3 uppercase tracking-tighter text-lg">Garantia UrbaShop</h5>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[220px]">Cada centavo do seu cashback é garantido. Transações monitoradas 24h por IA.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Simplified Marketplace Footer */}
      <footer className="bg-midnight py-16 px-6 lg:px-20 text-slate-500 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 pb-12 border-b border-slate-800/50">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2 text-white">
                <div className="size-8 bg-primary-blue rounded flex items-center justify-center transform -rotate-12 shadow-lg shadow-primary-blue/30">
                  <LayoutGrid size={18} />
                </div>
                <span className="text-2xl font-black lowercase tracking-tighter italic">Urba<span className="text-primary-blue">Shop</span></span>
              </div>
              <p className="text-xs font-medium text-slate-500 max-w-[240px] text-center md:text-left leading-relaxed">O shopping que valoriza seu dinheiro através da economia compartilhada.</p>
            </div>
            
            <div className="flex gap-12">
              <div className="text-center md:text-left">
                <h6 className="text-white text-xs font-black uppercase tracking-widest mb-6">Marketplace</h6>
                <ul className="space-y-4 text-[10px] font-black uppercase tracking-tighter">
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Ofertas</a></li>
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Lojistas</a></li>
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Cashback</a></li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <h6 className="text-white text-xs font-black uppercase tracking-widest mb-6">Suporte</h6>
                <ul className="space-y-4 text-[10px] font-black uppercase tracking-tighter">
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Ajuda</a></li>
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Segurança</a></li>
                  <li><a href="#" className="hover:text-primary-blue transition-colors">Termos</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-slate-600">© 2026 Ecossistema Serviços Urbanos Tecnologia</p>
              <p className="text-slate-700 opacity-50 lowercase font-medium tracking-normal">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">P4D Mídia</a></p>
            </div>
            <div className="flex gap-8">
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><Package size={12} /> Rastreio</span>
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><TrendingUp size={12} /> Investimentos</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlist && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowWaitlist(false); setWaitlistSuccess(false); }}
              className="absolute inset-0 bg-midnight/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <button 
                  onClick={() => { setShowWaitlist(false); setWaitlistSuccess(false); }}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full"
                >
                  <X size={20} />
                </button>

                {waitlistSuccess ? (
                  <div className="text-center py-12">
                    <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-midnight mb-2">Tudo Certo!</h3>
                    <p className="text-slate-500 mb-8">Você está na nossa lista VIP. Avisaremos via WhatsApp ou E-mail assim que as vagas para novos lojistas abrirem.</p>
                    <button 
                      onClick={() => { setShowWaitlist(false); setWaitlistSuccess(false); }}
                      className="bg-midnight text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Voltar ao Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-midnight mb-2 tracking-tighter uppercase italic"><span className="text-primary-blue">Lista de Espera:</span> Venda aqui</h3>
                    <p className="text-slate-500 text-sm mb-8 font-medium">Cadastre-se para ser um dos primeiros lojistas e vender para milhares de usuários ativos no nosso ecossistema.</p>
                    
                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome Completo *</label>
                        <input 
                          type="text" 
                          required
                          value={waitlistForm.fullName}
                          onChange={e => setWaitlistForm({...waitlistForm, fullName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">E-mail *</label>
                          <input 
                            type="email" 
                            required
                            value={waitlistForm.email}
                            onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">WhatsApp *</label>
                          <input 
                            type="tel" 
                            required
                            value={waitlistForm.phone}
                            onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome da Loja/Negócio</label>
                        <input 
                          type="text" 
                          value={waitlistForm.businessName}
                          onChange={e => setWaitlistForm({...waitlistForm, businessName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                          placeholder="Sua loja (opcional)"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmittingWaitlist}
                        className="w-full bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black transition-all text-xs uppercase tracking-widest shadow-xl shadow-primary-blue/20 mt-4 disabled:opacity-50"
                      >
                        {isSubmittingWaitlist ? 'Enviando...' : 'Entrar na Lista VIP'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
