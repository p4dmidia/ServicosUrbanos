import React, { useState } from 'react';
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  LayoutGrid, 
  Mail, 
  Lock,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import WaitlistModal from '../components/WaitlistModal';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      // Buscar perfil para verificar permissões e redirecionar corretamente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil não encontrado para este usuário.');
      }

      if (profile.status === 'blocked') {
        await supabase.auth.signOut();
        throw new Error('Sua conta está bloqueada. Entre em contato com o suporte.');
      }

      await refreshProfile();

      // Redirecionamento simplificado: No contexto de login de lojista, 
      // sempre enviamos para o dashboard do lojista (desde que o papel seja permitido no App.tsx)
      toast.success('Bem-vindo ao Merchant Center!');
      navigate('/lojista/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
      toast.error(err.message || 'Erro ao realizar login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      {/* Left side: Visual/Info */}
      <div className="hidden md:flex md:w-1/2 bg-midnight p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] size-96 bg-primary-blue rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] size-96 bg-emerald-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group mb-20 uppercase text-xs font-black tracking-widest">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para o Shopping
          </Link>
          
          <div className="flex items-center gap-3 text-white mb-10">
            <div className="size-12 bg-primary-blue rounded-2xl flex items-center justify-center shadow-lg shadow-primary-blue/30">
              <LayoutGrid size={24} />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase italic leading-none block">URBA<span className="text-primary-blue">SHOP</span></span>
              <span className="text-[10px] font-black text-primary-blue uppercase tracking-[0.2em] opacity-80">Merchant Center</span>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-8 tracking-tighter italic">
            Gerencie sua operação em <span className="text-primary-blue">tempo real.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg font-medium leading-relaxed">
            Painel exclusivo para lojistas parceiros. Acompanhe pedidos, estoque e seu fluxo financeiro com a transparência que você precisa.
          </p>
        </div>

        <div className="relative z-10 pt-10 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Acesso seguro e criptografado</p>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="md:hidden w-full flex justify-start mb-8">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-midnight transition-colors group uppercase text-[10px] font-black tracking-widest">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar para o Shopping
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 text-midnight mb-12">
            <div className="size-10 bg-primary-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-blue/20">
              <LayoutGrid size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">URBA<span className="text-primary-blue">SHOP</span></span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-midnight mb-2 tracking-tighter uppercase italic">Acesso Restrito</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Insira suas credenciais de parceiro</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold group-hover:border-slate-200 text-midnight"
                  placeholder="exemplo@loja.com.br"
                  required
                />
                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                <a href="#" className="text-[10px] font-black text-primary-blue hover:underline uppercase tracking-widest">Esqueci a senha</a>
              </div>
               <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold group-hover:border-slate-200 text-midnight pr-14"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2"
              >
                <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-midnight hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-midnight/20 active:scale-[0.98] flex items-center justify-center gap-3 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar no Painel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Ainda não é um parceiro?</p>
            <button 
              onClick={() => setShowWaitlist(true)}
              className="inline-flex bg-slate-100 hover:bg-slate-200 text-midnight px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Candidatar minha Loja
            </button>
          </div>
        </div>

        <WaitlistModal 
          isOpen={showWaitlist} 
          onClose={() => setShowWaitlist(false)} 
        />

        <div className="absolute bottom-8 flex flex-col items-center gap-1">
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center">
            © 2026 Serviços Urbanos S.A. • merchant center v2.0
          </p>
          <p className="text-[8px] text-slate-400 lowercase font-medium tracking-normal text-center">
            Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors underline decoration-primary-blue/30">P4D Mídia</a>
          </p>
        </div>
      </div>
    </div>
  );
}
