import React, { useState } from 'react';
import { LayoutGrid, User as UserIcon, LogOut, ChevronDown, ShoppingBag, LayoutDashboard, Menu, X, Globe, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-midnight py-4 md:py-6 px-6 lg:px-20 text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden size-10 flex items-center justify-center bg-white/5 rounded-xl text-white"
                    >
                        <Menu size={20} />
                    </button>
                    <Link to="/" className="flex items-center gap-2">
                        {location.pathname.startsWith('/marketplace') || 
                         location.pathname.startsWith('/produto') || 
                         location.pathname.startsWith('/loja') || 
                         location.pathname.startsWith('/checkout') ? (
                            <>
                                <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                                    <LayoutGrid size={18} />
                                </div>
                                <span className="text-xl font-black tracking-tighter uppercase italic">URBA<span className="text-primary-blue">SHOP</span></span>
                            </>
                        ) : (
                            <>
                                 <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                                    <LayoutGrid size={18} />
                                </div>
                                <span className="text-xl font-black tracking-tighter uppercase italic">SERVIÇOS <span className="text-primary-blue">URBANOS</span></span>
                            </>
                        )}
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-accent' : 'hover:text-accent'}`}>Início</Link>
                    <Link to="/ecossistema" className={`text-sm font-medium transition-colors relative ${isActive('/ecossistema') ? 'text-accent' : 'hover:text-accent'}`}>
                        Ecossistema
                        {isActive('/ecossistema') && (
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent rounded-full" />
                        )}
                    </Link>
                    <Link to="/ganhe-dinheiro" className={`text-sm font-medium transition-colors ${isActive('/ganhe-dinheiro') ? 'text-accent' : 'hover:text-accent'}`}>Ganhe Dinheiro</Link>
                    <Link to="/marketplace" className={`text-sm font-medium transition-colors ${isActive('/marketplace') ? 'text-accent' : 'hover:text-accent'}`}>Marketplace</Link>
                </nav>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="relative">
                            <button 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 group px-2 py-1 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black tracking-tight">{profile?.full_name?.split(' ')[0] || 'Usuário'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{user.email?.split('@')[0]}</p>
                                </div>
                                <div className="size-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-accent/50 transition-all">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={18} className="text-slate-400" />
                                    )}
                                </div>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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
                                                        <UserIcon size={20} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-black truncate text-midnight">{profile?.full_name || 'Usuário'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
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
                                                            <UserIcon size={16} /> Meu Perfil
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
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-xs font-black uppercase tracking-wider group"
                                                >
                                                    <LogOut size={16} /> Sair da conta
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-accent transition-colors">Entrar</Link>
                            <Link to="/cadastro" className="bg-accent hover:bg-emerald-500 text-midnight px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-accent/20">
                                Criar Conta
                            </Link>
                        </>
                    )}
                </div>
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
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                                    {location.pathname.startsWith('/marketplace') || 
                                     location.pathname.startsWith('/produto') || 
                                     location.pathname.startsWith('/loja') || 
                                     location.pathname.startsWith('/checkout') ? (
                                        <>
                                            <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                                                <LayoutGrid size={18} />
                                            </div>
                                            <span className="text-xl font-black tracking-tighter uppercase italic">URBA<span className="text-primary-blue">SHOP</span></span>
                                        </>
                                    ) : (
                                        <>
                                             <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                                                <LayoutGrid size={18} />
                                            </div>
                                            <span className="text-xl font-black tracking-tighter uppercase italic">SERVIÇOS <span className="text-primary-blue">URBANOS</span></span>
                                        </>
                                    )}
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-2">
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isActive('/') ? 'bg-white/10 text-accent' : 'text-slate-400 hover:text-white'}`}>Início</Link>
                                <Link to="/ecossistema" onClick={() => setIsMobileMenuOpen(false)} className={`px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isActive('/ecossistema') ? 'bg-white/10 text-accent' : 'text-slate-400 hover:text-white'}`}>Ecossistema</Link>
                                <Link to="/ganhe-dinheiro" onClick={() => setIsMobileMenuOpen(false)} className={`px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isActive('/ganhe-dinheiro') ? 'bg-white/10 text-accent' : 'text-slate-400 hover:text-white'}`}>Ganhe Dinheiro</Link>
                                <Link to="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className={`px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isActive('/marketplace') ? 'bg-white/10 text-accent' : 'text-slate-400 hover:text-white'}`}>Marketplace</Link>
                            </nav>

                            <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-4 px-4 mb-4">
                                            <div className="size-12 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0">
                                                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-500 m-auto h-full" />}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-black text-sm text-white truncate">{profile?.full_name || 'Usuário'}</p>
                                                <p className="text-[10px] font-bold text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        {profile?.role === 'admin' ? (
                                            <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20">
                                                <ShieldCheck size={18} /> Painel Administrativo
                                            </Link>
                                        ) : (
                                            <Link to="/afiliado/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary-blue text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-blue/20">
                                                <LayoutDashboard size={18} /> Painel do Afiliado
                                            </Link>
                                        )}
                                        <button 
                                            onClick={async () => {
                                                await signOut();
                                                setIsMobileMenuOpen(false);
                                            }} 
                                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 transition-all"
                                        >
                                            <LogOut size={18} /> Sair
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-4 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs">Entrar</Link>
                                        <Link to="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-4 rounded-2xl bg-accent text-midnight font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20">Cadastrar</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
