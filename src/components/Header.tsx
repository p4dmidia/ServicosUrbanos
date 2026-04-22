import React, { useState } from 'react';
import { LayoutGrid, User as UserIcon, LogOut, ChevronDown, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-midnight py-6 px-6 lg:px-20 text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                        <LayoutGrid size={18} />
                    </div>
                    <span className="text-xl font-black tracking-tighter">Serviços Urbanos</span>
                </Link>

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
        </header>
    );
}
