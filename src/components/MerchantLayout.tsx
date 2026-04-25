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
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MerchantLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function MerchantLayout({ children, title, subtitle }: MerchantLayoutProps) {
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
  const canSeeSettings = profile?.role === 'owner';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* ... (aside remains the same) */}

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

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative size-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-midnight hover:bg-slate-100 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-[-2px] right-[-2px] size-5 bg-primary-red border-2 border-white rounded-full text-[10px] text-white font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-100"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-black text-midnight uppercase tracking-wider">Notificações</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => markAllAsRead()}
                            className="text-[10px] font-black text-primary-blue uppercase hover:underline"
                          >
                            Ler tudo
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => {
                                if (!notification.is_read) markAsRead(notification.id);
                                // Optional: navigate to relevant page
                              }}
                              className={`p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary-blue/5' : ''}`}
                            >
                              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                notification.type === 'sale' ? 'bg-emerald-100 text-emerald-600' :
                                notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'stock' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {notification.type === 'sale' ? <DollarSign size={20} /> :
                                 notification.type === 'order' ? <ShoppingBag size={20} /> :
                                 notification.type === 'stock' ? <Package size={20} /> :
                                 <Bell size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-midnight truncate">{notification.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="size-2 bg-primary-blue rounded-full self-center" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                              <Bell size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Nenhuma notificação por enquanto</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:block h-10 w-[1px] bg-slate-100 mx-2"></div>


            <div className="flex items-center gap-3 lg:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm font-black text-midnight">{profile?.full_name || 'Carregando...'}</p>
                <p className="text-[8px] lg:text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  {profile?.role === 'owner' ? 'Dono da Loja' : profile?.role === 'manager' ? 'Gerente de Filial' : 'Afiliado Parceiro'}
                </p>
              </div>
              <div className="size-8 lg:size-10 bg-slate-100 rounded-full border-2 border-primary-blue/20 overflow-hidden">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'Merchant'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
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
                    <LayoutGrid size={16} />
                  </div>
                  <span className="font-black uppercase tracking-tighter italic">URBA<span className="text-primary-blue">SHOP</span></span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-6 space-y-2">
                {menuItems.map((item: any) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    state={item.tab ? { activeTab: item.tab } : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      isActive(item.path) && (!item.tab || (location.state as any)?.activeTab === item.tab)
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
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate('/lojista/login', { replace: true });
                      setIsMobileMenuOpen(false);
                    } catch (error) {
                      window.location.href = '/lojista/login';
                    }
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
