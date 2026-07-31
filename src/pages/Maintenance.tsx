import React from 'react';
import { 
  Wrench, 
  LayoutGrid, 
  Lock,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Maintenance() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-midnight text-white overflow-hidden relative">
      {/* Dynamic Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Header / Logo */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center shadow-lg shadow-primary-blue/20">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SERVIÇOS URBANOS
          </span>
        </div>
        
        <Link 
          to="/login"
          className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-2 border border-white/5 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md"
        >
          <Lock size={12} />
          Entrar no Sistema
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-2xl text-center"
        >
          {/* Animated Maintenance Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative size-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <Wrench size={44} className="text-emerald-500" />
              </motion.div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Estamos em <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-primary-blue bg-clip-text text-transparent">
              Manutenção
            </span>
          </h1>

          {/* Paragraph */}
          <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto mb-10 font-medium leading-relaxed">
            Estamos atualizando nossa plataforma com melhorias e novas funcionalidades incríveis para você. Voltaremos em breve!
          </p>

          {/* Progress / Status Bar */}
          <div className="max-w-xs mx-auto mb-12 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Status do Serviço</span>
              <span className="text-emerald-500">90% Concluído</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-primary-blue rounded-full"
                style={{ width: '90%' }}
              ></div>
            </div>
          </div>

          {/* Support / Quick Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://wa.me/5500000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-midnight px-6 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <MessageSquare size={20} />
              Suporte via WhatsApp
            </a>
            
            <Link 
              to="/lojista/login" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 rounded-2xl font-black transition-all backdrop-blur-md active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>Área do Lojista</span>
              <ArrowRight size={18} className="text-slate-400" />
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 relative z-10 text-center text-xs font-semibold text-slate-600 tracking-wider">
        © {new Date().getFullYear()} Serviços Urbanos. Todos os direitos reservados.
      </footer>
    </div>
  );
}
