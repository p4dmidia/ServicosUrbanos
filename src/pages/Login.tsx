import React, { useState } from 'react';
import {
    Mail,
    Lock,
    ArrowRight,
    ChevronRight,
    Instagram,
    Twitter,
    Linkedin,
    ShieldCheck,
    LayoutGrid,
    Eye,
    EyeOff,
    User,
    Hash
} from 'lucide-react';

import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

import { supabase } from '../lib/supabase';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let loginEmail = email;

            // Se o input não parece um e-mail (não tem @), tentamos buscar por CPF no banco
            if (!email.includes('@')) {
                const cleanCpf = email.replace(/\D/g, '');
                
                if (cleanCpf.length === 11) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('cpf', cleanCpf)
                        .single();
                    
                    if (profileError || !profile?.email) {
                        throw new Error('CPF não encontrado ou sem e-mail vinculado');
                    }
                    
                    loginEmail = profile.email;
                } else {
                    throw new Error('Formato de E-mail ou CPF inválido');
                }
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (authError) throw authError;

            // Sincroniza o e-mail no perfil (garante que o login por CPF funcione na próxima vez)
            if (data?.user?.email) {
                await supabase
                    .from('profiles')
                    .update({ email: data.user.email })
                    .eq('id', data.user.id);
            }


            // Buscar o perfil para saber para onde redirecionar
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            // Redireciona para o dashboard do afiliado
            if (profile?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/afiliado/dashboard');
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-midnight text-white overflow-hidden relative">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
            </div>

            <Header />

            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Login Card */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Top Branding Section */}
                        <div className="text-center mb-10">
                            <div className="flex items-center justify-center gap-2 text-white mb-6">
                                <div className="size-12 bg-primary-blue rounded-2xl flex items-center justify-center">
                                    <LayoutGrid size={24} className="text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-black mb-2 tracking-tight">Bem-vindo de volta</h1>
                            <p className="text-slate-400 font-medium">Acesse sua conta para continuar</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>

                            {/* Input: Email/CPF */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail ou CPF</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />

                                    <input
                                        type="text"
                                        placeholder="E-mail ou CPF"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-white placeholder:text-slate-600"
                                        required
                                    />

                                </div>
                            </div>

                            {/* Input: Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                                    <Link to="/esqueci-senha" className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">Esqueci a senha?</Link>
                                </div>
                                 <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-white placeholder:text-slate-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-emerald-500 hover:bg-emerald-600 text-midnight py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="size-6 border-4 border-midnight/30 border-t-midnight rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Entrar na Conta
                                        <ArrowRight size={22} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-slate-400 font-medium">
                                Não tem uma conta? <br />
                                <Link to="/cadastro" className="text-white font-black hover:text-emerald-500 transition-colors inline-flex items-center gap-1 mt-2 group">
                                    Crie sua conta grátis
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Social Proof info */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Acesso seguro via protocolo TLS
                    </div>
                </motion.div>
            </main>

            {/* Footer minimalista */}
            <footer className="p-8 text-center relative z-10 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">© 2026 Serviços Urbanos Tecnologia S.A.</p>
                        <p className="opacity-40 text-[9px] lowercase font-medium tracking-normal">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">P4D Mídia</a></p>
                    </div>
                    <div className="flex gap-6 opacity-40 hover:opacity-100 transition-opacity">
                        <a href="#" className="hover:text-emerald-500"><Instagram size={18} /></a>
                        <a href="#" className="hover:text-emerald-500"><Twitter size={18} /></a>
                        <a href="#" className="hover:text-emerald-500"><Linkedin size={18} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
