import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Smartphone, 
  Camera, 
  CheckCircle2, 
  Building, 
  CreditCard, 
  Hash, 
  Loader2, 
  TrendingUp,
  Calendar,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AffiliateProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form states completo com campos pessoais, seguro e bancários
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    cpf: '',
    birth_date: '',
    gender: '',
    zip_code: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    bank_name: '',
    pix_type: 'CPF',
    pix_key: '',
    bank_branch: '',
    bank_account: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: profile.whatsapp || '',
        cpf: profile.cpf || '',
        birth_date: profile.birth_date ? profile.birth_date.split('T')[0] : '',
        gender: profile.gender || '',
        zip_code: profile.zip_code || '',
        address: profile.address || '',
        number: profile.number || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
        bank_name: profile.bank_name || '',
        pix_type: profile.pix_type || 'CPF',
        pix_key: profile.pix_key || '',
        bank_branch: profile.bank_branch || '',
        bank_account: profile.bank_account || ''
      });
    }
  }, [profile]);

  const [subscription, setSubscription] = useState<any | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      if (!user) return;
      try {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', user.id)
          .order('end_date', { ascending: false });

        const activeSub = (subs || []).find(s => s.status === 'active' && new Date(s.end_date) >= new Date());
        let finalSub = activeSub || (subs && subs.length > 0 ? subs[0] : null);
        if (!finalSub) {
          try {
            const savedMock = localStorage.getItem(`mock_subscription_${user.id}`);
            if (savedMock) {
              const mockData = JSON.parse(savedMock);
              finalSub = {
                plan_type: mockData.planType,
                end_date: mockData.endDate,
                status: mockData.status
              };
            }
          } catch (e) {
            console.error('Erro ao ler mock subscription:', e);
          }
        }
        setSubscription(finalSub);
      } catch (e) {
        console.error(e);
      }
    }
    loadSubscription();
  }, [user]);

  // Verificar se o cadastro está 100% preenchido
  const isProfileComplete = useMemo(() => {
    return !!(
      formData.full_name?.trim() &&
      formData.whatsapp?.trim() &&
      formData.cpf?.trim() &&
      formData.birth_date?.trim() &&
      formData.gender?.trim() &&
      formData.zip_code?.trim() &&
      formData.address?.trim() &&
      formData.number?.trim() &&
      formData.neighborhood?.trim() &&
      formData.city?.trim() &&
      formData.state?.trim() &&
      formData.bank_name?.trim() &&
      formData.pix_type?.trim() &&
      formData.pix_key?.trim() &&
      formData.bank_branch?.trim() &&
      formData.bank_account?.trim()
    );
  }, [formData]);

  // Formatador de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    else if (v.length > 6) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    else if (v.length > 3) v = `${v.slice(0, 3)}.${v.slice(3)}`;
    setFormData(prev => ({ ...prev, cpf: v }));
  };

  // Formatador de WhatsApp
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    setFormData(prev => ({ ...prev, whatsapp: v }));
  };

  // Busca de CEP automática via ViaCEP
  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setFormData(prev => ({ ...prev, zip_code: formatted }));

    if (raw.length === 8) {
      const loadingToast = toast.loading('Buscando CEP...');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success('Endereço preenchido com sucesso!', { id: loadingToast });
          const numInput = document.getElementById('profile-number-input');
          if (numInput) numInput.focus();
        } else {
          toast.error('CEP não localizado.', { id: loadingToast });
        }
      } catch (err) {
        toast.error('Erro ao conectar ao serviço de CEP.', { id: loadingToast });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validação estrita de todos os itens exigidos (dados pessoais, seguro e bancários)
    const missing: string[] = [];

    if (!formData.full_name?.trim()) missing.push('Nome Completo');
    if (!formData.whatsapp?.trim()) missing.push('WhatsApp');
    if (!formData.cpf?.trim()) missing.push('CPF');
    if (!formData.birth_date?.trim()) missing.push('Data de Nascimento (Seguro)');
    if (!formData.gender?.trim()) missing.push('Sexo/Gênero (Seguro)');
    if (!formData.zip_code?.trim()) missing.push('CEP');
    if (!formData.address?.trim()) missing.push('Endereço');
    if (!formData.number?.trim()) missing.push('Número');
    if (!formData.neighborhood?.trim()) missing.push('Bairro');
    if (!formData.city?.trim()) missing.push('Cidade');
    if (!formData.state?.trim()) missing.push('Estado (UF)');
    if (!formData.bank_name?.trim()) missing.push('Banco');
    if (!formData.pix_type?.trim()) missing.push('Tipo de PIX');
    if (!formData.pix_key?.trim()) missing.push('Chave PIX');
    if (!formData.bank_branch?.trim()) missing.push('Agência');
    if (!formData.bank_account?.trim()) missing.push('Conta com dígito');

    if (missing.length > 0) {
      toast.error(
        `Cadastro incompleto! Para ativar o seguro coletivo e os repasses bancários, preencha: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` e mais ${missing.length - 3} campos` : ''}.`,
        { 
          duration: 6000,
          style: {
            borderRadius: '16px',
            background: '#0f172a',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px'
          }
        }
      );
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      await businessRules.updateProfile(user.id, {
        full_name: formData.full_name.trim(),
        whatsapp: formData.whatsapp.trim(),
        cpf: formData.cpf.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        zip_code: formData.zip_code.replace(/\D/g, ''),
        address: formData.address.trim(),
        number: formData.number.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        bank_name: formData.bank_name.trim(),
        pix_type: formData.pix_type,
        pix_key: formData.pix_key.trim(),
        bank_branch: formData.bank_branch.trim(),
        bank_account: formData.bank_account.trim()
      });
      await refreshProfile();
      setSuccess(true);
      toast.success('Cadastro completo salvo com sucesso! Seguro e dados bancários validados.');
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao salvar as alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      await businessRules.uploadAvatar(user.id, file);
      await refreshProfile();
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      const errorMessage = error.message || "Erro desconhecido";
      toast.error(`Erro ao carregar a foto: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const membershipDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '...';

  return (
    <AffiliateLayout title="Dados Pessoais">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10 text-center md:text-left relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
           
           <div className="relative group z-10">
              <div className="size-28 rounded-[2rem] bg-slate-100 flex items-center justify-center font-black text-4xl text-slate-300 border-4 border-white shadow-xl overflow-hidden capitalize relative">
                 {profile?.avatar_url && profile.avatar_url.trim() !== '' ? (
                   <img 
                     key={profile.avatar_url}
                     src={`${profile.avatar_url}${profile.avatar_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`} 
                     alt="Profile" 
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                     }}
                   />
                 ) : null}
                 
                 {(!profile?.avatar_url || profile.avatar_url.trim() === '') && (
                   <span className={uploading ? 'opacity-0' : 'opacity-100'}>
                     {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                   </span>
                 )}

                 {uploading && (
                   <div className="absolute inset-0 bg-midnight/40 flex items-center justify-center text-white z-20">
                      <Loader2 className="animate-spin" size={24} />
                   </div>
                 )}
              </div>
              <label className="absolute bottom-0 right-0 size-9 bg-primary-blue text-white rounded-xl border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer">
                 <Camera size={16} />
                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
           </div>
           
           <div className="space-y-3 z-10 flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                 <h2 className="text-3xl font-black text-midnight tracking-tighter italic uppercase">{profile?.full_name || 'Afiliado'}</h2>
                 <span className="px-3 py-1 bg-emerald-500 text-white border border-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none shadow-lg shadow-emerald-500/20">
                   {profile?.rank || 'Afiliado'}
                 </span>
              </div>
              <p className="text-slate-500 font-medium text-xs max-w-xl">
                Membro do ecossistema desde {membershipDate}. Para emissão do certificado de seguro coletivo e recebimento de comissões, todos os dados são obrigatórios.
                {subscription && (
                   <span className="block mt-2 text-xs font-black text-primary-blue uppercase tracking-widest">
                     Plano Ativo: {subscription.plan_type} • Vencimento: {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                   </span>
                 )}
              </p>
           </div>
        </div>

        {/* Status do Cadastro Banner */}
        {isProfileComplete ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex items-center gap-4 text-emerald-900 shadow-sm">
            <div className="size-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight text-emerald-800">
                Cadastro Completo e Validado
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                Seus dados pessoais, endereço para a apólice de seguro e dados bancários estão devidamente regularizados.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex items-center gap-4 text-amber-950 shadow-sm">
            <div className="size-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight text-amber-900">
                Atenção: Cadastro Inicial Incompleto
              </p>
              <p className="text-xs text-amber-800 font-medium">
                É obrigatório preencher <strong>todos os itens</strong> abaixo (dados pessoais, seguro coletivo e dados bancários) para validar seu cadastro e liberar repasses.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">

          {/* 1. SEÇÃO: DADOS PESSOAIS & SEGURO */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center font-black">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">
                    1. Dados Pessoais & Seguro
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Informações cadastrais e dados do titular segurado
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Nome Completo */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Digite seu nome completo"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                    required
                  />
                </div>
              </div>

              {/* E-mail (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  E-mail Principal
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    readOnly
                    type="email" 
                    value={user?.email || ''}
                    className="w-full bg-slate-50 border border-slate-100 px-12 py-3.5 rounded-2xl font-bold text-slate-400 cursor-not-allowed outline-none text-sm"
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  CPF (Documento) *
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCpfChange}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Telefone (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Data de Nascimento (Seguro) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>Data de Nascimento *</span>
                  <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pro Seguro</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="date" 
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Sexo / Gênero (Seguro) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>Sexo / Gênero *</span>
                  <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pro Seguro</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                >
                  <option value="">Selecione o gênero...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Código de Indicação (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Seu Link de Indicação
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    readOnly
                    type="text" 
                    value={profile?.referral_code || ''}
                    className="w-full bg-slate-50 border border-slate-100 px-12 py-3.5 rounded-2xl font-black text-emerald-600 cursor-not-allowed outline-none text-sm uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO: ENDEREÇO RESIDENCIAL (SEGURO COLETIVO) */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">
                    2. Endereço Residencial (Apólice de Seguro)
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Endereço registrado na apólice de seguro coletivo de acidentes pessoais
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              
              {/* CEP */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>CEP *</span>
                  <span className="text-[8px] font-bold text-primary-blue">Busca automática</span>
                </label>
                <input 
                  type="text" 
                  placeholder="00000-000"
                  value={formData.zip_code}
                  onChange={handleZipCodeChange}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm font-mono"
                  required
                />
              </div>

              {/* Endereço / Rua */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Logradouro / Rua *
                </label>
                <input 
                  type="text" 
                  placeholder="Av., Rua, Travessa..."
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Número *
                </label>
                <input 
                  id="profile-number-input"
                  type="text" 
                  placeholder="123"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Bairro *
                </label>
                <input 
                  type="text" 
                  placeholder="Nome do bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                />
              </div>

              {/* Cidade */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Cidade *
                </label>
                <input 
                  type="text" 
                  placeholder="Sua cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                />
              </div>

              {/* Estado (UF) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Estado (UF) *
                </label>
                <input 
                  type="text" 
                  placeholder="UF (ex: SP)"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm uppercase text-center font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. SEÇÃO: DADOS BANCÁRIOS & PIX */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">
                    3. Dados Bancários & PIX
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Conta e chave para recebimento dos repasses de rede e revenda
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Banco */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nome do Banco *
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Nubank, Itaú, Bradesco..."
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                />
              </div>

              {/* Tipo de Chave PIX */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Tipo de Chave PIX *
                </label>
                <select
                  value={formData.pix_type}
                  onChange={(e) => setFormData({...formData, pix_type: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                  required
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Telefone">Telefone (Celular)</option>
                  <option value="Aleatória">Chave Aleatória (EVP)</option>
                </select>
              </div>

              {/* Chave PIX */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Chave PIX *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Informe sua chave PIX"
                    value={formData.pix_key}
                    onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* Agência */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Agência (sem dígito) *
                </label>
                <input 
                  type="text" 
                  placeholder="0001"
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({...formData, bank_branch: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm font-mono"
                  required
                />
              </div>

              {/* Conta com Dígito */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Conta com Dígito *
                </label>
                <input 
                  type="text" 
                  placeholder="0000000-0"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                  className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <Sparkles className="text-amber-500 shrink-0" size={18} />
              <span>Todos os dados são criptografados e transmitidos com segurança.</span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {success && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> Salvo com Sucesso!
                </motion.span>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-primary-blue hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary-blue/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <ShieldCheck size={18} />
                    Salvar e Validar Cadastro
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card de Segurança */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="size-11 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                      <Smartphone size={20} />
                   </div>
                   <div>
                     <p className="font-extrabold text-midnight text-sm">Autenticação e Proteção de Dados</p>
                     <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={12} /> Criptografia Ponta a Ponta Ativada
                     </p>
                   </div>
                </div>
             </div>
          </div>

        </form>

      </div>
    </AffiliateLayout>
  );
}
