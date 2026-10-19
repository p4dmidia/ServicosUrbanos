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
  ShoppingBag,
  FileText,
  Shield,
  Ticket,
  Package,
  RefreshCw,
  HeartPulse,
  Target,
  CircleDollarSign,
  Receipt,
  BarChart3,
  Gift,
  FolderDown,
  AlertCircle,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AffiliateLayoutProps {
  children: React.ReactNode;
  title: string;
  customBalance?: number;
  customBalanceLabel?: string;
}

export default function AffiliateLayout({ children, title, customBalance, customBalanceLabel }: AffiliateLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<{
    isMicrofranqueado: boolean;
    isSegurado: boolean;
    microfranqueado: any;
    segurado: any;
    isLicenseActive: boolean;
    isPolicyActive: boolean;
    comissoes: any;
    loading: boolean;
  }>({
    isMicrofranqueado: false,
    isSegurado: false,
    microfranqueado: null,
    segurado: null,
    isLicenseActive: false,
    isPolicyActive: false,
    comissoes: null,
    loading: true
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isTermMenuExpanded, setIsTermMenuExpanded] = useState(location.pathname.startsWith('/afiliado/termo-adesao'));

  useEffect(() => {
    if (location.pathname.startsWith('/afiliado/termo-adesao')) {
      setIsTermMenuExpanded(true);
    }
  }, [location.pathname]);

  const handleTermClick = (e: React.MouseEvent) => {
    if (location.pathname.startsWith('/afiliado/termo-adesao')) {
      setIsTermMenuExpanded(!isTermMenuExpanded);
    } else {
      setIsTermMenuExpanded(true);
    }
  };

  useEffect(() => {
    async function loadRolesAndStats() {
      if (!user) return;
      try {
        const [mfData, segData, statsData] = await Promise.all([
          businessRules.getMicrofranqueadoData(user.id),
          businessRules.getSeguradoData(user.id),
          businessRules.getAffiliateStats(user.id)
        ]);

        let comissoesData = null;
        if (mfData?.microfranqueado?.id) {
          comissoesData = await businessRules.getComissoesMicrofranqueado(mfData.microfranqueado.id);
        }

        setUserRoles({
          isMicrofranqueado: !!mfData?.isMicrofranqueado,
          isSegurado: !!segData?.isSegurado,
          microfranqueado: mfData?.microfranqueado,
          segurado: segData?.segurado,
          isLicenseActive: !!mfData?.isLicenseActive,
          isPolicyActive: !!segData?.isPolicyActive,
          comissoes: comissoesData,
          loading: false
        });

        setStats(statsData);
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      }
    }

    loadRolesAndStats();
    const interval = setInterval(loadRolesAndStats, 30000);
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
      new Notification("CaZa dos Sorteios", {
        body: "As notificações push estão configuradas corretamente!",
        icon: "/vite.svg"
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notificações ativadas com sucesso!");
        new Notification("CaZa dos Sorteios", {
          body: "Parabéns! Você receberá atualizações em tempo real.",
          icon: "/vite.svg"
        });
      }
    } else {
      toast.error("Notificações bloqueadas no navegador.");
    }
  };

  const isPJ = Boolean(profile?.cnpj && profile.cnpj.replace(/\D/g, '').length > 11) || 
               Boolean((profile as any)?.description?.includes('[PJ]'));

  // SEPARAÇÃO RIGOROSA DE MENUS CONFORME NOVO MODELO JURÍDICO
  // 1. Menu para Afiliado Premium (Consumidor de Proteção e Sorteios - ZERO MMN)
  const afiliadoPremiumMenuItems = [
    { path: '/afiliado/dashboard', icon: LayoutGrid, label: 'Painel do Segurado' },
    { path: '/afiliado/apolice', icon: Shield, label: 'Apólice MBM R$ 5.000' },
    { path: '/afiliado/numero-sorte', icon: Ticket, label: 'Números da Sorte' },
    { path: '/afiliado/telemedicina', icon: HeartPulse, label: 'Telemedicina 24/7' },
    { path: '/afiliado/sinistros', icon: AlertCircle, label: 'Sinistros MBM' },
    { path: '/afiliado/renovacoes', icon: RefreshCw, label: 'Planos & Renovação' },
    { path: '/afiliado/pedidos', icon: ShoppingBag, label: 'Meus Pedidos' },
    { path: '/afiliado/perfil', icon: User, label: 'Dados Cadastrais' },
    { path: '/afiliado/termo-adesao', icon: FileText, label: 'Termo de Adesão' },
  ];

  // 2. Menu para Microfranqueado (MMN, Gestão de Rede e Vendas)
  const microfranqueadoMenuItems = [
    { path: '/afiliado/dashboard', icon: LayoutGrid, label: 'Dashboard MMN' },
    { path: '/afiliado/codigo-ganha-ganha', icon: Gift, label: 'Código Ganha & Ganha' },
    { path: '/afiliado/materiais', icon: FolderDown, label: 'Materiais de Divulgação' },
    ...(profile?.role === 'regional_reseller' ? [
      { path: '/afiliado/revendedor', icon: Target, label: 'Liderança Regional' }
    ] : []),
    { path: '/afiliado/rede', icon: Users, label: 'Rede MMN (3 Níveis)' },
    { path: '/afiliado/financeiro', icon: Wallet, label: 'Comissões & Carteira' },
    ...(profile?.role === 'regional_reseller' ? [
      { path: '/afiliado/financeiro-revendedor', icon: CircleDollarSign, label: 'Financeiro Revendedor' }
    ] : []),
    { path: '/afiliado/financeiro-resumo', icon: BarChart3, label: 'Extrato Consolidado' },
    { path: '/afiliado/nota-fiscal', icon: Receipt, label: isPJ ? 'Nota Fiscal (PJ)' : 'Recibo RPA (PF)' },
    { path: '/afiliado/pedidos', icon: ShoppingBag, label: 'Pedidos da Rede' },
    { path: '/afiliado/renovacoes', icon: RefreshCw, label: 'Licença da Franquia' },
    { path: '/afiliado/perfil', icon: User, label: 'Dados da Franquia' },
    { path: '/afiliado/termo-adesao', icon: FileText, label: 'Termo de Franquia' },
  ];

  // Itens de Proteção Pessoal para Microfranqueado (apenas se tiver Seguro Ativo)
  const microfranqueadoSeguroItems = userRoles.isPolicyActive ? [
    { path: '/afiliado/apolice', icon: Shield, label: 'Minha Apólice MBM' },
    { path: '/afiliado/numero-sorte', icon: Ticket, label: 'Meus Números Sorte' },
    { path: '/afiliado/telemedicina', icon: HeartPulse, label: 'Telemedicina 24/7' },
    { path: '/afiliado/sinistros', icon: AlertCircle, label: 'Sinistros' },
  ] : [];

  const activeMenuItems = userRoles.isMicrofranqueado ? microfranqueadoMenuItems : afiliadoPremiumMenuItems;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-midnight">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-50 h-screen sticky top-0 ${
          isSidebarOpen ? 'w-72' : 'w-24'
        }`}
      >
        <div className="p-6 flex items-center justify-center shrink-0">
          <Link to="/afiliado/dashboard" className="flex items-center">
            {isSidebarOpen ? (
              <img 
                src="/logo-dark.png" 
                alt="CaZa dos Sorteios" 
                className="h-10 w-auto object-contain" 
              />
            ) : (
              <div className="size-10 bg-primary-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20 shrink-0">
                <LayoutGrid size={24} />
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {activeMenuItems.map((item) => {
            const isTermActive = location.pathname.startsWith('/afiliado/termo-adesao');
            const isActive = item.path === '/afiliado/termo-adesao' 
              ? isTermActive 
              : location.pathname === item.path;

            const termSubItems = [
              { path: '/afiliado/termo-adesao', label: 'Termo Principal' },
              { path: '/afiliado/termo-adesao/anexo-1', label: 'Anexo I - Regulamento' },
              { path: '/afiliado/termo-adesao/anexo-2', label: 'Anexo II - Condições Gerais' },
              { path: '/afiliado/termo-adesao/anexo-3', label: 'Anexo III - Tabela Indenização' },
              { path: '/afiliado/termo-adesao/anexo-4', label: 'Anexo IV - Cobrança/Renovação' },
              { path: '/afiliado/termo-adesao/anexo-5', label: 'Anexo V - Proteção Dados' },
              { path: '/afiliado/termo-adesao/anexo-6', label: 'Anexo VI - Divulgação' },
              { path: '/afiliado/termo-adesao/anexo-7', label: 'Anexo VII - Cancelamento' },
              { path: '/afiliado/termo-adesao/anexo-8', label: 'Anexo VIII - Comissionamento' },
              { path: '/afiliado/termo-adesao/anexo-9', label: 'Anexo IX - Telemedicina' },
              { path: '/afiliado/termo-adesao/anexo-10', label: 'Anexo X - Qtde Sorteios' },
              { path: '/afiliado/termo-adesao/anexo-11', label: 'Anexo XI - Docs Indenização' },
              { path: '/afiliado/termo-adesao/anexo-12', label: 'Anexo XII - Cashback/Inadimplência' },
              { path: '/afiliado/termo-adesao/anexo-13', label: 'Anexo XIII - Intermediação Digital' },
            ];

            return (
              <div key={item.path} className="space-y-1">
                <Link
                  to={item.path}
                  onClick={(e) => {
                    if (item.path === '/afiliado/termo-adesao') {
                      handleTermClick(e);
                    }
                  }}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                    isActive 
                      ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-midnight'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-primary-blue'} />
                  {isSidebarOpen && <span className="font-bold text-xs tracking-tight">{item.label}</span>}
                  
                  {item.path !== '/afiliado/termo-adesao' && isActive && isSidebarOpen && (
                    <motion.div layoutId="activeNav" className="ml-auto">
                      <ChevronRight size={14} />
                    </motion.div>
                  )}

                  {item.path === '/afiliado/termo-adesao' && isSidebarOpen && (
                    <motion.div
                      animate={{ rotate: isTermMenuExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`ml-auto ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-blue'}`}
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </Link>
                
                {item.path === '/afiliado/termo-adesao' && isSidebarOpen && (
                  <AnimatePresence initial={false}>
                    {isTermMenuExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-6 border-l-2 border-slate-200 ml-6 space-y-1 py-1 overflow-hidden"
                      >
                        {termSubItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path || (subItem.path === '/afiliado/termo-adesao' && (location.pathname === '/afiliado/termo-adesao/' || location.pathname === '/afiliado/termo-adesao'));
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`block py-1.5 px-3 text-[11px] font-bold rounded-xl transition-all ${
                                isSubActive 
                                  ? 'text-primary-blue bg-primary-blue/5' 
                                  : 'text-slate-400 hover:text-midnight hover:bg-slate-50'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}

          {/* Seção adicional para Microfranqueado que também tem Seguro Ativo */}
          {userRoles.isMicrofranqueado && microfranqueadoSeguroItems.length > 0 && isSidebarOpen && (
            <div className="pt-4 mt-2 border-t border-slate-100">
              <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Meu Seguro & Benefícios
              </p>
              {microfranqueadoSeguroItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 font-bold' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-midnight font-medium'
                    }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'} />
                    <span className="text-xs">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Banner de Upgrade para Afiliado Premium Puro */}
          {!userRoles.isMicrofranqueado && isSidebarOpen && (
            <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl text-left shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-black text-[11px] uppercase tracking-wider mb-1">
                <Briefcase size={14} className="text-amber-600" />
                <span>Seja Microfranqueado</span>
              </div>
              <p className="text-[10px] text-amber-900/80 mb-2.5 leading-relaxed font-medium">
                Monte sua equipe de vendas e receba <strong>33% de comissão</strong> (G0 27%, G1 3%, G2 3%) com split 80% semanal e 20% anual.
              </p>
              <Link 
                to="/afiliado/renovacoes" 
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Ativar Franquia <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Banner de Proteção para Microfranqueado sem Seguro */}
          {userRoles.isMicrofranqueado && !userRoles.isPolicyActive && isSidebarOpen && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl text-left shadow-sm">
              <div className="flex items-center gap-2 text-primary-blue font-black text-[11px] uppercase tracking-wider mb-1">
                <Shield size={14} className="text-primary-blue" />
                <span>Seguro Vida Light</span>
              </div>
              <p className="text-[10px] text-slate-600 mb-2.5 leading-relaxed font-medium">
                Sua franquia não inclui seguro. Contrate a partir de <strong>R$ 5,00/mês</strong> para cobertura de R$ 5.000 + Sorteios + Telemedicina.
              </p>
              <Link 
                to="/afiliado/renovacoes" 
                className="inline-flex items-center gap-1.5 bg-primary-blue hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Contratar Plano <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Sair do Painel */}
          <div className="pt-4 mt-2 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
            >
              <LogOut size={20} className="group-hover:text-red-500 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-xs tracking-tight">Sair do Painel</span>}
            </button>
          </div>
        </nav>
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
            {/* Header Balance / Info Decoupled */}
            {userRoles.isMicrofranqueado ? (
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {customBalanceLabel || "Comissão Semanal (Terça-feira)"}
                </p>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-black text-emerald-600 tracking-tighter">
                     {customBalance !== undefined
                       ? `R$ ${Number(customBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                       : (userRoles.comissoes ? `R$ ${Number(userRoles.comissoes.semanalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (stats ? `R$ ${stats.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00'))}
                   </span>
                   <div className="size-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <TrendingUp size={12} />
                   </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {customBalanceLabel || "Proteção Individual MBM"}
                </p>
                <div className="flex items-center gap-2">
                   <span className={`text-lg font-black tracking-tighter ${userRoles.isPolicyActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                     {userRoles.isPolicyActive ? 'R$ 5.000,00' : 'Plano Pendente'}
                   </span>
                   <div className={`size-6 rounded-full flex items-center justify-center ${userRoles.isPolicyActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Shield size={12} />
                   </div>
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-4">
                {/* Botão de Notificação Push Funcional */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="size-10 flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-primary-blue/5 transition-all relative bg-slate-50 rounded-xl group"
                  >
                    <Bell size={20} className="group-hover:animate-swing" />
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
                          className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-100 text-midnight"
                        >
                          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-black text-midnight uppercase tracking-wider">Notificações</h3>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => {
                                  handlePushNotification();
                                  setShowNotifications(false);
                                }}
                                className="text-[10px] font-black text-slate-400 uppercase hover:text-primary-blue"
                              >
                                Ativar Push
                              </button>
                              {unreadCount > 0 && (
                                <button 
                                  onClick={() => markAllAsRead()}
                                  className="text-[10px] font-black text-primary-blue uppercase hover:underline"
                                >
                                  Ler tudo
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((notification) => (
                                <div 
                                  key={notification.id}
                                  onClick={() => {
                                    if (!notification.is_read) markAsRead(notification.id);
                                  }}
                                  className={`p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary-blue/5' : ''}`}
                                >
                                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    notification.type === 'sale' ? 'bg-emerald-100 text-emerald-600' :
                                    notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                                    notification.type === 'stock' ? 'bg-amber-100 text-amber-600' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {notification.type === 'sale' ? <TrendingUp size={20} /> :
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
               
               <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-midnight leading-none mb-1">{profile?.full_name || 'Carregando...'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {userRoles.isMicrofranqueado 
                        ? (userRoles.microfranqueado?.is_primeiros_100 ? 'Microfranqueado (Primeiros 100)' : 'Microfranqueado CaZa')
                        : 'Afiliado Premium (Segurado)'}
                    </p>
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
               <div className="flex items-center justify-between mb-8">
                  <img 
                    src="/logo-dark.png" 
                    alt="CaZa dos Sorteios" 
                    className="h-9 w-auto object-contain" 
                  />
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
               </div>
               
               <nav className="flex-1 space-y-2 overflow-y-auto max-h-[70vh] no-scrollbar pr-2">
                  {activeMenuItems.map((item) => {
                    const isTermActive = location.pathname.startsWith('/afiliado/termo-adesao');
                    const isActive = item.path === '/afiliado/termo-adesao' 
                      ? isTermActive 
                      : location.pathname === item.path;

                    const termSubItems = [
                      { path: '/afiliado/termo-adesao', label: 'Termo Principal' },
                      { path: '/afiliado/termo-adesao/anexo-1', label: 'Anexo I - Regulamento' },
                      { path: '/afiliado/termo-adesao/anexo-2', label: 'Anexo II - Condições Gerais' },
                      { path: '/afiliado/termo-adesao/anexo-3', label: 'Anexo III - Tabela Indenização' },
                      { path: '/afiliado/termo-adesao/anexo-4', label: 'Anexo IV - Cobrança/Renovação' },
                      { path: '/afiliado/termo-adesao/anexo-5', label: 'Anexo V - Proteção Dados' },
                      { path: '/afiliado/termo-adesao/anexo-6', label: 'Anexo VI - Divulgação' },
                      { path: '/afiliado/termo-adesao/anexo-7', label: 'Anexo VII - Cancelamento' },
                      { path: '/afiliado/termo-adesao/anexo-8', label: 'Anexo VIII - Comissionamento' },
                      { path: '/afiliado/termo-adesao/anexo-9', label: 'Anexo IX - Telemedicina' },
                      { path: '/afiliado/termo-adesao/anexo-10', label: 'Anexo X - Qtde Sorteios' },
                      { path: '/afiliado/termo-adesao/anexo-11', label: 'Anexo XI - Docs Indenização' },
                      { path: '/afiliado/termo-adesao/anexo-12', label: 'Anexo XII - Cashback/Inadimplência' },
                    ];

                    return (
                      <div key={item.path} className="space-y-1">
                        <Link
                           to={item.path}
                           onClick={(e) => {
                             if (item.path === '/afiliado/termo-adesao') {
                               handleTermClick(e);
                             } else {
                               setIsMobileMenuOpen(false);
                             }
                           }}
                           className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                             isActive ? 'bg-primary-blue text-white shadow-lg' : 'text-slate-400'
                           }`}
                        >
                          <item.icon size={20} />
                          <span>{item.label}</span>
                          {item.path === '/afiliado/termo-adesao' && (
                            <motion.div
                              animate={{ rotate: isTermMenuExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className={`ml-auto ${isActive ? 'text-white' : 'text-slate-400'}`}
                            >
                              <ChevronRight size={16} />
                            </motion.div>
                          )}
                        </Link>
                        {item.path === '/afiliado/termo-adesao' && (
                          <AnimatePresence initial={false}>
                            {isTermMenuExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="pl-6 border-l-2 border-slate-100 ml-8 space-y-1 py-1 overflow-hidden"
                              >
                                {termSubItems.map((subItem) => {
                                  const isSubActive = location.pathname === subItem.path || (subItem.path === '/afiliado/termo-adesao' && (location.pathname === '/afiliado/termo-adesao/' || location.pathname === '/afiliado/termo-adesao'));
                                  return (
                                    <Link
                                      key={subItem.path}
                                      to={subItem.path}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className={`block py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                                        isSubActive 
                                          ? 'text-primary-blue bg-primary-blue/5' 
                                          : 'text-slate-400 hover:text-midnight hover:bg-slate-50'
                                      }`}
                                    >
                                      {subItem.label}
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-4 w-full px-6 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <LogOut size={20} />
                      Sair do Painel
                    </button>
                  </div>
                </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
