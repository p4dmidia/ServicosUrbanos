import React, { useState } from 'react';
import {
    Mail,
    ArrowRight,
    ChevronLeft,
    ShieldCheck,
    LayoutGrid,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/redefinir-senha`,
            });

            if (authError) throw authError;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar e-mail de recuperação');
        } finally {
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
                    {/* Recovery Card */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        
                        {!success ? (
                            <>
                                <div className="text-center mb-10">
                                    <div className="flex items-center justify-center gap-2 text-white mb-6">
                                        <div className="size-12 bg-primary-blue rounded-2xl flex items-center justify-center">
                                            <LayoutGrid size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-black mb-2 tracking-tight">Recuperar Senha</h1>
                                    <p className="text-slate-400 font-medium">Informe seu e-mail para receber as instruções</p>
                                </div>

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail de cadastro</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                placeholder="exemplo@email.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-white placeholder:text-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full bg-emerald-500 hover:bg-emerald-600 text-midnight py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <div className="size-6 border-4 border-midnight/30 border-t-midnight rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Enviar Instruções
                                                <ArrowRight size={22} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="size-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black mb-4">Verifique seu e-mail</h2>
                                <p className="text-slate-400 font-medium mb-8">
                                    Enviamos um link de recuperação para <span className="text-white">{email}</span>. 
                                    Caso não encontre, verifique sua caixa de spam.
                                </p>
                                <button 
                                    onClick={() => setSuccess(false)}
                                    className="text-emerald-500 font-black uppercase tracking-widest text-xs hover:text-emerald-400 transition-colors"
                                >
                                    Tentar outro e-mail
                                </button>
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <Link to="/login" className="text-slate-400 font-bold hover:text-white transition-colors inline-flex items-center gap-2 group">
                                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                Voltar para o Login
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Segurança garantida Serviços Urbanos
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
