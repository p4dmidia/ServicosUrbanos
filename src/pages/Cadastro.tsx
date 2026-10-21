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
    Sparkles,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
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
    const [termoHash, setTermoHash] = useState<string>('');

    // Escolha da Modalidade (Afiliado Premium Seguro Vida Light vs Microfranqueado MMN)
    const [accountProduct, setAccountProduct] = useState<'seguro' | 'microfranqueado'>(() => {
        const p = (searchParams.get('tipo') || searchParams.get('produto') || '').toLowerCase();
        if (p.includes('micro') || p.includes('franquia') || p.includes('mmn')) return 'microfranqueado';
        return 'seguro';
    });

    // Modalidade Tributária do Cadastro Inicial: Sempre Pessoa Física (PF)
    const personType: 'PF' = 'PF';

    // Função para calcular SHA-256 do Termo de Aceite
    const generateContractHash = async (content: string) => {
        try {
            const msgUint8 = new TextEncoder().encode(content);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            return `SHA256-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
    };

    // Form States (Pessoa Física / Geral)
    const [fullName, setFullName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const maxBirthDate = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d.toISOString().split('T')[0];
    })();

    // Formatadores de Documentos
    const formatCpf = (val: string) => {
        const num = val.replace(/\D/g, '').slice(0, 11);
        if (num.length <= 3) return num;
        if (num.length <= 6) return `${num.slice(0, 3)}.${num.slice(3)}`;
        if (num.length <= 9) return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6)}`;
        return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6, 9)}-${num.slice(9)}`;
    };

    const formatCnpj = (val: string) => {
        const num = val.replace(/\D/g, '').slice(0, 14);
        if (num.length <= 2) return num;
        if (num.length <= 5) return `${num.slice(0, 2)}.${num.slice(2)}`;
        if (num.length <= 8) return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5)}`;
        if (num.length <= 12) return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}/${num.slice(8)}`;
        return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}/${num.slice(8, 12)}-${num.slice(12)}`;
    };

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
    const [isIndicatedViaLink, setIsIndicatedViaLink] = useState(false);

    const [bankName, setBankName] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [bankBranch, setBankBranch] = useState('');
    const [bankAccount, setBankAccount] = useState('');

    useEffect(() => {
        // 1. Ler parâmetros da URL (prioridade máxima) ou resgatar da sessão ativa
        const refParam = searchParams.get('ref') || searchParams.get('indicador');
        let activeRef = refParam;

        if (refParam) {
            try {
                sessionStorage.setItem('urba_referral', refParam);
            } catch (e) {}
        } else {
            try {
                activeRef = sessionStorage.getItem('urba_referral');
            } catch (e) {}
        }

        if (activeRef && activeRef.trim().length >= 3) {
            setIsIndicatedViaLink(true);
            setReferralCode(activeRef.trim());
            setIsReferralLocked(true);
            fetchReferrerName(activeRef.trim());
        } else {
            // Acesso direto pelo site (sem link de indicação)
            try {
                sessionStorage.removeItem('urba_referral');
                localStorage.removeItem('urba_referral');
                localStorage.removeItem('urba_reseller');
            } catch (e) {}

            setIsIndicatedViaLink(false);
            setReferralCode('');
            setReferrerName(null);
            setReferrerId(null);
            setResellerCode('');
            setResellerName(null);
            setResellerId(null);
            setIsReferralLocked(false);
            setIsResellerLocked(false);
            setIsSameAsReseller(false);
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
                .select('id, full_name, referral_code, reseller_id, role')
                .or(`referral_code.eq.${cleanCode},cpf.eq.${cleanCpf || 'none'}`)
                .limit(1);

            let sponsor = results && results.length > 0 ? results[0] : null;

            if (!sponsor) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(codeOrId.trim())) {
                    const { data: byId } = await supabase
                        .from('profiles')
                        .select('id, full_name, referral_code, reseller_id, role')
                        .eq('id', codeOrId.trim())
                        .single();
                    if (byId) sponsor = byId;
                }
            }

            if (sponsor) {
                setReferrerName(sponsor.full_name);
                setReferrerId(sponsor.id);
                setReferralCode(sponsor.referral_code || sponsor.id);
                setIsReferralLocked(true);
                setIsIndicatedViaLink(true);

                // Hierarquia blindada: define o revendedor regional direto do banco de dados (impossível fraudar via URL)
                if (sponsor.role === 'regional_reseller') {
                    setResellerCode(sponsor.referral_code || sponsor.id);
                    setResellerName(sponsor.full_name);
                    setResellerId(sponsor.id);
                    setIsResellerLocked(true);
                } else if (sponsor.reseller_id) {
                    const { data: resData } = await supabase
                        .from('profiles')
                        .select('id, full_name, referral_code, role')
                        .eq('id', sponsor.reseller_id)
                        .maybeSingle();

                    if (resData) {
                        setResellerCode(resData.referral_code || resData.id);
                        setResellerName(resData.full_name);
                        setResellerId(resData.id);
                        setIsResellerLocked(true);
                    } else {
                        setResellerCode(SIC_COMERCIO_CODE);
                        setResellerName(SIC_COMERCIO_NAME);
                        setResellerId(SIC_COMERCIO_ID);
                        setIsResellerLocked(true);
                    }
                } else {
                    setResellerCode(SIC_COMERCIO_CODE);
                    setResellerName(SIC_COMERCIO_NAME);
                    setResellerId(SIC_COMERCIO_ID);
                    setIsResellerLocked(true);
                }
                return;
            }

            // Código inexistente no banco
            setReferrerName(null);
            setReferrerId(null);
            setIsIndicatedViaLink(false);
            try {
                sessionStorage.removeItem('urba_referral');
            } catch (e) {}
            toast.error("Link de indicação não localizado ou inválido.", { id: 'ref-not-found' });
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

        if (!fullName.trim() || !whatsapp.trim() || !cpf.trim() || !email.trim()) {
            setError("Por favor, preencha todos os dados pessoais básicos (Nome, WhatsApp, CPF e E-mail).");
            setLoading(false);
            return;
        }

        if (cpf.replace(/\D/g, '').length !== 11) {
            setError("O CPF informado deve conter exatamente 11 dígitos numéricos.");
            setLoading(false);
            return;
        }

        if (!birthDate || !gender) {
            setError("Data de nascimento e sexo são obrigatórios para a apólice de seguro.");
            setLoading(false);
            return;
        }

        if (!businessRules.isAtLeast18YearsOld(birthDate)) {
            setError("É necessário ter pelo menos 18 anos completos para se cadastrar (exigência da seguradora MBM).");
            setLoading(false);
            return;
        }

        if (!zipCode || !address || !number || !neighborhood || !city || !state) {
            setError("Por favor, preencha o endereço completo (CEP, logradouro, número, bairro, cidade e estado).");
            setLoading(false);
            return;
        }

        if (!bankName || !pixKey || !bankBranch || !bankAccount) {
            setError("Por favor, preencha todos os dados bancários e chave PIX para recebimento.");
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
        const finalDisplayName = fullName.trim();
        const finalCpf = cpf.replace(/\D/g, '');

        try {
            // Checagem prévia: verificar se CPF já possui cadastro para evitar erro 500 do banco
            if (finalCpf) {
                const { data: existingCpf } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('cpf', finalCpf)
                    .maybeSingle();

                if (existingCpf) {
                    const msg = "Este CPF já possui cadastro no sistema. Se você já possui uma conta, faça login ou solicite a recuperação de senha.";
                    setError(msg);
                    toast.error("Este CPF já está cadastrado no sistema.", {
                        duration: 7000,
                        style: {
                            borderRadius: '16px',
                            background: '#dc2626',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }
                    });
                    setLoading(false);
                    return;
                }
            }

            // Checagem Antifraude: verificar se a chave PIX ou conta bancária já pertence a outro CPF
            if (pixKey?.trim() || (bankBranch?.trim() && bankAccount?.trim())) {
                const conflict = await businessRules.checkReceivingAccountConflict({
                    cpf: finalCpf,
                    pixKey: pixKey,
                    bankName: bankName,
                    bankBranch: bankBranch,
                    bankAccount: bankAccount,
                    userName: finalDisplayName
                });

                if (conflict.hasConflict && conflict.conflictingProfile) {
                    // Registrar alerta interno de fraude
                    await businessRules.registerFraudAlert({
                        attemptedName: finalDisplayName,
                        attemptedCpf: finalCpf,
                        attemptedEmail: email,
                        existingProfile: conflict.conflictingProfile,
                        conflictType: conflict.conflictType!,
                        attemptedPixKey: pixKey,
                        attemptedBankDetails: `${bankName} / Ag: ${bankBranch} / CC: ${bankAccount}`
                    });

                    setError(conflict.errorMessage || "Esta conta de recebimento (Chave PIX) já está vinculada a outro titular (CPF).");
                    toast.error(conflict.errorMessage || "Conta de recebimento já cadastrada em outro titular.", {
                        duration: 8000,
                        style: {
                            borderRadius: '16px',
                            background: '#dc2626',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }
                    });
                    setLoading(false);
                    return;
                }
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        email: email.trim().toLowerCase(),
                        person_type: 'PF',
                        full_name: finalDisplayName,
                        cpf: finalCpf,
                        insured_person_name: finalDisplayName,
                        insured_person_cpf: finalCpf,
                        whatsapp: whatsapp,
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
                        pix_key: pixKey,
                        pix_type: 'cpf'
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
                const profilePayload: any = {
                    full_name: finalDisplayName,
                    email: email.trim().toLowerCase(),
                    whatsapp: whatsapp,
                    cpf: finalCpf,
                    person_type: 'PF',
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
                    pix_key: pixKey,
                    pix_type: 'cpf'
                };

                await supabase.from('profiles').update(profilePayload).eq('id', data.user.id);

                // Auditoria do Aceite Digital com IP e Assinatura Criptográfica
                let clientIp = '127.0.0.1';
                try {
                    const ipRes = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipRes.json();
                    if (ipData?.ip) clientIp = ipData.ip;
                } catch (e) {}

                if (accountProduct === 'seguro') {
                    await businessRules.cadastrarSegurado({
                        profile_id: data.user.id,
                        nome_completo: finalDisplayName,
                        cpf: finalCpf,
                        data_nascimento: birthDate,
                        telefone: whatsapp,
                        ip: clientIp,
                        user_agent: navigator.userAgent,
                        termo_hash: termoHash || 'SHA256-ACEITE-SEGURO-VIDA-LIGHT-DEFAULT'
                    });
                } else {
                    await businessRules.cadastrarMicrofranqueado({
                        profile_id: data.user.id,
                        nome_completo: finalDisplayName,
                        cpf: finalCpf,
                        razao_social: finalDisplayName,
                        upline_id: finalSponsorId,
                        ip: clientIp,
                        user_agent: navigator.userAgent,
                        termo_hash: termoHash || 'SHA256-ACEITE-MICROFRANQUEADO-MMN-DEFAULT'
                    });
                }
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

            try {
                sessionStorage.removeItem('urba_referral');
                localStorage.removeItem('urba_referral');
                localStorage.removeItem('urba_reseller');
            } catch (e) {}

            // Login automático e direcionamento adequado
            try {
                const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                if (!signInErr) {
                    if (accountProduct === 'seguro') {
                        navigate('/afiliado/renovacoes');
                    } else {
                        navigate('/afiliado/dashboard');
                    }
                    return;
                }
            } catch (loginErr) {
                console.warn('Auto login warning:', loginErr);
            }

            navigate('/login');
        } catch (err: any) {
            console.error("Erro no Supabase Auth:", err);

            let userMessage = "Ocorreu um erro inesperado ao realizar o cadastro. Por favor, tente novamente.";

            if (err.message === "Database error saving new user" || err.message?.includes("Database error")) {
                userMessage = "Não foi possível concluir o cadastro: o CPF, e-mail ou dados informados já podem estar em uso por outra conta.";
            } else if (err.message?.includes("User already registered")) {
                userMessage = "Este e-mail já está cadastrado no sistema. Faça login para acessar sua conta.";
            } else if (err.message?.includes("Password should be at least")) {
                userMessage = "A senha deve ter pelo menos 6 caracteres.";
            } else if (err.message) {
                userMessage = err.message;
            }

            setError(userMessage);
            toast.error(userMessage, {
                duration: 7000,
                style: {
                    borderRadius: '16px',
                    background: '#dc2626',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                }
            });
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
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">CaZa dos Sorteios</p>
                                    <p className="font-black text-white text-lg leading-none uppercase italic">Cashback Ativo</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed relative z-10 font-bold">
                                Cada indicação e cada assinatura gera bônus reais. O ecossistema com prêmios e proteção para você.
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
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3 block">Bem-vindo à CaZa dos Sorteios</span>
                            <h1 className="text-4xl lg:text-5xl font-black text-midnight mb-3 tracking-tighter uppercase italic leading-none">Crie sua Conta</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Acesso Unificado para todo o Ecossistema CaZa dos Sorteios</p>
                        </div>

                        <form className="space-y-12 pb-20" onSubmit={handleSubmit}>
                            {/* Seção 0: Escolha do Produto / Perfil de Cadastro */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-primary-blue animate-pulse" />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-midnight">
                                            Selecione sua Modalidade de Cadastro
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Dois Produtos Distintos
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Opção 1: Afiliado Premium (Seguro Vida Light) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountProduct('seguro');
                                            setTermsAccepted(false);
                                        }}
                                        className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-4 cursor-pointer ${
                                            accountProduct === 'seguro'
                                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                                                : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 opacity-75'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                                                accountProduct === 'seguro' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                Produto B • Seguro & Sorteios
                                            </span>
                                            <span className="text-xs font-black text-emerald-700 font-mono">
                                                A partir de R$ 5,00/mês
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                                                Afiliado Premium
                                            </h4>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                                                Seguro Vida Light R$ 5.000 + Telemedicina
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                                                Cobertura MBM Seguradora, 4 sorteios semanais da Loteria Federal por mês e Telemedicina 24/7 Racca Saúde. <strong>Sem MMN e sem rede.</strong>
                                            </p>
                                        </div>
                                    </button>

                                    {/* Opção 2: Microfranqueado (MMN) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountProduct('microfranqueado');
                                            setTermsAccepted(false);
                                        }}
                                        className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-4 cursor-pointer ${
                                            accountProduct === 'microfranqueado'
                                                ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                                : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 opacity-75'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                                                accountProduct === 'microfranqueado' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                Produto A • Licença MMN
                                            </span>
                                            <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                🎉 1º Ano Gratuito
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                                                Microfranqueado Oficial
                                            </h4>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                                                Comissões em Rede (G0 21%+2%, G1 3%+2%, G2 3%+2%)
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                                                Construa sua rede comercial com comissões de até 33%. 1º ano 100% gratuito (R$ 0,00). Renovação anual de R$ 150,00 somente a partir do 2º ano.
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Seção 1: Tipo de Conta e Identificação */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-3 mb-2 underline-offset-8 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="size-1.5 rounded-full bg-emerald-500" />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">
                                            01. Identificação e Perfil Tributário
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Pessoa Física (PF)
                                    </span>
                                </div>

                                {/* CARD INFORMATIVO REGRA PF / PJ */}
                                {accountProduct === 'seguro' ? (
                                    <div className="bg-emerald-50/70 border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-midnight uppercase tracking-wide">
                                                        Pessoa Física (PF com CPF)
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white shadow-xs">
                                                        Apólice Individual MBM
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                                                    O Seguro Vida Light R$ 5.000,00 e a participação semanal nos sorteios da Loteria Federal são vinculados exclusivamente ao seu CPF nominal.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/40 border border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-midnight uppercase tracking-wide">
                                                        Início Rápido como Pessoa Física (PF)
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                                                        Recibo RPA Inicial
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                                                    Comece a faturar imediatamente sem burocracia. Ao acumular <strong className="text-indigo-950 font-bold">R$ 5.000,00</strong> em comissões, a transição para MEI/PJ será solicitada para emissão de Nota Fiscal e liberação contínua de repasses sem retenções.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CAMPOS PESSOA FÍSICA */}
                                <div className="space-y-6">
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (CPF)</label>
                                            <div className="relative group">
                                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    value={cpf}
                                                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                                                    placeholder="000.000.000-00"
                                                    maxLength={14}
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight placeholder:text-slate-300 font-mono"
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento (Titular - Mín. 18 anos)</label>
                                            <div className="relative group">
                                                <input
                                                    required
                                                    type="date"
                                                    max={maxBirthDate}
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                                />
                                            </div>
                                            {birthDate && !businessRules.isAtLeast18YearsOld(birthDate) && (
                                                <span className="text-[10px] font-bold text-red-500 ml-1">
                                                    A seguradora MBM exige ter 18 anos completos.
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo (Titular)</label>
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

                                    {accountProduct === 'seguro' ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                                            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                                            <span><strong>Seguro Vida Light MBM (R$ 5.000,00):</strong> Emitido automaticamente em seu próprio nome e CPF. Assistência funeral individual e sorteios semanais vinculados ao seu cadastro.</span>
                                        </div>
                                    ) : (
                                        <div className="bg-indigo-50 border border-indigo-200/80 p-4 rounded-2xl flex items-center gap-3 text-xs text-indigo-950">
                                            <Briefcase size={20} className="text-indigo-600 shrink-0" />
                                            <span><strong>Transição Tributária Planejada:</strong> Seus primeiros repasses serão emitidos via Recibo RPA. Ao atingir o acumulado de R$ 5.000,00 em comissões, nosso sistema orientará a inclusão do seu MEI/CNPJ para emissão de NFS-e sem qualquer retenção na fonte.</span>
                                        </div>
                                    )}
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
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX para Recebimento</label>
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
                                                autoComplete="new-password"
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
                                                autoComplete="new-password"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-bold text-midnight"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 5: Código Ganha & Ganha e Liderança Regional (visível apenas quando há indicação ativa via link) */}
                            {isIndicatedViaLink && referrerName && (
                                <div className="pt-4 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="size-1.5 rounded-full bg-emerald-500" />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-midnight">05. Código Ganha & Ganha e Liderança Regional</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Card 1: Patrocinador Confirmado */}
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center gap-3.5 shadow-sm">
                                            <div className="size-10 rounded-xl bg-emerald-500 text-midnight flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">Código Ganha & Ganha Ativo</span>
                                                    <span className="text-[7px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">Verificado</span>
                                                </div>
                                                <p className="text-sm font-black text-midnight uppercase truncate">{referrerName}</p>
                                                {referralCode && (
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cód Ganha & Ganha: {referralCode}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card 2: Polo Regional Confirmado */}
                                        <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl flex items-center gap-3.5 shadow-sm">
                                            <div className="size-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                                                <Target size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-none">Polo Regional Responsável</span>
                                                    <span className="text-[7px] bg-purple-500/10 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase">Oficial</span>
                                                </div>
                                                <p className="text-sm font-black text-midnight uppercase truncate">{resellerName || 'Polo Regional Oficial'}</p>
                                                {resellerCode && (
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cód: {resellerCode}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                    <Link to="/" className="flex items-center gap-2">
                        <img 
                            src="/logo.png" 
                            alt="CaZa dos Sorteios" 
                            className="h-8 w-auto object-contain" 
                        />
                    </Link>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold">© 2026 SIC COMÉRCIO DE PRODUTOS ALIMENTICIOS E SERVIÇOS LTDA CNPJ nº 54.795.377/0001-03. Todos os direitos reservados. Operação: CaZa dos Sorteios.</p>
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
                                    <div className={`size-10 rounded-xl flex items-center justify-center shadow-lg ${
                                        accountProduct === 'seguro' 
                                            ? 'bg-emerald-500 text-midnight shadow-emerald-500/20' 
                                            : 'bg-indigo-600 text-white shadow-indigo-600/20'
                                    }`}>
                                        {accountProduct === 'seguro' ? <ShieldCheck size={22} /> : <Briefcase size={22} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-midnight uppercase italic tracking-tight">
                                            {accountProduct === 'seguro' 
                                                ? 'Termo de Adesão ao Seguro Coletivo Vida Light R$ 5.000,00' 
                                                : 'Contrato de Franquia Comercial & Termo de Intermediação MMN'}
                                        </h3>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                            {accountProduct === 'seguro' 
                                                ? 'Aceite Digital do Segurado • MBM Seguradora e Loteria Federal' 
                                                : 'Aceite Digital do Microfranqueado • Licença MMN Oficial'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(false)}
                                    className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-midnight cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed max-h-[50vh]">
                                {accountProduct === 'seguro' ? (
                                    /* TERMOS ESPECÍFICOS DO SEGURO VIDA LIGHT (PRODUTO B) */
                                    <ul className="space-y-4">
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                                            <span>
                                                <strong className="text-midnight font-bold">1. Cobertura Securitária MBM:</strong> Apólice Coletiva de Seguro de Pessoas sob gestão da MBM Seguradora S/A, garantindo indenização por Morte Acidental ou Invalidez Permanente de até R$ 5.000,00.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">2. Sorteios da Loteria Federal:</strong> Concorrência semanal nos 4 últimos domingos de cada mês (desconsiderando o primeiro domingo em meses com 5 domingos), com prêmio de R$ 5.000,00 bruto por sorteio.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">3. Telemedicina 24/7 Racca Saúde:</strong> Consultas ilimitadas online de urgência com clínico geral e agendamentos com especialistas parceiros sem coparticipação.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">4. Ausência de MMN / Rede:</strong> O plano Afiliado Premium é um produto estritamente securitário e de benefícios ao consumidor, não contemplando bônus de rede ou comissões comerciais.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">5. Manutenção da Vigência:</strong> A cobertura e os sorteios dependem da adimplência da modalidade escolhida (Mensal R$ 5, Trimestral R$ 15, Semestral R$ 30 ou Anual R$ 48).
                                            </span>
                                        </li>
                                    </ul>
                                ) : (
                                    /* CONTRATO ESPECÍFICO DO MICROFRANQUEADO MMN (PRODUTO A) */
                                    <ul className="space-y-4">
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0 animate-pulse" />
                                            <span>
                                                <strong className="text-midnight font-bold">1. Objeto da Licença Comercial:</strong> Concessão de licença anual para intermediação comercial e expansão da rede de assinaturas da plataforma CaZa dos Sorteios.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">2. Tabela de Comissionamento em 3 Níveis:</strong> O Microfranqueado recebe 33% de comissão oficial total sobre as vendas de seguros da sua rede: G0 (21% semanal / 2% anual = 23%), G1 (3% semanal / 2% anual = 5%) e G2 (3% semanal / 2% anual = 5%).
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">3. Pagamento Operacional:</strong> Repasse semanal de 27% pago toda terça-feira (referente a vendas confirmadas e pagas de segunda a sábado da semana anterior) e 6% anual referente ao ciclo 01.11.25 a 30.11.26 pago em 10 de Dezembro.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">4. Gratuito no 1º Ano:</strong> A taxa de licença anual de Microfranqueado é 100% gratuita no primeiro ano (R$ 0,00), permitindo a formação de rede sem cobrança inicial. A anuidade de R$ 150,00 ocorrerá somente a partir do segundo ano de vigência.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">5. Bloqueio por Inadimplência:</strong> O não pagamento da licença de Microfranqueado bloqueia o recebimento de comissões de rede até a devida regularização.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">6. Distinção de Produtos:</strong> A licença de Microfranqueado não confere apólice de seguro de vida ou participação nos sorteios, devendo o mesmo contratar o plano Seguro Vida Light caso deseje os benefícios pessoais.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                                            <span>
                                                <strong className="text-midnight font-bold">7. Regime Tributário e Transição PF para PJ:</strong> A adesão e os primeiros repasses são operados via Pessoa Física (CPF com Recibo RPA). Ao acumular o valor total de R$ 5.000,00 em comissões, a transição para Pessoa Jurídica (MEI ou PJ) passa a ser obrigatória para emissão de Nota Fiscal e continuidade dos pagamentos sem retenções.
                                            </span>
                                        </li>
                                    </ul>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
                                <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wide">
                                    Ao aceitar digitalmente, você confirma sua identidade e concorda com todas as cláusulas do contrato acima com assinatura criptográfica SHA-256 e registro de IP.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(false)}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-midnight py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        Recusar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const contractText = accountProduct === 'seguro'
                                                ? 'TERMO-ADESAO-SEGURO-VIDA-LIGHT-MBM-5000-V1.0'
                                                : 'CONTRATO-FRANQUIA-COMERCIAL-MMN-SPLIT-80-20-V1.0';
                                            const hash = await generateContractHash(contractText);
                                            setTermoHash(hash);
                                            setTermsAccepted(true);
                                            setShowTermsModal(false);
                                            toast.success('Termos aceitos digitalmente!', {
                                                style: {
                                                    borderRadius: '16px',
                                                    background: '#0a0e17',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px'
                                                }
                                            });
                                        }}
                                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                                            accountProduct === 'seguro'
                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-midnight shadow-emerald-500/20'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                        }`}
                                    >
                                        Aceitar e Confirmar Assinatura Digital
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
