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
  Sparkles,
  Building2,
  Clock,
  X,
  Send,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Estados do Fluxo de Migração PJ
  const [isPjModalOpen, setIsPjModalOpen] = useState(false);
  const [pjRequest, setPjRequest] = useState<any>(null);
  const [loadingPjRequest, setLoadingPjRequest] = useState(false);
  const [submittingPj, setSubmittingPj] = useState(false);
  const [pjForm, setPjForm] = useState({
    cnpj: '',
    companyName: '',
    tradeName: '',
    pixType: 'CNPJ',
    pixKey: '',
    documentUrl: '',
    notes: ''
  });

  const isPJ = Boolean(profile?.person_type === 'PJ' || (profile?.cnpj && profile.cnpj.replace(/\D/g, '').length === 14));

  const loadPjRequest = async () => {
    if (!user) return;
    try {
      setLoadingPjRequest(true);
      const req = await businessRules.getPjMigrationRequest(user.id);
      setPjRequest(req);
    } catch (e) {
      console.error('Error loading pj request:', e);
    } finally {
      setLoadingPjRequest(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPjRequest();
    }
  }, [user]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 14) v = v.slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    setPjForm(prev => ({
      ...prev,
      cnpj: v,
      pixKey: prev.pixType === 'CNPJ' ? v : prev.pixKey
    }));
  };

  const handleSubmitPjRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanCnpj = pjForm.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast.error('Informe um CNPJ válido com 14 dígitos.');
      return;
    }
    if (!pjForm.companyName.trim()) {
      toast.error('Informe a Razão Social da empresa.');
      return;
    }

    setSubmittingPj(true);
    try {
      await businessRules.submitPjMigrationRequest({
        userId: user.id,
        cnpj: pjForm.cnpj,
        companyName: pjForm.companyName,
        tradeName: pjForm.tradeName,
        pixType: pjForm.pixType,
        pixKey: pjForm.pixKey,
        documentUrl: pjForm.documentUrl,
        notes: pjForm.notes
      });
      toast.success('Solicitação de migração para PJ enviada com sucesso! Aguarde a análise da equipe administrativa.');
      setIsPjModalOpen(false);
      await loadPjRequest();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar solicitação.');
    } finally {
      setSubmittingPj(false);
    }
  };
  
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

  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: profile.whatsapp || '',
        cpf: profile.cpf || '',
        birth_date: profile.birth_date ? profile.birth_date.split('T')[0] : '',
        gender: profile.gender === 'Masculino' ? 'M' : (profile.gender === 'Feminino' ? 'F' : (profile.gender || '')),
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
    
    // Validação dos campos essenciais para recebimento e identificação
    const essentialMissing: string[] = [];
    if (!formData.full_name?.trim()) essentialMissing.push('Nome Completo');
    if (!formData.cpf?.trim()) essentialMissing.push('CPF');
    if (!formData.pix_key?.trim()) essentialMissing.push('Chave PIX');

    if (essentialMissing.length > 0) {
      toast.error(
        `Preencha os campos obrigatórios para repasses: ${essentialMissing.join(', ')}.`,
        { 
          duration: 5000,
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

    // Identificar pendências para o seguro coletivo e cadastro completo
    const missing: string[] = [];
    if (!formData.whatsapp?.trim()) missing.push('WhatsApp');
    if (!formData.birth_date?.trim()) missing.push('Data de Nascimento (Seguro)');
    if (formData.birth_date && !businessRules.isAtLeast18YearsOld(formData.birth_date)) {
      toast.error('A seguradora MBM exige idade mínima de 18 anos completos. Por favor, insira uma data de nascimento válida.');
      return;
    }
    if (!formData.gender?.trim()) missing.push('Sexo/Gênero (Seguro)');
    if (!formData.zip_code?.trim()) missing.push('CEP');
    if (!formData.address?.trim()) missing.push('Endereço');
    if (!formData.number?.trim()) missing.push('Número');
    if (!formData.neighborhood?.trim()) missing.push('Bairro');
    if (!formData.city?.trim()) missing.push('Cidade');
    if (!formData.state?.trim()) missing.push('Estado (UF)');

    setLoading(true);
    setSuccess(false);
    
    try {
      // Checagem Antifraude: verificar se a chave PIX ou conta bancária já pertence a outro CPF
      if (formData.pix_key?.trim() || (formData.bank_branch?.trim() && formData.bank_account?.trim())) {
        const conflict = await businessRules.checkReceivingAccountConflict({
          userId: user.id,
          cpf: formData.cpf,
          cnpj: profile?.cnpj,
          pixKey: formData.pix_key,
          bankName: formData.bank_name,
          bankBranch: formData.bank_branch,
          bankAccount: formData.bank_account,
          userName: formData.full_name
        });

        if (conflict.hasConflict && conflict.conflictingProfile) {
          // Disparar alerta interno de fraude
          await businessRules.registerFraudAlert({
            attemptedUserId: user.id,
            attemptedName: formData.full_name,
            attemptedCpf: formData.cpf,
            attemptedEmail: user.email,
            existingProfile: conflict.conflictingProfile,
            conflictType: conflict.conflictType!,
            attemptedPixKey: formData.pix_key,
            attemptedBankDetails: `${formData.bank_name} / Ag: ${formData.bank_branch} / CC: ${formData.bank_account}`
          });

          toast.error(
            conflict.errorMessage || 'Esta conta de recebimento já está cadastrada para outro titular (CPF).',
            { 
              duration: 8000,
              style: {
                borderRadius: '16px',
                background: '#dc2626',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '12px'
              }
            }
          );
          setLoading(false);
          return;
        }
      }

      await businessRules.updateProfile(user.id, {
        full_name: formData.full_name.trim(),
        whatsapp: formData.whatsapp.trim(),
        cpf: formData.cpf.trim(),
        birth_date: formData.birth_date || null,
        gender: formData.gender ? (formData.gender.toUpperCase().startsWith('F') ? 'F' : 'M') : null,
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
      
      if (missing.length > 0) {
        toast.success(
          `Chave PIX e dados salvos com sucesso! Lembre-se de preencher ${missing.slice(0, 2).join(', ')} para ativação do seguro coletivo.`,
          { duration: 5000 }
        );
      } else {
        toast.success('Cadastro completo salvo com sucesso! Seguro e dados bancários validados.');
      }
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

        {/* Card / Banner de Migração para Pessoa Jurídica (PJ) */}
        {isPJ ? (
          <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-slate-900/5 border border-purple-500/20 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="size-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30 shrink-0">
                <Building2 size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">Perfil Pessoa Jurídica (PJ) Ativo</h3>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md shadow-purple-600/20">PJ Isento</span>
                </div>
                <p className="text-xs text-slate-600 font-bold mt-1">
                  CNPJ: <span className="text-midnight font-black">{profile?.cnpj}</span> {profile?.store_name && <>• Razão Social: <span className="text-midnight font-black">{profile?.store_name}</span></>}
                </p>
                <p className="text-[11px] text-purple-700 font-semibold mt-1">
                  ✓ Repasses integrais de 100% bruto sem retenção na fonte de INSS ou IRRF, mediante emissão mensal de Nota Fiscal.
                </p>
              </div>
            </div>
          </div>
        ) : pjRequest?.status === 'pending' ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start md:items-center gap-5">
              <div className="size-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
                <Clock size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-amber-900 tracking-tight uppercase italic">Solicitação de Migração para PJ em Análise</h3>
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Aguardando Admin</span>
                </div>
                <p className="text-xs text-amber-900 font-bold mt-1">
                  Empresa: <span className="text-midnight font-black">{pjRequest.company_name}</span> • CNPJ: <span className="text-midnight font-black">{pjRequest.cnpj}</span>
                </p>
                <p className="text-xs text-amber-800 mt-1 font-medium">
                  Sua solicitação foi enviada em {new Date(pjRequest.created_at).toLocaleDateString('pt-BR')} e está sob análise da administração. Assim que for aprovada, seus repasses passarão a operar como PJ.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-600/5 via-indigo-600/10 to-primary-blue/5 border border-purple-500/20 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start md:items-center gap-5">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30 shrink-0">
                <Building2 size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-midnight tracking-tight uppercase italic">Receber Comissões como Pessoa Jurídica (PJ)</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-[9px] font-black uppercase tracking-widest">Vantagem Tributária</span>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl mt-1 font-medium">
                  Receba <strong>100% do valor bruto</strong> de suas comissões, com isenção total de retenções na fonte de INSS (11%) e IRRF (até 27,5%), mediante emissão de Nota Fiscal.
                </p>
                {pjRequest?.status === 'rejected' && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 bg-red-50 p-2 rounded-xl border border-red-200">
                    ⚠️ Solicitação anterior recusada: {pjRequest.rejection_reason || 'Dados inconsistentes'}. Você pode enviar uma nova solicitação corrigida.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPjModalOpen(true)}
              className="shrink-0 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Building2 size={16} />
              Solicitar Migração para PJ
            </button>
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
                    max={maxBirthDate}
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-12 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 text-sm"
                    required
                  />
                </div>
                {formData.birth_date && !businessRules.isAtLeast18YearsOld(formData.birth_date) && (
                  <span className="text-[10px] font-bold text-rose-600 ml-1 block">
                    A seguradora MBM exige idade mínima de 18 anos completos.
                  </span>
                )}
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
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
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

        {/* Modal de Solicitação de Migração para PJ */}
        <AnimatePresence>
          {isPjModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPjModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 md:p-10 z-10 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">Migração para PJ</h3>
                      <p className="text-xs text-slate-400 font-bold">Solicite o recebimento de comissões como empresa</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPjModalOpen(false)}
                    className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitPjRequest} className="mt-6 space-y-5">
                  {/* CNPJ */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      CNPJ da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0000-00"
                      value={pjForm.cnpj}
                      onChange={handleCnpjChange}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Razão Social */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Razão Social (Nome Empresarial) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Minha Empresa Intermediações Ltda"
                      value={pjForm.companyName}
                      onChange={(e) => setPjForm({...pjForm, companyName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Nome Fantasia */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nome Fantasia (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nome comercial ou de divulgação"
                      value={pjForm.tradeName}
                      onChange={(e) => setPjForm({...pjForm, tradeName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Tipo de Chave PIX e Chave */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Tipo Chave PIX
                      </label>
                      <select
                        value={pjForm.pixType}
                        onChange={(e) => setPjForm({...pjForm, pixType: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 text-xs"
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="ALEATORIA">Aleatória</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Chave PIX da Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="Chave para recebimento PJ"
                        value={pjForm.pixKey}
                        onChange={(e) => setPjForm({...pjForm, pixKey: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Link do Comprovante / Cartão CNPJ */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Link do Cartão CNPJ ou Contrato Social (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://link-do-documento.pdf"
                      value={pjForm.documentUrl}
                      onChange={(e) => setPjForm({...pjForm, documentUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Observações para o Administrador (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mensagem adicional ou esclarecimentos..."
                      value={pjForm.notes}
                      onChange={(e) => setPjForm({...pjForm, notes: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl font-medium text-midnight focus:outline-none focus:border-purple-600 focus:bg-white text-xs resize-none"
                    />
                  </div>

                  {/* Aviso Regulatório */}
                  <div className="p-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl text-[11px] text-purple-900 leading-relaxed font-medium">
                    ⚖️ <strong>Regra de Conformidade:</strong> A conta bancária e chave PIX devem pertencer à titularidade do mesmo CNPJ. A apólice de Seguro MBM continuará vinculada ao titular pessoa física responsável cadastrado.
                  </div>

                  {/* Botões */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsPjModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPj}
                      className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingPj ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          <Send size={16} />
                          Enviar Solicitação
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AffiliateLayout>
  );
}
