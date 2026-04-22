import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  TrendingUp,
  Minus,
  Plus,
  ChevronRight,
  Heart,
  Share2,
  Package,
  Award,
  ShoppingBag,
  LayoutGrid,
  Search,
  Bell,
  User,
  MessageSquare,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  main_image: string;
  gallery: string[];
  cashback: number;
  sales: number;
  stock: number;
  condition: string;
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Oferta Relâmpago!", message: "Fones de ouvido com 30% de cashback hoje.", time: "5 min ago", read: false },
    { id: 2, title: "Sua compra chegou", message: "O pedido #1234 foi entregue com sucesso.", time: "2 horas ago", read: true },
    { id: 3, title: "Novo Lojista", message: "A loja 'Urban Sports' agora faz parte da rede.", time: "1 dia ago", read: true },
  ]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const { user: authUser, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [cartItems, setCartItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('urbashop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('urbashop_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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

  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  const totalCashback = cartItems.reduce((acc, item) => {
    return acc + (item.price * (item.cashback / 100) * item.quantity);
  }, 0);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, description, category, image, main_image, gallery, cashback, sales, stock, category_id')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Fetch category name if category_id exists
        let categoryName = data.category || 'Geral';
        if (data.category_id) {
          const { data: catData } = await supabase
            .from('categories')
            .select('name')
            .eq('id', data.category_id)
            .maybeSingle();
          if (catData) categoryName = catData.name;
        }

        // Ensure numeric types
        const formattedProduct = {
          ...data,
          price: Number(data.price) || 0,
          cashback: Number(data.cashback) || 5,
          sales: Number(data.sales) || 0,
          stock: Number(data.stock) || 0,
          category: categoryName,
          image: data.image || '📦',
          gallery: data.gallery || []
        };
        
        setProduct(formattedProduct);

        // Fetch Reviews
        try {
          console.log('Fetching reviews for product:', id);
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: false });
            
          if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
            throw reviewsError;
          }
          
          console.log('Reviews loaded:', reviewsData?.length || 0);
          if (reviewsData) setReviews(reviewsData);
        } catch (e) {
          console.error("Reviews fetch failed:", e);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Produto não encontrado');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin size-12 border-4 border-midnight border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) return null;

  const mainImg = product.main_image || product.image || '📦';
  const images = [mainImg, ...(product.gallery || [])].filter(Boolean);
  const cashbackAmount = (product.price * (product.cashback / 100));

  const handleBuy = () => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });

    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`, { icon: '🛒' });
    setIsCartOpen(true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast.error('Você precisa estar logado para avaliar.');
      return;
    }
    if (!newReviewComment.trim()) {
      toast.error('O comentário não pode estar vazio.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      
      const userName = profile?.full_name || authUser.email?.split('@')[0] || 'Usuário';

      console.log('Submitting review as:', userName, 'User ID:', authUser.id);

      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: id,
          user_id: authUser.id,
          user_name: userName,
          rating: newReviewRating,
          comment: newReviewComment
        })
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        throw error;
      }

      setReviews([data, ...reviews]);
      setNewReviewComment('');
      setNewReviewRating(5);
      toast.success('Avaliação enviada com sucesso!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(`Erro: ${error.message || 'Falha ao enviar avaliação'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Marketplace Custom Header */}
      <header className="bg-midnight py-4 px-6 lg:px-20 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white shrink-0">
            <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
              <LayoutGrid size={18} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">UrbaShop</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 relative group max-w-2xl">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  navigate(`/marketplace?search=${encodeURIComponent(search)}`);
                }
              }}
              placeholder="Buscar produtos, marcas e muito mais..." 
              className="w-full bg-white text-midnight py-2.5 pl-5 pr-12 rounded-lg focus:outline-none shadow-lg transition-all focus:ring-2 focus:ring-primary-blue/20"
            />
            <button 
              onClick={() => {
                if (search.trim()) navigate(`/marketplace?search=${encodeURIComponent(search)}`);
              }}
              className="absolute right-0 top-0 bottom-0 px-4 text-slate-400 hover:text-primary-blue transition-colors border-l border-slate-100"
            >
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
                  className="flex items-center gap-2 hover:text-primary-blue transition-colors group"
                >
                  <div className="size-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5 transition-all group-hover:bg-white/20">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <span className="text-sm font-bold hidden md:inline tracking-tight text-white">
                    {profile?.full_name?.split(' ')[0] || 'Meu Perfil'}
                  </span>
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
                          <Link 
                            to="/afiliado/perfil" 
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600 hover:text-primary-blue"
                          >
                            <User size={16} /> Meu Perfil
                          </Link>
                          <Link 
                            to="/afiliado/pedidos" 
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600 hover:text-primary-blue"
                          >
                            <ShoppingBag size={16} /> Meus Pedidos
                          </Link>
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
      </header>

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
                    <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Cashback Acumulado</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">+ R$ {totalCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

      <main className="max-w-7xl mx-auto px-6 lg:px-20 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Gallery Section */}
          <div className="space-y-6">
            <motion.div 
              layoutId="product-image"
              className="aspect-square bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl flex items-center justify-center group relative"
            >
              {images[activeImage]?.length > 4 ? (
                <img 
                  src={images[activeImage]} 
                  alt={product.name}
                  className="w-full h-full object-contain p-12 group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <span className="text-[12rem]">{images[activeImage]}</span>
              )}
              
              <div className="absolute top-8 left-8 bg-midnight/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-midnight/5 flex items-center gap-2">
                <Award size={16} className="text-midnight" />
                <span className="text-xs font-black text-midnight uppercase tracking-widest">Premium Quality</span>
              </div>
            </motion.div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`size-24 rounded-3xl border-2 transition-all flex-shrink-0 flex items-center justify-center overflow-hidden bg-white ${activeImage === idx ? 'border-midnight shadow-lg' : 'border-transparent hover:border-slate-200'}`}
                  >
                    {img.length > 4 ? (
                      <img src={img} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{img}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-midnight/5 text-midnight rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-midnight/5">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                <Star size={12} className="fill-orange-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">{avgRating} ({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-midnight leading-[1.1] mb-6 tracking-tighter">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-10">
              <p className="text-4xl font-black text-midnight tracking-tighter">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cashback Real</p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp size={16} />
                  <span className="text-sm font-black">R$ {cashbackAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-10 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-midnight uppercase text-xs tracking-widest">Descrição do Produto</h3>
              <p className="text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
                {product.description || 'Nenhuma descrição disponível para este produto. Este item faz parte da nossa curadoria exclusiva de serviços e produtos urbanos com cashback garantido.'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-2 gap-4 shadow-sm">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={product.stock === 0}
                    className="size-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-lg font-black text-midnight min-w-[1.5rem] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={product.stock === 0 || quantity >= product.stock}
                    className="size-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-midnight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <button 
                  onClick={product.stock > 0 ? handleBuy : undefined}
                  disabled={product.stock === 0}
                  className={`flex-1 text-white h-16 rounded-[1.5rem] font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 group ${
                    product.stock > 0 
                    ? 'bg-midnight hover:bg-slate-800 shadow-midnight/20 active:scale-[0.98]' 
                    : 'bg-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShoppingBag size={22} className={product.stock > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                  {product.stock > 0 ? 'ADICIONAR AO CARRINHO' : 'ESGOTADO'}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Truck className="text-midnight" size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-midnight">Frete Grátis</p>
                    <p className="text-[9px] font-bold text-slate-400">Em compras acima de R$ 250</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <ShieldCheck className="text-midnight" size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-midnight">Compra Segura</p>
                    <p className="text-[9px] font-bold text-slate-400">Garantia total de 30 dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features / Details Grid */}
        <section className="mt-24">
          <h2 className="text-2xl font-black text-midnight tracking-tighter mb-10 uppercase">Especificações Técnicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Package size={24} />, label: "Status do Estoque", value: product.stock > 0 ? `${product.stock} unidades` : 'Sob consulta' },
              { icon: <Award size={24} />, label: "Garantia", value: "12 meses oficial" },
              { icon: <Star size={24} />, label: "Vendas na Rede", value: `${product.sales} unidades` },
              { icon: <TrendingUp size={24} />, label: "MMN Status", value: "Elegível para comissão" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-midnight mb-4">{item.icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-black text-midnight">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-midnight tracking-tighter uppercase">Avaliações</h2>
            <div className="flex items-center gap-2">
              <Star size={24} className="text-orange-500 fill-orange-500" />
              <span className="text-2xl font-black text-midnight">{avgRating}</span>
              <span className="text-sm font-bold text-slate-400">({reviews.length} avaliações)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-32">
                <h3 className="font-black text-midnight uppercase text-sm tracking-widest mb-6">Sua Avaliação</h3>
                {authUser && profile ? (
                  <form onSubmit={submitReview} className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nota</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star 
                              size={28} 
                              className={star <= newReviewRating ? "text-orange-500 fill-orange-500" : "text-slate-200"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Comentário</label>
                      <textarea 
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="O que você achou deste produto?"
                        maxLength={1000}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 resize-none h-32"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-midnight text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Enviando...' : (
                        <>Enviar Avaliação <MessageSquare size={16} /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                      <User size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-4">Faça login para avaliar este produto.</p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="bg-primary-blue text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors"
                    >
                      Fazer Login
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex gap-6">
                    <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-midnight font-black uppercase shrink-0">
                      {review.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-midnight">{review.user_name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < review.rating ? "text-orange-500 fill-orange-500" : "text-slate-200"} 
                          />
                        ))}
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                  <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-lg font-black text-midnight mb-2">Nenhuma avaliação ainda</h3>
                  <p className="text-slate-400 text-sm font-medium">Seja o primeiro a avaliar este produto!</p>
                </div>
              )}
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
            <p className="text-slate-600">© 2026 Ecossistema Serviços Urbanos Tecnologia</p>
            <div className="flex gap-8">
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><Package size={12} /> Rastreio</span>
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><TrendingUp size={12} /> Investimentos</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Footer / CTA Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 z-50 flex items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
          <p className="text-xl font-black text-midnight tracking-tighter">
            R$ {(product.price * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button 
          onClick={product.stock > 0 ? handleBuy : undefined}
          disabled={product.stock === 0}
          className={`px-8 h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-transform ${
            product.stock > 0 
            ? 'bg-midnight text-white active:scale-95' 
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? (
            <>Comprar <ChevronRight size={16} /></>
          ) : (
            'Esgotado'
          )}
        </button>
      </div>
    </div>
  );
}
