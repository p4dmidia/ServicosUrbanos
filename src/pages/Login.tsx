import React, { useState } from 'react';
import {
    LayoutGrid,
    Mail,
    Lock,
    ArrowRight,
    ChevronRight,
    Instagram,
    Twitter,
    Linkedin,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => setLoading(false), 2000); // Simulate login
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
                            <div className="inline-flex items-center justify-center size-16 bg-primary-blue rounded-3xl mb-6 shadow-xl shadow-primary-blue/20">
                                <LayoutGrid size={32} />
                            </div>
                            <h1 className="text-3xl font-black mb-2 tracking-tight">Bem-vindo de volta</h1>
                            <p className="text-slate-400 font-medium">Acesse sua conta para continuar</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Input: Email/CPF */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail ou CPF</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="exemplo@email.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-white placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Input: Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                                    <a href="#" className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">Esqueci a senha?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-white placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

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
                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">© 2024 Serviços Urbanos Tecnologia S.A.</p>
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
