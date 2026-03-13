import React, { useState, useMemo } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: string;
  installments: string;
  image: string;
  rating: number;
  sales: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Oferta Relâmpago!", message: "Fones de ouvido com 30% de cashback hoje.", time: "5 min ago", read: false },
    { id: 2, title: "Sua compra chegou", message: "O pedido #1234 foi entregue com sucesso.", time: "2 horas ago", read: true },
    { id: 3, title: "Novo Lojista", message: "A loja 'Urban Sports' agora faz parte da rede.", time: "1 dia ago", read: true },
  ]);

  const products: Product[] = [
    {
      id: 1,
      name: "Fone de Ouvido Noise Cancelling Pro",
      price: "199,90",
      installments: "12x R$ 16,65 sem juros",
      image: "🎧",
      rating: 4.8,
      sales: "1.2k vendidos",
      category: "Eletrônicos"
    },
    {
      id: 2,
      name: "Smartwatch Urban Fit G2",
      price: "349,00",
      installments: "10x R$ 34,90 sem juros",
      image: "⌚",
      rating: 4.9,
      sales: "800 vendidos",
      category: "Wearables"
    },
    {
      id: 3,
      name: "Tênis Street Walker Original",
      price: "279,50",
      installments: "12x R$ 23,29 sem juros",
      image: "👟",
      rating: 4.7,
      sales: "2.5k vendidos",
      category: "Calçados"
    },
    {
      id: 4,
      name: "Mochila Tech Pro Impermeável",
      price: "159,00",
      installments: "6x R$ 26,50 sem juros",
      image: "🎒",
      rating: 4.6,
      sales: "500 vendidos",
      category: "Acessórios"
    }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                          product.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

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

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const subtotal = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.price.replace(',', '.'));
    return acc + (price * item.quantity);
  }, 0);

  const totalCashback = subtotal * 0.05; // Mock 5% cashback

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans flex flex-col overflow-x-hidden">
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

            <Link to="/login" className="flex items-center gap-2 hover:text-primary-blue transition-colors group">
              <div className="size-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5 transition-all group-hover:bg-white/20">
                <User size={18} />
              </div>
              <span className="text-sm font-bold hidden md:inline tracking-tight">Meu Perfil</span>
            </Link>
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
                      <div className="size-20 bg-white rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-sm">
                        {item.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-midnight mb-1 truncate">{item.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">{item.category}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-sm font-black text-midnight">R$ {item.price}</p>
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
                      <span className="text-sm font-bold text-midnight">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Cashback Acumulado</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">+ R$ {totalCashback.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                      <span className="text-lg font-black text-midnight tracking-tighter uppercase">Total</span>
                      <span className="text-2xl font-black text-midnight tracking-tighter">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <button className="w-full bg-midnight hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-midnight/20 active:scale-[0.98] uppercase tracking-tighter">
                    Finalizar Compra
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
                  Entrega Grátis
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

        {/* Categories Bar */}
        <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
          {['Todos', 'Eletrônicos', 'Wearables', 'Calçados', 'Acessórios', 'Saúde', 'Ferramentas'].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-midnight text-white border-midnight' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
            >
              {cat}
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

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col group cursor-pointer transition-shadow hover:shadow-2xl"
                >
                  <div className="aspect-square bg-slate-50 rounded-[2rem] mb-6 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                    <span className="relative z-10 drop-shadow-2xl">{product.image}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-100 shadow-sm flex items-center gap-1">
                        <TrendingUp size={10} />
                        Gera Cashback
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                    </div>
                    <h4 className="text-slate-800 font-black mb-2 line-clamp-2 min-h-[48px] text-lg leading-tight tracking-tight">{product.name}</h4>
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="text-yellow-400 fill-yellow-400" size={14} />
                      <span className="text-xs font-black text-midnight">{product.rating}</span>
                      <span className="text-slate-300 mx-1">|</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sales}</span>
                    </div>
                    <div className="mt-auto">
                      <div className="mb-4">
                        <p className="text-2xl font-black text-midnight leading-none mb-1 tracking-tighter">R$ {product.price}</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{product.installments}</p>
                      </div>
                      
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-midnight hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg group/btn overflow-hidden relative"
                      >
                        <motion.div 
                          className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 skew-x-12"
                        />
                        <div className="size-6 bg-white/10 rounded-lg flex items-center justify-center transition-all group-hover/btn:scale-110 group-hover/btn:bg-white/20">
                          <Plus size={16} />
                        </div>
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                </motion.div>
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
            <p className="text-slate-600">© 2024 Ecossistema Serviços Urbanos Tecnologia</p>
            <div className="flex gap-8">
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><Package size={12} /> Rastreio</span>
              <span className="flex items-center gap-1 transition-colors hover:text-white cursor-pointer"><TrendingUp size={12} /> Investimentos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
