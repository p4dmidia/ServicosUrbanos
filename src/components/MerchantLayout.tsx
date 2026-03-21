import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutGrid, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  PieChart, 
  Settings, 
  LogOut, 
  Search, 
  Bell,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { businessRules, MerchantUser } from '../lib/businessRules';

interface MerchantLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function MerchantLayout({ children, title, subtitle }: MerchantLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<MerchantUser | null>(null);

  useEffect(() => {
    setUser(businessRules.getCurrentUser());
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/lojista/dashboard' },
    { name: 'Produtos', icon: Package, path: '/lojista/produtos' },
    { name: 'Pedidos', icon: ShoppingBag, path: '/lojista/pedidos' },
    { name: 'Financeiro', icon: DollarSign, path: '/lojista/financeiro' },
    { name: 'Clientes', icon: Users, path: '/lojista/clientes' },
    { name: 'Relatórios', icon: PieChart, path: '/lojista/relatorios' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Gerentes não podem ver configurações gerais
  const canSeeSettings = user?.role === 'owner';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-midnight border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-white/5">
          <Link to="/marketplace" className="flex items-center gap-3 text-white mb-2">
            <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center shadow-lg shadow-primary-blue/30">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase leading-none block">UrbaShop</span>
              <span className="text-[9px] font-black text-primary-red uppercase tracking-[0.2em] opacity-80">Merchant Center</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                isActive(item.path) 
                  ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          {canSeeSettings && (
            <button 
              onClick={() => navigate('/lojista/configuracoes')}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <Settings size={18} />
              Configurações
            </button>
          )}
          <button 
            onClick={() => {
              // Limpar usuário ao sair (opcional para o protótipo)
              navigate('/lojista/login');
            }}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 py-6 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden size-10 bg-slate-50 rounded-xl flex items-center justify-center text-midnight"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-midnight tracking-tighter uppercase italic leading-none">{title}</h1>
              <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-slate-50 border border-slate-100 py-2.5 pl-10 pr-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 w-40 lg:w-80"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            </div>

            <button className="relative size-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-midnight hover:bg-slate-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-[-2px] right-[-2px] size-3 bg-primary-red border-2 border-white rounded-full"></span>
            </button>

            <div className="hidden sm:block h-10 w-[1px] bg-slate-100 mx-2"></div>

            <div className="flex items-center gap-3 lg:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm font-black text-midnight">{user?.name || 'Carregando...'}</p>
                <p className="text-[8px] lg:text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  {user?.role === 'owner' ? 'Dono da Loja' : 'Gerente de Filial'}
                </p>
              </div>
              <div className="size-8 lg:size-10 bg-slate-100 rounded-full border-2 border-primary-blue/20 overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Merchant'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-midnight z-[110] flex flex-col lg:hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="size-8 bg-primary-blue rounded-lg flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <span className="font-black uppercase tracking-tighter">UrbaShop</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-6 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      isActive(item.path) 
                        ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-white/5 space-y-4">
                {canSeeSettings && (
                  <button 
                    onClick={() => {
                      navigate('/lojista/configuracoes');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Settings size={18} />
                    Configurações
                  </button>
                )}
                <button 
                  onClick={() => {
                    navigate('/lojista/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
