import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Store, 
  Settings, 
  PieChart, 
  ShieldCheck, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut,
  Globe,
  Zap,
  LayoutGrid,
  Loader2,
  DollarSign,
  Clock
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const searchRef = React.useRef<HTMLDivElement>(null);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      }
      // Se o perfil existe mas o cargo não é permitido, redireciona
      if (profile && (profile.role !== 'owner' && profile.role !== 'manager' && profile.role !== 'admin')) {
        console.log('AdminLayout: Cargo não autorizado:', profile.role);
        navigate('/admin/login');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const logs = await businessRules.getAdminSystemLogs(5);
        setNotifications(logs);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min sync
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await businessRules.searchEcosystem(query);
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!user || (profile?.role !== 'owner' && profile?.role !== 'manager' && profile?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center text-white p-4 text-center">
        <div>
          <p className="text-xl font-black mb-2">ACESSO RESTRITO</p>
          <p className="text-sm text-slate-400">Seu perfil não tem permissão para esta área.</p>
          <button onClick={() => navigate('/admin/login')} className="mt-4 px-6 py-2 bg-indigo-600 rounded-lg">Voltar ao Login</button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { name: 'Plataformas', icon: Globe, path: '/admin/plataformas' },
    { name: 'Usuários', icon: Users, path: '/admin/usuarios' },
    { name: 'Marketplace', icon: Store, path: '/admin/marketplace' },
    { name: 'Lista de Espera', icon: Clock, path: '/admin/lista-espera' },
    { name: 'Relatórios', icon: PieChart, path: '/admin/relatorios' },
    { name: 'Saques', icon: DollarSign, path: '/admin/saques' },
    { name: 'Configurações', icon: Settings, path: '/admin/configuracoes' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-[#0a0e17] border-r border-white/5 flex-col sticky top-0 h-screen z-40">
        <div className="p-8 border-b border-white/5">
          <Link to="/admin/dashboard" className="flex items-center gap-3 text-white mb-2">
            <div className="size-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase leading-none block">UrbaAdmin</span>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] opacity-80">Central de Controle</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-6 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Menu Principal</p>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                isActive(item.path) 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button 
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
        {/* Top Header */}
        <header className="bg-[#0a0e17]/80 backdrop-blur-xl border-b border-white/5 py-6 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden size-10 bg-white/5 rounded-xl flex items-center justify-center text-white"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tighter uppercase italic leading-none">{title}</h1>
              <p className="text-[9px] lg:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block" ref={searchRef}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                placeholder="Pesquisar no ecossistema..." 
                className="bg-white/5 border border-white/5 py-2.5 pl-10 pr-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40 lg:w-80 text-white placeholder:text-slate-600"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />

              <AnimatePresence>
                {isSearchOpen && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-[#0a0e17] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                  >
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          navigate(res.path, { state: { search: res.name } });
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 hover:bg-white/5 flex items-center justify-between text-left group"
                      >
                        <div>
                          <p className="text-sm font-black text-white">{res.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{res.sub || res.type}</p>
                        </div>
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase italic">Ir para</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative size-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <Bell size={18} />
                {notifications.some(n => n.type === 'Warning' || n.type === 'Error') && (
                  <span className="absolute top-[-2px] right-[-2px] size-3 bg-red-500 border-2 border-[#0a0e17] rounded-full animate-pulse"></span>
                )}
                {!notifications.some(n => n.type === 'Warning' || n.type === 'Error') && notifications.length > 0 && (
                  <span className="absolute top-[-2px] right-[-2px] size-3 bg-indigo-500 border-2 border-[#0a0e17] rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full right-0 w-80 mt-2 bg-[#0a0e17] border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-6 border-b border-white/5">
                      <p className="text-xs font-black text-white uppercase tracking-tighter italic">Notificações</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n, i) => (
                          <div key={i} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex gap-3">
                              <div className={`size-1.5 mt-1.5 rounded-full shrink-0 ${n.type === 'Success' ? 'bg-emerald-500' : n.type === 'Warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                              <div>
                                <p className="text-[11px] text-white/90 font-medium leading-relaxed">{n.text}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center opacity-30">
                          <p className="text-xs font-bold uppercase tracking-widest">Sem novas notificações</p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        navigate('/admin/dashboard');
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/5 transition-colors"
                    >
                      Ver Tudo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:block h-10 w-[1px] bg-white/5 mx-2"></div>

            <div className="flex items-center gap-3 lg:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm font-black text-white">Super Admin</p>
                <p className="text-[8px] lg:text-[9px] font-black text-indigo-400 uppercase tracking-widest">Acesso Vitalício</p>
              </div>
              <div className="size-8 lg:size-10 bg-indigo-500/20 rounded-full border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center text-indigo-400 font-black">
                SA
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-[#0a0e17] z-[110] flex flex-col lg:hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="font-black uppercase tracking-tighter">UrbaAdmin</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      isActive(item.path) 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-white/5 space-y-4">
                <button 
                  onClick={() => {
                    navigate('/admin/configuracoes');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Settings size={18} />
                  Configurações
                </button>
                <button 
                  onClick={() => {
                    navigate('/admin/login');
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
