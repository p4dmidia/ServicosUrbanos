import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Smartphone, 
  Bell, 
  Globe,
  Camera,
  CheckCircle2,
  Building,
  CreditCard,
  Hash,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    cpf: '',
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    pix_key: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: profile.whatsapp || '',
        cpf: profile.cpf || '',
        bank_name: profile.bank_name || '',
        bank_branch: profile.bank_branch || '',
        bank_account: profile.bank_account || '',
        pix_key: profile.pix_key || ''
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      await businessRules.updateProfile(user.id, formData);
      await refreshProfile();
      setSuccess(true);
      toast.success('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(false), 3000);
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
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-12 text-center md:text-left relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
           
           <div className="relative group z-10">
              <div className="size-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center font-black text-4xl text-slate-300 border-4 border-white shadow-xl overflow-hidden capitalize relative">
                 {profile?.avatar_url && profile.avatar_url.trim() !== '' ? (
                   <img 
                     key={profile.avatar_url}
                     src={`${profile.avatar_url}${profile.avatar_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`} 
                     alt="Profile" 
                     className="w-full h-full object-cover"
                     onLoad={() => console.log("Imagem carregada:", profile.avatar_url)}
                     onError={(e) => {
                       console.error("Erro ao carregar imagem. Verifique se o bucket é público no Supabase.");
                       (e.target as HTMLImageElement).style.display = 'none';
                     }}
                   />
                 ) : null}
                 
                 {/* Mostrar inicial se não tiver foto OU se a imagem falhar */}
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
              <label className="absolute bottom-0 right-0 size-10 bg-primary-blue text-white rounded-xl border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer">
                 <Camera size={18} />
                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
           </div>
           
           <div className="space-y-4 z-10">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                 <h2 className="text-3xl font-black text-midnight tracking-tighter italic uppercase">{profile?.full_name}</h2>
                 <span className="px-3 py-1 bg-emerald-500 text-white border border-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none shadow-lg shadow-emerald-500/20">
                   {profile?.rank || 'Afiliado'}
                 </span>
              </div>
              <p className="text-slate-500 font-medium max-w-md">
                Membro do ecossistema desde {membershipDate}. Suas informações estão seguras e integradas em todas as nossas plataformas.
              </p>
           </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Form Section */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                           <User size={24} />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Informações da Conta</h3>
                    </div>
                    {success && (
                      <motion.span 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Sucesso!
                      </motion.span>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                            required
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            readOnly
                            type="email" 
                            value={user?.email || ''}
                            className="w-full bg-slate-50 border border-slate-100 px-12 py-4 rounded-2xl font-bold text-slate-400 cursor-not-allowed outline-none text-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone (WhatsApp)</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            placeholder="(00) 00000-0000"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                            className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (CPF)</label>
                       <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                            className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Indicação (Sistema)</label>
                       <div className="relative">
                          <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            readOnly
                            type="text" 
                            value={profile?.referral_code || ''}
                            className="w-full bg-slate-50 border border-slate-100 px-12 py-4 rounded-2xl font-black text-emerald-600 cursor-not-allowed outline-none text-sm uppercase"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Bank Info Section */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <Building size={24} />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Dados Bancários / PIX</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Nubank, Itaú..."
                         value={formData.bank_name}
                         onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                         className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                       <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            placeholder="Chave PIX (E-mail, CPF ou Aleatória)"
                            value={formData.pix_key}
                            onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                            className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                       <input 
                         type="text" 
                         placeholder="0001"
                         value={formData.bank_branch}
                         onChange={(e) => setFormData({...formData, bank_branch: e.target.value})}
                         className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta com dígito</label>
                       <input 
                         type="text" 
                         placeholder="000000-0"
                         value={formData.bank_account}
                         onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                         className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm"
                       />
                    </div>
                 </div>

                 <button 
                   disabled={loading}
                   className="bg-primary-blue text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-blue/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Todas as Mudanças'}
                 </button>
              </div>

              {/* Security Status Only Link */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Segurança</h3>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                    <div className="flex items-center gap-6">
                       <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                          <Smartphone size={22} />
                       </div>
                       <div>
                         <p className="font-extrabold text-midnight tracking-tight">Autenticação em 2 Etapas</p>
                         <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Ativado
                         </p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        </form>

      </div>
    </AffiliateLayout>
  );
}
