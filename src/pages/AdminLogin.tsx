import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Shorthand logic for admin login - trimming spaces and converting to lowercase
      const trimmedInput = email.trim().toLowerCase();
      const finalEmail = trimmedInput === 'admin' ? 'admin@admin.com' : email.trim();
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password.trim(),
      });

      if (authError) throw authError;

      // Verificar se o usuário tem permissão de admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado: Você não tem permissões administrativas.');
      }

      if (profile.status === 'blocked') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado: Sua conta administrativa está bloqueada.');
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login administrativo');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 text-white mb-6">
            <div className="size-14 bg-primary-blue rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-blue/20 transform -rotate-6 rotate-hover:rotate-0 transition-transform">
              <LayoutGrid size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">SERVIÇOS <span className="text-primary-blue">URBANOS</span></h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-2">Acesso Restrito ao Ecossistema</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#0a0e17] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Administrativo</label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@servicosurbanos.com" 
                  className="w-full bg-white/5 border border-white/5 px-6 py-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-white placeholder:text-slate-600"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Segurança</label>
                <button type="button" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Esqueci a senha</button>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full bg-white/5 border border-white/5 px-6 py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-white placeholder:text-slate-600"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2"
              >
                <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Zap size={20} />
                </motion.div>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          © 2026 Serviços Urbanos S.A. <br />
          SISTEMA DE MONITORAMENTO DE ALTA SEGURANÇA
        </p>
      </motion.div>
    </div>
  );
}
