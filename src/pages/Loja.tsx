import React, { useState, useMemo } from 'react';
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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  sales: string;
  category: string;
  cashback: number;
  condition: 'Novo' | 'Usado';
}

interface CartItem extends Product {
  quantity: number;
}

export default function Loja() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceRange, setPriceRange] = useState(1000);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const products: Product[] = [
    { id: 1, name: "Fone de Ouvido Noise Cancelling Pro", price: 199.90, image: "🎧", rating: 4.8, sales: "1.2k", category: "Eletrônicos", cashback: 15, condition: 'Novo' },
    { id: 2, name: "Smartwatch Urban Fit G2", price: 349.00, image: "⌚", rating: 4.9, sales: "800", category: "Wearables", cashback: 25, condition: 'Novo' },
    { id: 3, name: "Tênis Street Walker Original", price: 279.50, image: "👟", rating: 4.7, sales: "2.5k", category: "Calçados", cashback: 20, condition: 'Novo' },
    { id: 4, name: "Mochila Tech Pro Impermeável", price: 159.00, image: "🎒", rating: 4.6, sales: "500", category: "Acessórios", cashback: 12, condition: 'Novo' },
    { id: 5, name: "Kindle Paperwhite 11ª Ger", price: 699.00, image: "📖", rating: 4.9, sales: "3k", category: "Eletrônicos", cashback: 50, condition: 'Novo' },
    { id: 6, name: "Câmera Mirrorless UrbanShot", price: 2450.00, image: "📷", rating: 4.7, sales: "150", category: "Eletrônicos", cashback: 150, condition: 'Novo' },
    { id: 7, name: "Jaqueta Corta-Vento Elite", price: 189.90, image: "🧥", rating: 4.5, sales: "1.1k", category: "Moda", cashback: 18, condition: 'Novo' },
    { id: 8, name: "Garrafa Térmica 1L Titanium", price: 89.00, image: "🫙", rating: 4.8, sales: "4k", category: "Casa", cashback: 8, condition: 'Novo' },
  ];

  const categories = ['Todos', 'Eletrônicos', 'Wearables', 'Calçados', 'Acessórios', 'Moda', 'Casa'];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesPrice = p.price <= priceRange;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [search, selectedCategory, priceRange]);

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
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalCashback = cartItems.reduce((acc, item) => acc + (item.cashback * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      {/* Search Header */}
      <header className="bg-midnight py-4 px-6 lg:px-20 sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center gap-6 md:gap-12">
          <Link to="/marketplace" className="text-white hover:text-primary-blue transition-colors flex items-center gap-2 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:inline font-bold text-sm">Voltar</span>
          </Link>

          <div className="flex-1 relative">
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
            <Link to="/login" className="hidden md:flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold text-sm">
              <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
                <LayoutGrid size={16} />
              </div>
              Minha Conta
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-10 flex flex-col md:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-72 shrink-0 space-y-10">
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
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat}
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
              {filteredProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-50 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-midnight border border-white/50">
                      {p.condition}
                    </div>
                    {p.image}
                    <button 
                      onClick={() => addToCart(p)}
                      className="absolute bottom-4 right-4 size-12 bg-midnight text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl hover:bg-primary-blue"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span className="text-xs font-black text-midnight">{p.rating}</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sales} vendidos</span>
                    </div>

                    <h4 className="text-sm font-black text-midnight mb-1 line-clamp-2 min-h-[2.5rem] tracking-tight">{p.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{p.category}</p>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-black text-midnight tracking-tighter">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">+ R$ {p.cashback.toFixed(2).replace('.', ',')} de cashback</p>
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
                      <div className="size-20 bg-white rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-sm">
                        {item.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-midnight mb-1 truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{item.category}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-sm font-black text-midnight">R$ {item.price.toFixed(2).replace('.', ',')}</p>
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
                      <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cashback Ganho</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">+ R$ {totalCashback.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                      <span className="text-xl font-black text-midnight uppercase tracking-tighter">Total</span>
                      <span className="text-2xl font-black text-midnight tracking-tighter">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <button className="w-full bg-midnight text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:bg-slate-800 uppercase tracking-tighter">
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
