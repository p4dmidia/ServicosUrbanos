import React, { useState, useEffect } from 'react';
import {
    Lock,
    ArrowRight,
    ShieldCheck,
    LayoutGrid,
    CheckCircle2,
    Eye,
    EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Verificar se o usuário está autenticado via link de recuperação
    useEffect(() => {
        const checkSession = async () => {
            // Pequeno delay para garantir que o hash da URL seja processado pelo cliente Supabase
            setTimeout(async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setIsSessionValid(true);
                } else {
                    setIsSessionValid(false);
                    setError('Link de recuperação inválido ou expirado. Por favor, solicite um novo e-mail.');
                }
            }, 1000);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;
            
            setSuccess(true);
            toast.success('Senha redefinida com sucesso!');
            
            // Redirecionar após 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha');
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
                    {/* Reset Card */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        
                        {isSessionValid === null ? (
                            <div className="flex flex-col items-center py-12">
                                <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-400 font-medium">Validando seu acesso...</p>
                            </div>
                        ) : isSessionValid === false ? (
                            <div className="text-center py-8">
                                <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                                    <ShieldCheck size={48} />
                                </div>
                                <h2 className="text-2xl font-black mb-4">Acesso Inválido</h2>
                                <p className="text-slate-400 font-medium mb-8">
                                    {error || 'Link de recuperação inválido ou expirado.'}
                                </p>
                                <Link to="/esqueci-senha" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all">
                                    Solicitar novo link
                                </Link>
                            </div>
                        ) : !success ? (
                            <>
                                <div className="text-center mb-10">
                                    <div className="flex items-center justify-center gap-2 text-white mb-6">
                                        <div className="size-12 bg-primary-blue rounded-2xl flex items-center justify-center">
                                            <LayoutGrid size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-black mb-2 tracking-tight">Nova Senha</h1>
                                    <p className="text-slate-400 font-medium">Crie uma senha forte para sua segurança</p>
                                </div>

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
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

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
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
                                                Redefinir Senha
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
                                <h2 className="text-2xl font-black mb-4">Senha alterada!</h2>
                                <p className="text-slate-400 font-medium mb-8">
                                    Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Segurança em primeiro lugar
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
