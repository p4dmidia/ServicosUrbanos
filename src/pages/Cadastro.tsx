import React, { useState, useEffect } from 'react';
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
    AlertTriangle,
    X,
    Target,
    Building2,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Empresa Matriz (Fallback Padrão para evitar afiliados órfãos)
const SIC_COMERCIO_ID = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
const SIC_COMERCIO_CODE = 'A03A7B';
const SIC_COMERCIO_NAME = 'Sic Comercio de Produtos Alimentícios e Serviços Ltda.';

export default function Cadastro() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Sponsor (Patrocinador MMN)
    const [referralCode, setReferralCode] = useState('');
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [referrerId, setReferrerId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isReferralLocked, setIsReferralLocked] = useState(false);

    // Reseller (Revendedor Regional)
    const [resellerCode, setResellerCode] = useState('');
    const [resellerName, setResellerName] = useState<string | null>(null);
    const [resellerId, setResellerId] = useState<string | null>(null);
    const [isSearchingReseller, setIsSearchingReseller] = useState(false);
    const [isResellerLocked, setIsResellerLocked] = useState(false);
    const [isSameAsReseller, setIsSameAsReseller] = useState(false);

    const [bankName, setBankName] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [bankBranch, setBankBranch] = useState('');
    const [bankAccount, setBankAccount] = useState('');

    useEffect(() => {
        // 1. Ler parâmetros da URL
        const refParam = searchParams.get('ref') || searchParams.get('indicador');
        const revParam = searchParams.get('rev') || searchParams.get('reseller') || searchParams.get('revendedor');

        // 2. Revendedor Regional
        const storedRev = revParam || localStorage.getItem('urba_reseller');
        if (storedRev) {
            setResellerCode(storedRev);
            fetchResellerName(storedRev);
            if (revParam) setIsResellerLocked(true);
        }

        // 3. Patrocinador MMN
        // Se o ref for igual ao revendedor, ignorar para que o campo comece vazio!
        const isRefSame = (refParam && storedRev && refParam.trim().toUpperCase() === storedRev.trim().toUpperCase()) ||
                          (localStorage.getItem('urba_referral')?.trim().toUpperCase() === storedRev?.trim().toUpperCase());

        if (refParam && !isRefSame) {
            setReferralCode(refParam);
            fetchReferrerName(refParam);
        } else {
            setReferralCode('');
            setReferrerName(null);
            setReferrerId(null);
            setIsReferralLocked(false);
            setIsSameAsReseller(false);
            localStorage.removeItem('urba_referral');
        }
    }, [searchParams]);

    const fetchReferrerName = async (codeOrId: string) => {
        if (!codeOrId || codeOrId.trim().length < 3) {
            setReferrerName(null);
            setReferrerId(null);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const cleanCode = codeOrId.trim().toUpperCase();
            const cleanCpf = codeOrId.replace(/\D/g, '');

            const { data: results } = await supabase
                .from('profiles')
                .select('id, full_name, referral_code')
                .or(`referral_code.eq.${cleanCode},cpf.eq.${cleanCpf || 'none'}`)
                .limit(1);

            const byCode = results && results.length > 0 ? results[0] : null;

            if (byCode) {
                setReferrerName(byCode.full_name);
                setReferrerId(byCode.id);
                setIsSearching(false);
                return;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(codeOrId.trim())) {
                const { data: byId } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('id', codeOrId.trim())
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

    const fetchResellerName = async (codeOrId: string) => {
        if (!codeOrId || codeOrId.trim().length < 3) {
            setResellerName(null);
            setResellerId(null);
            setIsSearchingReseller(false);
            return;
        }

        setIsSearchingReseller(true);
        try {
            const cleanCode = codeOrId.trim().toUpperCase();
            const cleanCpf = codeOrId.replace(/\D/g, '');

            const { data: results } = await supabase
                .from('profiles')
                .select('id, full_name, referral_code, role')
                .or(`referral_code.eq.${cleanCode},cpf.eq.${cleanCpf || 'none'}`)
                .limit(1);

            const found = results && results.length > 0 ? results[0] : null;
            if (found) {
                setResellerName(found.full_name);
                setResellerId(found.id);
                setIsSearchingReseller(false);
                return;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(codeOrId.trim())) {
                const { data: byId } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('id', codeOrId.trim())
                    .single();

                if (byId) {
                    setResellerName(byId.full_name);
                    setResellerId(byId.id);
                    setIsSearchingReseller(false);
                    return;
                }
            }

            setResellerName(null);
            setResellerId(null);
        } catch (err) {
            console.error("Erro ao buscar revendedor:", err);
            setResellerName(null);
            setResellerId(null);
        } finally {
            setIsSearchingReseller(false);
        }
    };

    // Address States
    const [zipCode, setZipCode] = useState('');
    const [address, setAddress] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, '');

        let formatted = numeric;
        if (numeric.length > 5) {
            formatted = `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
        }

        setZipCode(formatted);

        if (numeric.length === 8) {
            const loadingToast = toast.loading('Buscando CEP...', {
                style: {
                    borderRadius: '16px',
                    background: '#0a0e17',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                }
            });
            try {
                const response = await fetch(`https://viacep.com.br/ws/${numeric}/json/`);
                const data = await response.json();

                if (data && !data.erro) {
                    setAddress(data.logradouro || '');
                    setNeighborhood(data.bairro || '');
                    setCity(data.localidade || '');
                    setState(data.uf || '');

                    toast.success('Endereço preenchido automaticamente!', {
                        id: loadingToast,
                        style: {
                            borderRadius: '16px',
                            background: '#0a0e17',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }
                    });

                    // Focus number input
                    setTimeout(() => {
                        const numInput = document.getElementById('numero');
                        if (numInput) {
                            numInput.focus();
                        }
                    }, 50);
                } else {
                    toast.error('CEP não encontrado.', { id: loadingToast });
                }
            } catch (err) {
                console.error("Erro ao buscar CEP:", err);
                toast.error('Falha ao conectar com o serviço de busca de CEP.', { id: loadingToast });
            }
        }
    };

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordTips, setPasswordTips] = useState<string[]>([]);

    const benefits = [
        "Acesso a todos os apps",
        "Participe do programa de Cashback",
        "Atualização automática dos seus Cashbacks"
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

        if (!termsAccepted) {
            setError("Você precisa aceitar os Termos de Uso e Políticas de Privacidade.");
            setLoading(false);
            return;
        }

        if (!bankName || !pixKey || !bankBranch || !bankAccount) {
            setError("Por favor, preencha todos os dados bancários e chave PIX.");
            setLoading(false);
            return;
        }

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

        const finalSponsorId = referrerId || SIC_COMERCIO_ID;
        const finalResellerId = resellerId || SIC_COMERCIO_ID;

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
                        referred_by: finalSponsorId,
                        reseller_id: finalResellerId,
                        address,
                        number,
                        neighborhood,
                        city,
                        state,
                        zip_code: zipCode.replace(/\D/g, ''),
                        birth_date: birthDate,
                        gender: gender,
                        bank_name: bankName,
                        bank_branch: bankBranch,
                        bank_account: bankAccount,
                        pix_key: pixKey
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

            if (data?.user?.id) {
                await supabase.from('profiles').update({
                    full_name: fullName,
                    whatsapp: whatsapp,
                    cpf: cpf.replace(/\D/g, ''),
                    role: 'affiliate',
                    referred_by: finalSponsorId,
                    reseller_id: finalResellerId,
                    address,
                    number,
                    neighborhood,
                    city,
                    state,
                    zip_code: zipCode.replace(/\D/g, ''),
                    birth_date: birthDate,
                    gender: gender,
                    bank_name: bankName,
                    bank_branch: bankBranch,
                    bank_account: bankAccount,
                    pix_key: pixKey
                }).eq('id', data.user.id);
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
            localStorage.removeItem('urba_reseller');

            // Login automático e direcionamento para ativação do plano
            try {
                const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                if (!signInErr) {
                    navigate('/afiliado/renovacoes');
                    return;
                }
            } catch (loginErr) {
                console.warn('Auto login warning:', loginErr);
            }

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
            <PWAInstallPrompt />

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
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                        <div className="relative group">
                                            <input
                                                required
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
                                        <div className="relative group">
                                            <select
                                                required
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight appearance-none"
                                            >
                                                <option value="" disabled>Selecione...</option>
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
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
                                            id="cep"
                                            value={zipCode}
                                            onChange={handleZipCodeChange}
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
                                                id="logradouro"
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
                                            id="numero"
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
                                            id="bairro"
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
                                            id="cidade_uf"
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

                            {/* Seção 3: Dados Bancários / PIX */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">03. Dados Bancários / PIX</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                                        <input
                                            required
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            placeholder="Ex: Itaú, Nubank, Agibank..."
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                                        <input
                                            required
                                            type="text"
                                            value={pixKey}
                                            onChange={(e) => setPixKey(e.target.value)}
                                            placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                                        <input
                                            required
                                            type="text"
                                            value={bankBranch}
                                            onChange={(e) => setBankBranch(e.target.value)}
                                            placeholder="Ex: 0001"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta com dígito</label>
                                        <input
                                            required
                                            type="text"
                                            value={bankAccount}
                                            onChange={(e) => setBankAccount(e.target.value)}
                                            placeholder="Ex: 12345-6"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção 4: Segurança */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">04. Senha e Segurança</h3>
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

                            {/* Seção 5: Indicações e Liderança Regional */}
                            <div className="pt-4 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">05. Indicação e Liderança Regional</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Código de Indicação (MMN Sponsor) */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                Cód. Patrocinador MMN (Opcional)
                                            </label>
                                            {isSameAsReseller && (
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                                    Mesmo do Revendedor
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="text"
                                                value={referralCode}
                                                onChange={(e) => {
                                                    if (isSameAsReseller) return;
                                                    const val = e.target.value;
                                                    setReferralCode(val);
                                                    fetchReferrerName(val);
                                                }}
                                                disabled={isSameAsReseller}
                                                placeholder="EX: A1B2C3 ou CPF (ou em branco)"
                                                className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300 uppercase ${isSameAsReseller ? 'opacity-70 cursor-not-allowed bg-slate-100/50' : ''}`}
                                            />
                                        </div>
                                        {referrerName ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-1 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3 group"
                                            >
                                                <div className="size-8 rounded-xl bg-emerald-500 text-midnight flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                                                    <User size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Indicador Confirmado</p>
                                                    <p className="text-xs font-black text-midnight uppercase truncate">{referrerName}</p>
                                                </div>
                                            </motion.div>
                                        ) : isSearching && (
                                            <div className="mt-1 ml-1 flex items-center gap-2">
                                                <div className="size-1.5 rounded-full bg-slate-200 animate-pulse" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                    Buscando patrocinador...
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Código do Revendedor Regional */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                                            Cód. Revendedor Regional (Opcional)
                                        </label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="text"
                                                value={resellerCode}
                                                onChange={(e) => {
                                                    if (isResellerLocked) return;
                                                    const val = e.target.value;
                                                    setResellerCode(val);
                                                    fetchResellerName(val);
                                                }}
                                                disabled={isResellerLocked}
                                                placeholder="EX: REV123 ou CPF"
                                                className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-bold text-midnight placeholder:text-slate-300 uppercase ${isResellerLocked ? 'opacity-70 cursor-not-allowed bg-slate-100/50' : ''}`}
                                            />
                                        </div>
                                        {resellerName ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-1 p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center gap-3 group"
                                            >
                                                <div className="size-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                                                    <Target size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-none mb-0.5">Revendedor Confirmado</p>
                                                    <p className="text-xs font-black text-midnight uppercase truncate">{resellerName}</p>
                                                </div>
                                            </motion.div>
                                        ) : isSearchingReseller && (
                                            <div className="mt-1 ml-1 flex items-center gap-2">
                                                <div className="size-1.5 rounded-full bg-slate-200 animate-pulse" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                    Buscando revendedor...
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Checkbox de Indicação pelo Revendedor */}
                                    {resellerCode && (
                                        <div className="md:col-span-2">
                                            <label className="flex items-start sm:items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl cursor-pointer hover:bg-amber-500/10 transition-all select-none group">
                                                <input
                                                    type="checkbox"
                                                    checked={isSameAsReseller}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setIsSameAsReseller(checked);
                                                        if (checked) {
                                                            setReferralCode(resellerCode);
                                                            fetchReferrerName(resellerCode);
                                                            setIsReferralLocked(true);
                                                        } else {
                                                            setReferralCode('');
                                                            setReferrerName(null);
                                                            setReferrerId(null);
                                                            setIsReferralLocked(false);
                                                        }
                                                    }}
                                                    className="mt-0.5 sm:mt-0 size-5 rounded-lg text-amber-500 focus:ring-amber-500 border-slate-300 accent-amber-500 cursor-pointer shrink-0"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-midnight group-hover:text-amber-600 transition-colors">
                                                        Fui indicado diretamente por este revendedor {resellerName ? `(${resellerName})` : ''}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        Marque esta opção se o revendedor for também seu patrocinador MMN. Caso outra pessoa tenha te indicado, deixe desmarcado e digite o código dela no campo ao lado.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

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
                                        checked={termsAccepted}
                                        onChange={() => {
                                            if (!termsAccepted) {
                                                setShowTermsModal(true);
                                            } else {
                                                setTermsAccepted(false);
                                            }
                                        }}
                                        className="mt-1 size-6 rounded-lg border-slate-200 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer transition-all"
                                    />
                                    <label htmlFor="terms" className="text-xs text-slate-500 leading-normal cursor-pointer font-medium">
                                        Li e aceito os <Link to="/termos-uso" onClick={(e) => e.stopPropagation()} className="text-midnight font-black underline hover:text-emerald-600 transition-colors">Termos de Uso</Link>, as diretrizes do ecossistema e as <Link to="/termos-privacidade" onClick={(e) => e.stopPropagation()} className="text-midnight font-black underline hover:text-emerald-600 transition-colors">políticas de privacidade</Link> da <span className="font-black">Services Urbanos S.A.</span>
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
                        <p className="opacity-50 text-[9px] lowercase font-medium tracking-normal">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">P4D Mídia</a> | <Link to="/termos-uso" className="hover:text-emerald-500 transition-colors">Termos de Uso</Link> | <Link to="/termos-privacidade" className="hover:text-emerald-500 transition-colors">Termos de Privacidade</Link> | <Link to="/politica-cookies" className="hover:text-emerald-500 transition-colors">Política de Cookies</Link></p>
                    </div>

                    <div className="flex gap-6">
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
            </footer>

            {/* Modal de Resumo dos Termos */}
            <AnimatePresence>
                {showTermsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTermsModal(false)}
                            className="fixed inset-0 bg-midnight/90 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] z-10 border border-slate-100"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-500 text-midnight flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <ShieldCheck size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-midnight uppercase italic tracking-tight">
                                            Resumo dos Anexos I a XI – Seguro Vida Light R$ 5.000,00
                                        </h3>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                            Termo de Aceite Digital Simplificado
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(false)}
                                    className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-midnight"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed max-h-[50vh]">
                                <ul className="space-y-4">
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo I – Regulamento da Promoção:</strong> Sorteios nos 4 últimos domingos de cada mês; se houver 5 domingos, desconsidera-se o primeiro.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo II – Condições Gerais:</strong> Direitos e deveres do segurado em relação às coberturas contratadas.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo III – Tabela de Indenização:</strong> Percentuais aplicados em casos de invalidez permanente por acidente.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo IV – Cobrança e Renovação:</strong> Pagamento mensal, trimestral, semestral ou anual; necessidade de renovação para manter cobertura e sorteios.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo V – Proteção de Dados (LGPD):</strong> Tratamento seguro e transparente das informações pessoais.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo VI – Divulgação:</strong> Resultados dos sorteios comunicados por e-mail e dashboard; uso da imagem dos ganhadores mediante anuência.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo VII – Cancelamento e Exclusão:</strong> Perda de direitos por inadimplência, fraude ou descumprimento das regras.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo VIII – Comissionamento (MMN):</strong> Regras de comissões por indicações confirmadas e pagas.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo IX – Telemedicina:</strong> Consultas online disponíveis enquanto a apólice estiver ativa e adimplente.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <div className="flex flex-col gap-1 w-full">
                                            <span>
                                                <strong className="text-midnight font-bold">Anexo X – Quantidade de Sorteios por Modalidade:</strong>
                                            </span>
                                            <ul className="pl-6 space-y-1 list-disc text-slate-500">
                                                <li><strong className="text-midnight font-bold">Mensal:</strong> 4 sorteios/mês</li>
                                                <li><strong className="text-midnight font-bold">Trimestral:</strong> 12 sorteios/período</li>
                                                <li><strong className="text-midnight font-bold">Semestral:</strong> 24 sorteios/período</li>
                                                <li><strong className="text-midnight font-bold">Anual:</strong> 48 sorteios/período 👉 Renovação obrigatória via dashboard para continuidade nos sorteios.</li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        <span>
                                            <strong className="text-midnight font-bold">Anexo XI – Documentos para Indenização:</strong> Formulário de Aviso de Sinistro, Certificado Individual, RG/CPF, laudos médicos, folha de anestesia (quando aplicável), atestado de óbito e demais documentos solicitados pela seguradora.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
                                <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wide">
                                    Ao aceitar digitalmente, o AFILIADO declara estar ciente e concorda com todas as condições acima.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(false)}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-midnight py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                                    >
                                        Recusar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTermsAccepted(true);
                                            setShowTermsModal(false);
                                            toast.success('Termos aceitos!', {
                                                style: {
                                                    borderRadius: '16px',
                                                    background: '#0a0e17',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px'
                                                }
                                            });
                                        }}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-midnight py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Aceitar e Confirmar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
