import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Wallet, 
  Globe, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface AffiliateLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AffiliateLayout({ children, title }: AffiliateLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    async function loadStats() {
      if (user) {
        const data = await businessRules.getAffiliateStats(user.id);
        setStats(data);
      }
    }
    loadStats();
    
    // Atualizar a cada 30 segundos para manter o saldo real
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePushNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("Este navegador não suporta notificações.");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Notificações push já estão ativas!");
      new Notification("Serviços Urbanos", {
        body: "As notificações push estão configuradas corretamentes!",
        icon: "/vite.svg"
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notificações ativadas com sucesso!");
        new Notification("Serviços Urbanos", {
          body: "Parabéns! Você receberá alertas de novas comissões.",
          icon: "/vite.svg"
        });
      }
    } else {
      toast.error("Notificações bloqueadas no navegador.");
    }
  };

  const menuItems = [
    { path: '/afiliado/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/afiliado/rede', icon: Users, label: 'Minha Rede' },
    { path: '/afiliado/financeiro', icon: Wallet, label: 'Financeiro' },
    { path: '/afiliado/pedidos', icon: ShoppingBag, label: 'Meus Pedidos' },
    { path: '/afiliado/ecossistema', icon: Globe, label: 'Ecossistema' },
    { path: '/afiliado/perfil', icon: User, label: 'Dados Pessoais' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-midnight">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-50 ${
          isSidebarOpen ? 'w-72' : 'w-24'
        }`}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="size-10 bg-primary-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20 shrink-0">
            <LayoutGrid size={24} />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter uppercase italic"
            >
              SERVIÇOS <span className="text-primary-blue">URBANOS</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-midnight'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:text-primary-blue'} />
                {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <motion.div layoutId="activeNav" className="ml-auto">
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
          >
            <LogOut size={22} className="group-hover:text-red-500" />
            {isSidebarOpen && <span className="font-bold text-sm">Sair do Painel</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden size-10 flex items-center justify-center text-slate-500 bg-slate-50 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-black text-midnight tracking-tighter uppercase italic">{title}</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Saldo Rápido Real do Banco de Dados */}
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo Disponível</p>
              <div className="flex items-center gap-2">
                 <span className="text-lg font-black text-emerald-600 tracking-tighter">
                   {stats ? `R$ ${stats.availableBalance.toFixed(2)}` : 'R$ 0,00'}
                 </span>
                 <div className="size-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <TrendingUp size={12} />
                 </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-4">
               {/* Botão de Notificação Push Funcional */}
               <button 
                 onClick={handlePushNotification}
                 title="Ativar Notificações Push"
                 className="size-10 flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-primary-blue/5 transition-all relative bg-slate-50 rounded-xl group"
               >
                 <Bell size={20} className="group-hover:animate-swing" />
                 <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
               </button>
               
               <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                 <div className="text-right hidden sm:block">
                   <p className="text-xs font-black text-midnight leading-none mb-1">{profile?.full_name || 'Carregando...'}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Afiliado Premium</p>
                 </div>
                 <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 uppercase overflow-hidden relative">
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     profile?.full_name?.charAt(0) || 'U'
                   )}
                 </div>
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
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
              className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-[101] lg:hidden p-8 flex flex-col shadow-2xl"
            >
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
                      <LayoutGrid size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase italic">SERVIÇOS <span className="text-primary-blue">URBANOS</span></span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
               </div>
               
               <nav className="flex-1 space-y-2">
                 {menuItems.map((item) => (
                   <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                        location.pathname === item.path ? 'bg-primary-blue text-white shadow-lg' : 'text-slate-400'
                      }`}
                   >
                     <item.icon size={20} />
                     {item.label}
                   </Link>
                 ))}
               </nav>

               <button 
                 onClick={handleLogout}
                 className="mt-auto flex items-center gap-4 w-full px-6 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
               >
                 <LogOut size={20} />
                 Sair
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
