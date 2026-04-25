import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  LayoutGrid,
  Search,
  Bell,
  TrendingUp,
  Menu,
  X,
  Store,
  LogOut,
  LayoutDashboard,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('urbashop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { user: authUser, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Cashback Liberado!', message: 'Você recebeu R$ 25,00 do seu último pedido.', time: 'há 2 horas', read: false },
    { id: 2, title: 'Oferta Especial', message: 'Tênis Nike com 30% de cashback extra hoje.', time: 'há 5 horas', read: false }
  ]);
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const [address, setAddress] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const [mmnConfig, setMmnConfig] = useState<any>(null);
  const [g1Value, setG1Value] = useState(0);

  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [pickupAddress, setPickupAddress] = useState('Buscando endereço da loja...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'wallet'>('mercadopago');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [isEligibleForWallet, setIsEligibleForWallet] = useState(false);

  useEffect(() => {
    async function fetchPickupAddress() {
      if (cartItems.length === 0) return;
      try {
        const productId = cartItems[0].id;
        // 1. Obter o merchant_id do produto
        const { data: productData } = await supabase
          .from('products')
          .select('merchant_id')
          .eq('id', productId)
          .single();

        if (productData?.merchant_id) {
          // 2. Obter a primeira filial/loja desse merchant
          const { data: branchData } = await supabase
            .from('branches')
            .select('address, city, state')
            .eq('merchant_id', productData.merchant_id)
            .limit(1)
            .single();

          if (branchData && branchData.address) {
            setPickupAddress(`${branchData.address}, ${branchData.city} - ${branchData.state}`);
          } else {
            setPickupAddress('Endereço da loja indisponível.');
          }
        } else {
          setPickupAddress('Endereço da loja indisponível.');
        }
      } catch (err) {
        console.error('Erro ao buscar endereço de retirada:', err);
        setPickupAddress('Erro ao carregar endereço da loja.');
      }
    }

    fetchPickupAddress();
  }, [cartItems]);

  useEffect(() => {
    if (profile && !address.cep && !address.logradouro) {
      setAddress(prev => ({
        ...prev,
        cep: profile.zip_code || '',
        logradouro: profile.address || '',
        numero: profile.number || '',
        bairro: profile.neighborhood || '',
        cidade: profile.city || '',
        estado: profile.state || ''
      }));
    }
  }, [profile]);

  useEffect(() => {
    async function fetchWalletBalance() {
      if (!authUser) return;
      try {
        setWalletLoading(true);
        const stats = await businessRules.getAffiliateStats(authUser.id);
        setWalletBalance(stats.availableBalance);
        setIsEligibleForWallet(stats.consumptionCount >= 1);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      } finally {
        setWalletLoading(false);
      }
    }
    fetchWalletBalance();

    async function fetchMMN() {
      try {
        const config = await businessRules.getMMNConfig();
        const levels = await businessRules.getMMNLevels();
        setMmnConfig(config);
        const g1 = levels.find(l => l.level === 1);
        if (g1) setG1Value(g1.value);
      } catch (e) {
        console.error('Error fetching MMN for checkout:', e);
      }
    }
    fetchMMN();
  }, [authUser]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // Sem frete

  // MMN Calculations for the whole order
  const g1TotalOrder = (subtotal * (g1Value / 100));
  const totalRatios = (mmnConfig?.cashbackMensal || 2.75) + (mmnConfig?.cashbackDigital || 1.0) + (mmnConfig?.cashbackAnual || 0.75);
  const totalMensal = g1TotalOrder * ((mmnConfig?.cashbackMensal || 2.75) / totalRatios);
  const totalAnual = g1TotalOrder * ((mmnConfig?.cashbackAnual || 0.75) / totalRatios);

  useEffect(() => {
    setShippingCost(0);
    setShippingMethod('pickup');
  }, []);

  const handleCheckout = async () => {
    if (!shippingMethod) {
      toast.error('Selecione um método de envio ou retirada.');
      return;
    }

    if (shippingMethod !== 'pickup' && (!address.cep || !address.numero)) {
      toast.error('Preencha os dados de endereço obrigatórios para entrega.');
      return;
    }

    if (!authUser || !profile) {
      toast.error('Você precisa estar logado para finalizar a compra.');
      return;
    }

    try {
      setIsProcessing(true);

      if (paymentMethod === 'wallet') {
        if (walletBalance < total) {
          toast.error('Saldo insuficiente na carteira digital.');
          setIsProcessing(false);
          return;
        }

        const loadingToast = toast.loading('Processando pagamento com saldo...');

        const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // 1. Criar o pedido
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            id: orderId,
            customer_id: authUser.id,
            customer_name: profile.full_name,
            customer_initial: profile.full_name?.[0] || 'U',
            amount: total,
            status: 'Aguardando Pagamento',
            items: cartItems,
            branch_id: cartItems[0].branchId || cartItems[0].merchant_id || null, 
            cashback_amount: cartItems.reduce((acc, item) => acc + (item.cashback || 0) * item.quantity, 0),
            shipping_address: shippingMethod === 'pickup' ? 'Retirada na Loja' : `${address.logradouro}, ${address.numero} - ${address.cidade}/${address.estado}`,
            payment_method: 'Carteira Digital'
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Se for retirada, criar o registro de código de retirada
        if (shippingMethod === 'pickup') {
          const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase
            .from('order_extras')
            .insert([{
              id: order.id,
              withdrawal_code: withdrawalCode,
              status: 'Pendente'
            }]);
        }

        // 3. Criar a transação de débito
        const { error: transError } = await supabase
          .from('transactions')
          .insert([{
            profile_id: authUser.id,
            type: 'withdrawal',
            amount: -total,
            description: `Pagamento de Pedido #${order.id.substring(0, 8)}`,
            status: 'completed'
          }]);

        if (transError) throw transError;

        toast.dismiss(loadingToast);
        toast.success('Pagamento realizado com sucesso!');
        
        localStorage.removeItem('urbashop_cart');
        navigate('/afiliado/pedidos');
        return;
      }

      const loadingToast = toast.loading('Gerando pagamento...');

      const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 1. Criar o pedido como 'Pendente' para visibilidade do lojista
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          customer_id: authUser.id,
          customer_name: profile.full_name,
          customer_initial: profile.full_name?.[0] || 'U',
          amount: total,
          status: 'Aguardando Pagamento',
          items: cartItems,
          branch_id: cartItems[0].branchId || cartItems[0].merchant_id || null, 
          cashback_amount: cartItems.reduce((acc, item) => acc + (item.cashback || 0) * item.quantity, 0),
          shipping_address: `RETIRADA NA LOJA: ${pickupAddress}`,
          payment_method: paymentMethod === 'wallet' ? 'Carteira Digital' : 'Mercado Pago'
        }]);

      if (orderError) throw orderError;

      // 2. Se for retirada, criar o registro de código de retirada antecipadamente
      if (shippingMethod === 'pickup') {
        const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from('order_extras')
          .insert([{
            id: orderId,
            withdrawal_code: withdrawalCode,
            status: 'Pendente'
          }]);
      }

      const payer = {
        email: authUser.email,
        name: profile.full_name || 'Usuário UrbaShop'
      };

      const payload = {
        orderId, // Passamos o ID gerado
        items: cartItems.map(item => ({
          id: item.id,
          title: item.name || item.title || 'Produto UrbaShop',
          quantity: item.quantity,
          unit_price: item.price
        })),
        payer,
        shippingCost: shippingMethod === 'pickup' ? 0 : shippingCost,
        origin: window.location.origin
      };

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: payload
      });

      toast.dismiss(loadingToast);

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (data?.ok === false) {
        console.error("Payment API Error:", data.error, data.details);
        throw new Error(data.error || 'Erro no Mercado Pago');
      }

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não retornado');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(`Erro ao processar pagamento: ${err.message || 'Erro desconhecido'}`);
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="size-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <ShoppingCart size={48} />
        </div>
        <h2 className="text-2xl font-black text-midnight mb-2">Carrinho Vazio</h2>
        <p className="text-slate-500 mb-8">Você ainda não tem itens no carrinho para finalizar a compra.</p>
        <button onClick={() => navigate('/loja')} className="bg-midnight hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
          Voltar para Loja
        </button>
      </div>
    );
  }

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
            <Link to="/marketplace" className="flex items-center gap-2 text-white shrink-0">
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
              className="w-full bg-white/10 text-white placeholder-white/50 py-2.5 pl-5 pr-12 rounded-lg focus:outline-none transition-all focus:bg-white focus:text-midnight focus:placeholder-slate-400 border border-white/5"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 text-white/50 hover:text-primary-blue transition-colors group-focus-within:text-slate-400">
              <Search size={20} />
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-6 text-white/80 shrink-0 relative">
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

        {/* Mobile Search - Only visible on small screens */}
        <div className="mt-4 md:hidden">
          <div className="relative group px-6">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..." 
              className="w-full bg-white/10 text-white placeholder-white/50 py-2.5 pl-5 pr-12 rounded-lg focus:outline-none transition-all focus:bg-white focus:text-midnight focus:placeholder-slate-400 border border-white/5"
            />
            <button className="absolute right-6 top-0 bottom-0 px-4 text-white/50">
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
                <Link to="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white transition-all">Marketplace</Link>
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8 flex flex-col">
            {/* Frete */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 order-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-lg font-black text-midnight uppercase tracking-tighter">Forma de Entrega</h2>
              </div>

              <div className="p-6 bg-blue-50/50 rounded-2xl border-2 border-primary-blue">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 size-5 rounded-full border-2 border-primary-blue flex items-center justify-center">
                      <div className="size-2.5 bg-primary-blue rounded-full" />
                    </div>
                    <div>
                      <p className="font-black text-midnight uppercase italic tracking-tighter">Retirada na Loja</p>
                      <p className="text-sm text-slate-600 font-bold mt-1">{pickupAddress}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] bg-white text-primary-blue font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-primary-blue/10 shadow-sm">
                        <AlertCircle size={12} /> Você receberá um código de retirada após o pagamento
                      </div>
                    </div>
                  </div>
              </div>
            </motion.section>



            {/* Forma de Pagamento */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 order-3"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-lg font-black text-midnight uppercase tracking-tighter">Forma de Pagamento</h2>
              </div>

              <div className="space-y-4">
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'mercadopago' ? 'border-primary-blue bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'mercadopago' ? 'border-primary-blue' : 'border-slate-300'}`}>
                      {paymentMethod === 'mercadopago' && <div className="size-2.5 bg-primary-blue rounded-full" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-slate-400" />
                      <div>
                        <p className="font-black text-midnight">Cartão, Pix ou Boleto</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Processado pelo Mercado Pago</p>
                      </div>
                    </div>
                  </div>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'mercadopago'} onChange={() => setPaymentMethod('mercadopago')} />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-primary-blue bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'} ${(!authUser || walletBalance < total) ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-primary-blue' : 'border-slate-300'}`}>
                      {paymentMethod === 'wallet' && <div className="size-2.5 bg-primary-blue rounded-full" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-5 bg-emerald-500 rounded flex items-center justify-center text-white font-black text-[10px]">CD</div>
                      <div>
                        <p className="font-black text-midnight">Saldo Carteira Digital</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase">Saldo: R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {authUser && !isEligibleForWallet && (
                          <p className="text-[9px] text-red-500 font-bold uppercase mt-1 italic">Liberação após o 1º consumo na plataforma</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {!authUser ? (
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Faça login</span>
                  ) : !isEligibleForWallet ? (
                    <span className="text-[10px] font-bold text-red-500 uppercase">Conta Inativa</span>
                  ) : walletBalance < total ? (
                    <span className="text-[10px] font-bold text-red-500 uppercase">Saldo Insuficiente</span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Disponível</span>
                  )}
                  <input 
                    type="radio" 
                    name="payment" 
                    className="hidden" 
                    disabled={!authUser || walletBalance < total || !isEligibleForWallet}
                    checked={paymentMethod === 'wallet'} 
                    onChange={() => setPaymentMethod('wallet')} 
                  />
                </label>
              </div>
            </motion.section>
          </div>

          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-32"
            >
              <h3 className="font-black text-midnight uppercase tracking-tighter mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="size-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.image.length > 4 ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{item.image}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-midnight truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 mb-6">
                <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-midnight">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                  <span>Frete</span>
                  <span className="font-bold text-midnight">
                    {shippingMethod === 'sedex' 
                      ? `R$ ${(shippingCost * 1.8).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : shippingMethod === 'pac' 
                        ? `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : shippingMethod === 'pickup'
                          ? 'Grátis'
                          : '--'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-lg font-black text-midnight uppercase tracking-tighter">Total</span>
                  <span className="text-2xl font-black text-primary-blue">
                    R$ {(subtotal + (shippingMethod === 'sedex' ? shippingCost * 1.8 : shippingMethod === 'pac' ? shippingCost : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Cashback Detailed Summary */}
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 space-y-3">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Seu Retorno com esta compra:
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-600">Bônus Mensal</span>
                    <span className="text-sm font-black text-emerald-600">+ R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600">Bônus Anual</span>
                    <span className="text-sm font-black text-indigo-600">+ R$ {totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isProcessing || !shippingMethod}
                className="w-full bg-primary-blue hover:bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-primary-blue/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processando...' : paymentMethod === 'wallet' ? 'Pagar com Carteira Digital' : 'Finalizar Pedido / Pagar'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-emerald-500" /> Compra Garantida
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Simplified Marketplace Footer */}
      <footer className="bg-midnight py-16 px-6 lg:px-20 text-slate-500 border-t border-slate-800 mt-auto">
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
    </div>
  );
}
