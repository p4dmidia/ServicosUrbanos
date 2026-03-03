import { LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const location = useLocation();
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
                    <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-accent transition-colors">Entrar</Link>
                    <Link to="/cadastro" className="bg-accent hover:bg-emerald-500 text-midnight px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-accent/20">
                        Criar Conta
                    </Link>
                </div>
            </div>
        </header>
    );
}
