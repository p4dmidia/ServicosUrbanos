import React, { useState } from 'react';
import {
    CheckCircle,
    User,
    Car,
    Store,
    Smartphone,
    TrendingUp,
    Lock,
    Eye,
    EyeOff,
    MapPin,
    ArrowRight,
    Globe,
    Instagram,
    Twitter,
    Linkedin,
    LayoutGrid,
    ShieldCheck,
    Info,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Cadastro() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [referrerId, setReferrerId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Load referral from storage
        const storedRef = localStorage.getItem('urba_referral');
        if (storedRef) {
            setReferralCode(storedRef);
            fetchReferrerName(storedRef);
        }
    }, []);

    const fetchReferrerName = async (codeOrId: string) => {
        if (!codeOrId || codeOrId.length < 3) {
            setReferrerName(null);
            setReferrerId(null);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            // 1. Try to find by friendly referral_code
            try {
                const { data: results } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('referral_code', codeOrId.toUpperCase())
                    .limit(1);
                
                const byCode = results && results.length > 0 ? results[0] : null;
                
                if (byCode) {
                    setReferrerName(byCode.full_name);
                    setReferrerId(byCode.id);
                    setIsSearching(false);
                    return;
                }
            } catch (e) {
                // Ignore errors
            }

            // 2. Fallback: Try to find by UUID (backward compatibility)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(codeOrId)) {
                const { data: byId } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('id', codeOrId)
                    .single();
                
                if (byId) {
                    setReferrerName(byId.full_name);
                    setReferrerId(byId.id);
                    setIsSearching(false);
                    return;
                }
            }

            setReferrerName(null);
            setReferrerId(null);
        } catch (err) {
            console.error("Erro ao buscar indicador:", err);
            setReferrerName(null);
            setReferrerId(null);
        } finally {
            setIsSearching(false);
        }
    };
    
    // Address States
    const [zipCode, setZipCode] = useState('');
    const [address, setAddress] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordTips, setPasswordTips] = useState<string[]>([]);

    const benefits = [
        "Acesso a todos os apps",
        "Participe do programa de Cashback",
        "Saques automáticos via PIX"
    ];

    const checkPasswordStrength = (pass: string) => {
        let strength = 0;
        let tips = [];

        if (pass.length === 0) {
            setPasswordStrength(0);
            setPasswordTips([]);
            return;
        }

        if (pass.length < 8) {
            tips.push("Mínimo de 8 caracteres");
        } else {
            strength += 25;
        }

        if (/[A-Z]/.test(pass)) {
            strength += 25;
        } else {
            tips.push("Use pelo menos uma letra maiúscula");
        }

        if (/[0-9]/.test(pass)) {
            strength += 25;
        } else {
            tips.push("Adicione pelo menos um número");
        }

        if (/[^A-Za-z0-9]/.test(pass)) {
            strength += 25;
        } else {
            tips.push("Use um caractere especial (ex: @#$)");
        }

        setPasswordStrength(strength);
        setPasswordTips(tips);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPassword(val);
        checkPasswordStrength(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        whatsapp: whatsapp,
                        cpf: cpf.replace(/\D/g, ''),
                        role: 'affiliate',
                        referred_by: referrerId || null,
                        address,
                        number,
                        neighborhood,
                        city,
                        state,
                        zip_code: zipCode.replace(/\D/g, '')
                    }
                }
            });

            if (signUpError) {
                throw signUpError;
            }

            if (data?.user?.identities?.length === 0) {
              setError("Este e-mail já está cadastrado ou não é válido.");
              setLoading(false);
              return;
            }

            toast.success('Conta criada com sucesso!', {
                style: {
                    borderRadius: '16px',
                    background: '#0a0e17',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                }
            });

            localStorage.removeItem('urba_referral');
            navigate('/login');
        } catch (err: any) {
            console.error("Erro no Supabase Auth:", err);
            
            let userMessage = "Ocorreu um erro inesperado ao salvar os dados.";
            
            if (err.message === "Database error saving new user") {
                userMessage = "Erro no banco de dados. Por favor, tente novamente mais tarde.";
            } else if (err.message.includes("User already registered")) {
                userMessage = "Este e-mail já está cadastrado.";
            } else if (err.message.includes("Password should be at least")) {
                userMessage = "A senha deve ter pelo menos 6 caracteres.";
            }

            setError(userMessage);
            toast.error(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 25) return 'bg-red-500';
        if (passwordStrength <= 50) return 'bg-orange-500';
        if (passwordStrength <= 75) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getStrengthText = () => {
        if (passwordStrength <= 25) return 'Muito Fraca';
        if (passwordStrength <= 50) return 'Fraca';
        if (passwordStrength <= 75) return 'Média';
        return 'Forte';
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6 max-w-md"
                >
                    <div className="size-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-midnight">Cadastro Realizado!</h1>
                    <p className="text-slate-500">
                        Enviamos um e-mail de confirmação. Redirecionando você para a tela de login em alguns instantes...
                    </p>
                    <div className="size-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans bg-white overflow-x-hidden">
            <Header />

            <main className="flex-1 flex flex-col lg:flex-row">
                {/* Coluna da Esquerda (Informativa) */}
                <div className="lg:w-1/2 bg-midnight p-12 lg:p-24 flex flex-col justify-center text-white relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-blue rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-24 right-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <h2 className="text-4xl lg:text-7xl font-black mb-10 leading-none tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
                            Junte-se à <br />
                            <span className="text-emerald-500">revolução.</span>
                        </h2>

                        <div className="space-y-6 mb-16">
                            {benefits.map((benefit, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-5 group"
                                >
                                    <div className="size-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={22} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight text-slate-100">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-xl max-w-sm relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-5 mb-5 relative z-10">
                                <div className="size-14 rounded-2xl bg-primary-blue/20 flex items-center justify-center text-primary-blue shadow-lg shadow-primary-blue/20 transform -rotate-12 group-hover:rotate-0 transition-transform">
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Passaporte Urba</p>
                                    <p className="font-black text-white text-lg leading-none uppercase italic">Cashback Ativo</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed relative z-10 font-bold">
                                Cada indicação e cada uso gera bônus reais. O ecossistema que valoriza quem faz a cidade girar.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Coluna da Direita (Formulário) */}
                <div className="lg:w-1/2 p-10 lg:p-24 flex flex-col justify-start bg-white lg:overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xl mx-auto w-full"
                    >
                        <div className="mb-12">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3 block">Welcome to Urba</span>
                            <h1 className="text-4xl lg:text-5xl font-black text-midnight mb-3 tracking-tighter uppercase italic leading-none">Crie sua Conta</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Acesso Unificado para todo o Ecossistema Urbano</p>
                        </div>

                        <form className="space-y-12 pb-20" onSubmit={handleSubmit}>
                            {/* Informativo de Cadastro Único */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem] flex items-center gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 size-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                                <div className="size-16 rounded-[1.25rem] bg-emerald-500 text-midnight flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/30 transform transition-transform group-hover:scale-105 group-hover:rotate-3">
                                    <LayoutGrid size={32} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Multiconectado</p>
                                    <p className="text-sm text-emerald-950 font-black leading-tight">Uma única conta para Moby, Food, Pay, Market e muito mais.</p>
                                </div>
                            </div>

                            {/* Seção 1: Dados Pessoais */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2 underline-offset-8">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">01. Identificação Pessoal</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="João da Silva Pereira"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                                        <div className="relative group">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                required
                                                type="tel"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="(00) 90000-0000"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço de E-mail</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="contato@exemplo.com"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (CPF)</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={cpf}
                                                onChange={(e) => setCpf(e.target.value)}
                                                placeholder="000.000.000-00"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Localização */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">02. Endereço e Localização</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                                        <input
                                            required
                                            type="text"
                                            value={zipCode}
                                            onChange={(e) => setZipCode(e.target.value)}
                                            placeholder="00000-000"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Rua</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Rua, Av, Travessa..."
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                        <input
                                            required
                                            type="text"
                                            value={number}
                                            onChange={(e) => setNumber(e.target.value)}
                                            placeholder="123"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                        <input
                                            required
                                            type="text"
                                            value={neighborhood}
                                            onChange={(e) => setNeighborhood(e.target.value)}
                                            placeholder="Ex: Centro"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade / UF</label>
                                        <input
                                            required
                                            type="text"
                                            value={`${city}${state ? ' / ' + state : ''}`}
                                            onChange={(e) => {
                                                const [c, s] = e.target.value.split(' / ');
                                                setCity(c || '');
                                                setState(s || '');
                                            }}
                                            placeholder="São Paulo / SP"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção 3: Segurança */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">03. Senha e Segurança</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Crie uma Senha Forte</label>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${getStrengthColor().replace('bg-', 'text-')}`}>
                                                {getStrengthText()}
                                            </span>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500" size={18} />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={handlePasswordChange}
                                                placeholder="Pelo menos 8 caracteres"
                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-midnight transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        
                                        {/* Password Strength Meter */}
                                        <div className="flex gap-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden mt-1">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${passwordStrength}%` }}
                                                className={`h-full ${getStrengthColor()} transition-all duration-500`}
                                            />
                                        </div>

                                        {/* Security Tips */}
                                        <AnimatePresence>
                                            {passwordTips.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                                                >
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Info size={12} className="text-emerald-500" />
                                                        Dicas de Segurança:
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {passwordTips.map((tip, idx) => (
                                                            <li key={idx} className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                                                <div className="size-1 rounded-full bg-slate-300" />
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirme sua Senha</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500" size={18} />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Repita a senha anterior"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Código de Indicação (Optional) */}
                            <div className="pt-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Cód. Indicação (Opcional)</label>
                                <div className="relative group">
                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setReferralCode(val);
                                            fetchReferrerName(val);
                                        }}
                                        placeholder="EX: A1B2C3"
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300 uppercase"
                                    />
                                </div>
                                {referrerName ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 ml-1 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4 group"
                                    >
                                        <div className="size-10 rounded-xl bg-emerald-500 text-midnight flex items-center justify-center shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition-transform">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Indicação Confirmada</p>
                                            <p className="text-sm font-black text-midnight uppercase italic">
                                                Indicado por: <span className="text-emerald-600 underline underline-offset-4">{referrerName}</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : isSearching && (
                                    <div className="mt-2 ml-1 flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-slate-200 animate-pulse" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                            Buscando afiliado...
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Mensagem de Erro */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-5 bg-red-500/10 border-2 border-red-500/20 rounded-[2rem] text-red-500 text-xs font-black uppercase text-center flex items-center justify-center gap-4 shadow-2xl shadow-red-500/10"
                                    >
                                        <div className="size-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <span className="flex-1 text-left tracking-tight leading-relaxed">
                                            {error}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Termos e Submit */}
                            <div className="space-y-8 pt-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <input
                                        required
                                        type="checkbox"
                                        id="terms"
                                        className="mt-1 size-6 rounded-lg border-slate-200 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer transition-all"
                                    />
                                    <label htmlFor="terms" className="text-xs text-slate-500 leading-normal cursor-pointer font-medium">
                                        Li e aceito os <span className="text-midnight font-black underline hover:text-emerald-600 transition-colors">Termos de Uso</span>, as diretrizes do ecossistema e as políticas de privacidade da <span className="font-black">Services Urbanos S.A.</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-midnight px-10 py-6 rounded-[2rem] text-xl font-black transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-4 active:scale-[0.98] uppercase tracking-tighter disabled:opacity-50 group group:active:scale-95"
                                >
                                    {loading ? (
                                        <div className="size-6 border-4 border-midnight/30 border-t-midnight rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Finalizar e Entrar
                                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                    Já possui acesso? <Link to="/login" className="text-emerald-600 hover:text-emerald-500 transition-colors border-b-2 border-emerald-600/20">Faça login agora</Link>
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>

            {/* Footer simples reutilizado do padrão */}
            <footer className="bg-midnight text-slate-500 py-12 px-6 lg:px-20 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 text-white">
                        <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                            <LayoutGrid size={14} />
                        </div>
                        <span className="text-lg font-bold">Serviços Urbanos</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold">© 2026 Serviços Urbanos Tecnologia S.A.</p>
                        <p className="opacity-50 text-[9px] lowercase font-medium tracking-normal">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">P4D Mídia</a></p>
                    </div>

                    <div className="flex gap-6">
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
