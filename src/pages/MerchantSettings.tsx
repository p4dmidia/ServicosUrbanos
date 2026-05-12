import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  CreditCard, 
  Bell, 
  Shield, 
  Image as ImageIcon,
  Save,
  CheckCircle,
  Truck,
  Plus,
  Users as UsersIcon,
  Trash2,
  Building2,
  DollarSign,
  Edit2,
  User,
  Mail,
  Lock,
  Zap
} from 'lucide-react';
import MerchantLayout from '../components/MerchantLayout';
import { motion, AnimatePresence } from 'motion/react';
import { businessRules, Branch, MerchantUser } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// E-mails autorizados a ativar conta de lojista durante a fase beta
const AUTHORIZED_EMAILS = [
  'contato@p4dmidia.com.br',
  'vendas@p4dmidia.com.br',
  'administrativo@p4dmidia.com.br',
  'servicosurbanos23@gmail.com',
  'xipsdapraia23@gmail.com'
];

export default function MerchantSettings() {
  const { profile, refreshProfile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para Filiais e Equipe
  const [branches, setBranches] = useState<Branch[]>([]);
  const [team, setTeam] = useState<MerchantUser[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddShipping, setShowAddShipping] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<MerchantUser | null>(null);
  const [originalMember, setOriginalMember] = useState<MerchantUser | null>(null);
  const [isAffiliateOnly, setIsAffiliateOnly] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({ storeName: '', cnpj: '' });

  const [newBranch, setNewBranch] = useState<Omit<Branch, 'id'>>({
    name: '', address: '', city: '', state: '', zipCode: ''
  });

  const [newMember, setNewMember] = useState({ 
    name: '', email: '', password: '', branchId: '', commissionRate: 30 
  });
  const [searchCpf, setSearchCpf] = useState('');
  const [foundProfile, setFoundProfile] = useState<{id: string, name: string} | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [newShipping, setNewShipping] = useState({
    name: '', fee: 0, deadline: '', type: 'fixed' as 'fixed' | 'calculated'
  });

  const [formData, setFormData] = useState({
    storeName: '',
    fullName: '',
    cnpj: '',
    cpf: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    stockAddress: '',
    stockNumber: '',
    stockNeighborhood: '',
    stockCity: '',
    stockState: '',
    stockZipCode: '',
    bank: '',
    agency: '',
    account: '',
    pixType: 'CPF',
    pixKey: '',
  });

  // Sincronizar aba ativa com o estado da rota
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const currentUser = await businessRules.getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }
        
        // Determinar o ID do Lojista (Dono) para buscar dados da organização
        const mId = await businessRules.getMerchantId(currentUser.id);
        
        if (!mId) {
          setIsAffiliateOnly(true);
          setLoading(false);
          return;
        }
        
        setIsAffiliateOnly(false);
        setMerchantId(mId);

        const [branchesList, methods, ownerProfile] = await Promise.all([
          businessRules.getBranches(mId),
          businessRules.getShippingMethods(mId),
          mId !== currentUser.id ? businessRules.getProfileById(mId) : Promise.resolve(currentUser)
        ]);

        const branchIds = branchesList.map(b => b.id);
        const teamMembers = await businessRules.getMerchantTeam(branchIds);

        setBranches(branchesList);
        setTeam(teamMembers);
        setShippingMethods(methods || []);
        
        // Dados para o formulário (priorizar o dono para dados da loja, banco e estoque)
        const storeData = ownerProfile || currentUser;

        setFormData({
          storeName: storeData.storeName || '',
          fullName: currentUser.name || '',
          cnpj: storeData.cnpj || '',
          cpf: currentUser.cpf || '',
          email: currentUser.email || '', 
          phone: currentUser.whatsapp || '',
          description: storeData.description || '',
          address: storeData.address || '', 
          city: storeData.city || '', 
          state: storeData.state || '', 
          zipCode: storeData.zipCode || '', 
          stockAddress: storeData.stockAddress || '',
          stockNumber: storeData.stockNumber || '',
          stockNeighborhood: storeData.stockNeighborhood || '',
          stockCity: storeData.stockCity || '',
          stockState: storeData.stockState || '',
          stockZipCode: storeData.stockZipCode || '',
          bank: storeData.bankName || '', 
          agency: storeData.bankAgency || '', 
          account: storeData.bankAccount || '', 
          pixType: (storeData as any).pixType || 'CPF', 
          pixKey: storeData.pixKey || '',
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []); // Dependência vazia para evitar loops infinitos

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const uploadToast = toast.loading('Enviando logo...');
    setIsUploading(true);
    try {
      await businessRules.uploadAvatar(profile.id, file);
      await refreshProfile();
      toast.success('Logo atualizada!', { id: uploadToast });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da logo', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const loadingToast = toast.loading('Salvando alterações...');
    setIsSaving(true);
    
    try {
      const updates: any = {
        full_name: formData.fullName,
        store_name: formData.storeName,
        whatsapp: formData.phone,
        cnpj: formData.cnpj,
        cpf: formData.cpf,
        stock_address: formData.stockAddress,
        stock_number: formData.stockNumber,
        stock_neighborhood: formData.stockNeighborhood,
        stock_city: formData.stockCity,
        stock_state: formData.stockState,
        stock_zip_code: formData.stockZipCode,
        bank_name: formData.bank,
        bank_agency: formData.agency,
        bank_account: formData.account,
        pix_key: formData.pixKey
      };

      if (formData.address) updates.address = formData.address;
      if (formData.city) updates.city = formData.city;
      if (formData.state) updates.state = formData.state;
      if (formData.zipCode) updates.zip_code = formData.zipCode;

      await businessRules.updateProfile(profile.id, updates);
      
      await refreshProfile();
      toast.success('Configurações salvas!', { id: loadingToast });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro detalhado ao salvar:', error);
      const errorMessage = error.message || error.details || 'Falha na comunicação com o banco.';
      toast.error(`Erro: ${errorMessage}`, { id: loadingToast, duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const loadingToast = toast.loading('Cadastrando filial...');
    try {
      setIsSaving(true);
      const mId = merchantId || profile.id;
      const added = await businessRules.addBranch({
        ...newBranch,
        merchantId: mId
      });
      
      const updatedBranches = await businessRules.getBranches(profile.id);
      setBranches(updatedBranches);
      
      setNewBranch({ name: '', address: '', city: '', state: '', zipCode: '' });
      setShowAddBranch(false);
      toast.success('Filial cadastrada com sucesso!', { id: loadingToast });
    } catch (error: any) {
      console.error('Erro ao adicionar filial:', error);
      toast.error(error.message || 'Erro ao cadastrar filial.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchCpf = async () => {
    if (searchCpf.replace(/\D/g, '').length < 11) {
      toast.error('Informe um CPF válido');
      return;
    }

    setIsSearching(true);
    try {
      const result = await businessRules.searchProfileByCpf(searchCpf.replace(/\D/g, ''));
      if (result) {
        setFoundProfile({ id: result.profile_id, name: result.profile_name });
        toast.success('Usuário encontrado!');
      } else {
        setFoundProfile(null);
        toast.info('CPF não cadastrado. Preencha os dados para criar a conta.');
      }
    } catch (error: any) {
      toast.error('Erro na busca: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(foundProfile ? 'Vinculando gerente...' : 'Criando conta de gerente...');
    try {
      setIsSaving(true);
      
      const mId = merchantId || profile?.id;
      if (!mId) throw new Error('ID do lojista não encontrado.');
      const commission = parseInt(String(newMember.commissionRate)) || 0;

      await businessRules.addMerchantMember({
        mode: foundProfile ? 'link' : 'create',
        userId: foundProfile?.id,
        name: foundProfile ? foundProfile.name : newMember.name,
        email: newMember.email,
        cpf: searchCpf.replace(/\D/g, ''),
        password: newMember.password,
        branchId: newMember.branchId === 'matriz' ? '' : (newMember.branchId || ''),
        commissionRate: commission,
        merchantId: mId
      });
      
      // Refresh team list
      if (mId) {
        const branchIds = branches.map(b => b.id);
        const teamMembers = await businessRules.getMerchantTeam(branchIds);
        setTeam(teamMembers);
      }
      
      setNewMember({ name: '', email: '', password: '', branchId: '', commissionRate: 30 });
      setFoundProfile(null);
      setSearchCpf('');
      setShowAddMember(false);
      toast.success(foundProfile ? 'Gerente vinculado!' : 'Conta criada e gerente vinculado!', { id: loadingToast });
    } catch (error: any) {
      console.error('Erro ao adicionar gerente:', error);
      toast.error(error.message || 'Erro ao processar gerente.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const loadingToast = toast.loading('Atualizando gerente...');
    try {
      setIsSaving(true);
      const mId = merchantId || profile?.id;
      if (!mId) throw new Error('ID do lojista não encontrado.');
      
      const commission = parseInt(String(editingMember.commissionRate)) || 0;
      const emailChanged = editingMember.email !== originalMember?.email;
      const passwordChanged = (editingMember as any).password && (editingMember as any).password.trim() !== '';

      await businessRules.updateMerchantMember({
        userId: editingMember.id,
        name: editingMember.name,
        email: emailChanged ? editingMember.email : undefined,
        password: passwordChanged ? (editingMember as any).password.trim() : undefined,
        branchId: editingMember.branchId === 'matriz' ? '' : (editingMember.branchId || ''),
        commissionRate: commission,
        merchantId: mId
      });

      // Refresh team list
      const branchIds = branches.map(b => b.id);
      const teamMembers = await businessRules.getMerchantTeam(branchIds);
      setTeam(teamMembers);

      setEditingMember(null);
      toast.success('Dados atualizados com sucesso!', { id: loadingToast });
    } catch (error: any) {
      console.error('Erro ao atualizar gerente:', error);
      toast.error(error.message || 'Erro ao atualizar gerente.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o gerente "${name}" da sua equipe?`)) return;

    const loadingToast = toast.loading('Removendo gerente...');
    try {
      setIsSaving(true);
      await businessRules.removeMerchantMember(userId);

      // Refresh team list
      const branchIds = branches.map(b => b.id);
      const teamMembers = await businessRules.getMerchantTeam(branchIds);
      setTeam(teamMembers);

      toast.success('Gerente removido da equipe!', { id: loadingToast });
    } catch (error: any) {
      console.error('Erro ao remover gerente:', error);
      toast.error(error.message || 'Erro ao remover gerente.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !merchantId) return;
    
    const loadingToast = toast.loading('Cadastrando método...');
    setIsSaving(true);
    try {
      await businessRules.addShippingMethod({
        merchantId: merchantId,
        name: newShipping.name,
        type: newShipping.type,
        fee: newShipping.fee,
        deadline: newShipping.deadline
      });
      
      const methods = await businessRules.getShippingMethods(profile.id);
      setShippingMethods(methods);
      
      setNewShipping({ name: '', fee: 0, deadline: '', type: 'fixed' });
      setShowAddShipping(false);
      toast.success('Método de entrega adicionado!', { id: loadingToast });
    } catch (error: any) {
      console.error('Erro ao adicionar entrega:', error);
      toast.error(error.message || 'Erro ao cadastrar.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil da Loja', icon: Store },
    { id: 'address', label: 'Endereço e Frete', icon: MapPin },
    { id: 'branches', label: 'Filiais', icon: Building2 },
    { id: 'team', label: 'Equipe / Gerentes', icon: UsersIcon },
    { id: 'financial', label: 'Dados Bancários', icon: CreditCard },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  const handleActivateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeForm.storeName || !upgradeForm.cnpj) {
      toast.error('Preencha todos os campos para ativar sua loja');
      return;
    }

    setIsActivating(true);
    try {
      if (!profile) throw new Error('Usuário não autenticado');

      await businessRules.activateMerchantAccount(profile.id, upgradeForm);
      toast.success('Loja ativada com sucesso! Bem-vindo parceiro.');
      await refreshProfile(); // Atualiza o contexto global
      window.location.reload(); // Recarrega para aplicar as novas políticas de RLS e rotas
    } catch (error) {
      console.error('Erro ao ativar conta de lojista:', error);
      toast.error('Erro ao ativar loja. Tente novamente.');
    } finally {
      setIsActivating(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Configurações" subtitle="Carregando...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="size-8 border-4 border-primary-blue/30 border-t-primary-blue rounded-full animate-spin"></div>
        </div>
      </MerchantLayout>
    );
  }

  if (isAffiliateOnly) {
    const isAuthorized = profile?.email && AUTHORIZED_EMAILS.includes(profile.email.toLowerCase());

    return (
      <MerchantLayout title="Portal do Lojista" subtitle={isAuthorized ? "Ative sua loja" : "Lista de Espera"}>
        <div className="p-8 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Store size={300} className="text-midnight" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-3xl bg-indigo-50 text-indigo-600 mb-4">
                    {isAuthorized ? <Store size={48} /> : <Zap size={48} />}
                  </div>
                  <h1 className="text-4xl font-black text-midnight tracking-tight italic uppercase">
                    {isAuthorized ? 'Expandir para Lojista' : 'Venda no Marketplace'}
                  </h1>
                  <p className="text-slate-500 font-medium max-w-xl mx-auto">
                    {isAuthorized 
                      ? "Você tem acesso antecipado! Preencha os dados abaixo para ativar seu painel de vendas e começar a cadastrar seus produtos."
                      : "Estamos preparando o maior ecossistema de serviços urbanos do Brasil. No momento, o cadastro de novos lojistas está disponível apenas para convidados."
                    }
                  </p>
                </div>

                {isAuthorized ? (
                  <form onSubmit={handleActivateMerchant} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Loja</label>
                      <div className="relative">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Ex: Minha Loja Inc"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all font-bold text-midnight"
                          value={upgradeForm.storeName}
                          onChange={(e) => setUpgradeForm({ ...upgradeForm, storeName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ da Empresa</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="00.000.000/0000-00"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all font-bold text-midnight"
                          value={upgradeForm.cnpj}
                          onChange={(e) => setUpgradeForm({ ...upgradeForm, cnpj: e.target.value.replace(/\D/g, '').substring(0, 14) })}
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        disabled={isActivating}
                        className="w-full bg-midnight text-white py-5 rounded-2xl font-black italic uppercase tracking-widest hover:bg-primary-blue transition-all shadow-xl shadow-midnight/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isActivating ? 'Ativando...' : 'Ativar Minha Conta de Lojista'}
                        {!isActivating && <CheckCircle size={20} />}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-amber-50 p-10 rounded-[2rem] border border-amber-100 text-center space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-amber-900 uppercase italic">Você está na Lista de Espera!</h3>
                      <p className="text-amber-700 text-sm font-medium">
                        Sua solicitação de interesse foi registrada. Assim que liberarmos novas vagas para lojistas na sua região, você receberá um convite por e-mail.
                      </p>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button 
                        disabled
                        className="bg-amber-200 text-amber-800 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed"
                      >
                        Aguardando Liberação
                      </button>
                      <a href="/" className="text-amber-900 font-black text-[10px] uppercase tracking-widest hover:underline">
                        Voltar para o Início
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Configurações" subtitle="Gerencie as informações da sua loja">
      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
        
        {/* Settings Navigation */}
        <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                  ? 'bg-midnight text-white shadow-xl shadow-midnight/20' 
                  : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden min-h-[500px]">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full bg-emerald-500 text-midnight p-4 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest z-50"
            >
              <CheckCircle size={16} /> Configurações salvas com sucesso!
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Perfil da Loja</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informações públicas exibidas para os clientes</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <label className="w-full sm:w-48 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-primary-blue transition-all cursor-pointer group overflow-hidden relative">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={32} className="mb-2 group-hover:scale-110 transition-transform group-hover:text-primary-blue" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Alterar Logo</span>
                      </>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-midnight/40 flex items-center justify-center text-white">
                        <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                  </label>

                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                        <input type="text" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                        <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '').substring(0, 14)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
                        <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                        <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '').substring(0, 11)})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button type="submit" className="bg-primary-blue hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                    Salvar Perfil
                  </button>
                </div>
              </motion.div>
            </form>
          )}

          {activeTab === 'address' && (
            <div className="p-8 lg:p-12">
              <form onSubmit={handleSave}>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Endereço de Estoque / Retirada</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Onde seus produtos ficam armazenados</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                      <input type="text" value={formData.stockAddress} onChange={e => setFormData({...formData, stockAddress: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                      <input type="text" value={formData.stockNumber} onChange={e => setFormData({...formData, stockNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                      <input type="text" value={formData.stockNeighborhood} onChange={e => setFormData({...formData, stockNeighborhood: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                      <input type="text" value={formData.stockCity} onChange={e => setFormData({...formData, stockCity: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                      <input type="text" value={formData.stockZipCode} onChange={e => setFormData({...formData, stockZipCode: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <button type="submit" className="bg-primary-blue text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2 flex items-center">
                      <Save size={18} /> Salvar Endereço
                    </button>
                  </div>

                  <div className="pt-12 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Métodos de Entrega</h3>
                      </div>
                      <button type="button" onClick={() => setShowAddShipping(true)} className="bg-midnight text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Plus size={16} /> Novo Método
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {shippingMethods.map((method) => (
                        <div key={method.id} className={`p-6 rounded-3xl border flex items-center justify-between group ${method.active ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div className="flex items-center gap-3">
                            <Truck className={method.active ? 'text-emerald-500' : 'text-slate-300'} size={20} />
                            <div>
                              <p className={`text-sm font-black ${method.active ? 'text-midnight' : 'text-slate-400'}`}>{method.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {method.type === 'fixed' ? `R$ ${Number(method.fee).toFixed(2).replace('.', ',')}` : 'Calculado'} • {method.deadline}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={async () => {
                                if (confirm('Excluir este método?')) {
                                  const tId = toast.loading('Excluindo...');
                                  try {
                                    await businessRules.deleteShippingMethod(method.id);
                                    setShippingMethods(shippingMethods.filter(s => s.id !== method.id));
                                    toast.success('Excluído!', { id: tId });
                                  } catch (error) { toast.error('Erro ao excluir', { id: tId }); }
                                }
                              }}
                              className="size-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center ${method.active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200'}`}>
                              {method.active && <CheckCircle size={14} />}
                            </div>
                          </div>
                        </div>
                      ))}
                      {shippingMethods.length === 0 && (
                        <div className="col-span-2 py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum método cadastrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </form>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Gestão de Filiais</h3>
                  <button onClick={() => setShowAddBranch(true)} className="bg-midnight text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Plus size={16} /> Nova Filial
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {branches.map(branch => (
                    <div key={branch.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start justify-between">
                      <div className="flex gap-4">
                        <Building2 size={24} className="text-primary-blue shrink-0" />
                        <div>
                          <h4 className="font-black text-midnight uppercase">{branch.name}</h4>
                          <p className="text-xs text-slate-500">{branch.address}, {branch.city}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm(`Excluir a filial "${branch.name}"?`)) {
                            const loadingToast = toast.loading('Excluindo filial...');
                            try {
                              await businessRules.deleteBranch(branch.id);
                              setBranches(branches.filter(b => b.id !== branch.id));
                              toast.success('Filial excluída!', { id: loadingToast });
                            } catch (error: any) {
                              toast.error('Erro ao excluir: ' + error.message, { id: loadingToast });
                            }
                          }
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Equipe / Gerentes</h3>
                  <button onClick={() => setShowAddMember(true)} className="bg-midnight text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Plus size={16} /> Novo Gerente
                  </button>
                </div>
                <table className="w-full text-left font-bold">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 text-[10px] text-midnight uppercase">Gerente</th>
                      <th className="py-4 text-[10px] text-midnight uppercase">Filial</th>
                      <th className="py-4 text-[10px] text-midnight uppercase text-center">Cashback</th>
                      <th className="py-4 text-[10px] text-midnight uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(member => (
                      <tr key={member.id} className="border-b border-slate-50 group">
                        <td className="py-4 text-midnight">{member.name}</td>
                        <td className="py-4 text-xs text-slate-900">{branches.find(b => b.id === member.branchId)?.name || '-'}</td>
                        <td className="py-4 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px]">{member.commissionRate}%</span></td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingMember({...member});
                                setOriginalMember({...member});
                              }}
                              className="size-8 bg-slate-50 text-slate-400 hover:text-primary-blue rounded-lg flex items-center justify-center transition-colors shadow-sm"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="size-8 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="p-8 lg:p-12">
              <form onSubmit={handleSave}>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Dados Bancários / Saques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4">
                        <input placeholder="Banco" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} className="w-full bg-white border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                        <div className="grid grid-cols-2 gap-4">
                          <input placeholder="Agência" value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} className="w-full bg-white border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                          <input placeholder="Conta" value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className="w-full bg-white border border-slate-100 px-6 py-4 rounded-2xl font-bold text-midnight" />
                        </div>
                      </div>
                      <div className="bg-midnight p-8 rounded-[2.5rem] space-y-4 text-white">
                        <select value={formData.pixType} onChange={e => setFormData({...formData, pixType: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white">
                          <option value="CPF" className="bg-midnight">CPF</option>
                          <option value="CNPJ" className="bg-midnight">CNPJ</option>
                          <option value="Email" className="bg-midnight">E-mail</option>
                        </select>
                        <input placeholder="Chave PIX" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white placeholder:text-white/50" />
                      </div>
                  </div>
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <button type="submit" disabled={isSaving} className="bg-primary-blue text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2">
                      <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Dados Financeiros'}
                    </button>
                  </div>
                </motion.div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Segurança</h3>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield size={24} className="text-primary-blue" />
                    <div>
                      <h4 className="font-black text-midnight italic uppercase">Alterar Minha Senha</h4>
                    </div>
                  </div>
                  <button className="bg-white border border-slate-200 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Atualizar</button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddBranch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddBranch(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-midnight mb-6 uppercase italic">Nova Filial</h3>
              <form onSubmit={handleAddBranch} className="space-y-4">
                <input required placeholder="Nome da Filial" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                <input required placeholder="Endereço Completo" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Cidade" value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                  <input required placeholder="Estado" value={newBranch.state} onChange={e => setNewBranch({...newBranch, state: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                </div>
                <button type="submit" className="w-full bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Confirmar Cadastro</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddMember(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-midnight mb-6 uppercase italic">Novo Gerente</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF do Gerente</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      placeholder="000.000.000-00" 
                      value={searchCpf} 
                      onChange={e => setSearchCpf(e.target.value)} 
                      className="flex-1 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" 
                    />
                    <button 
                      type="button"
                      onClick={handleSearchCpf}
                      disabled={isSearching}
                      className="bg-midnight text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      {isSearching ? '...' : 'Buscar'}
                    </button>
                  </div>
                </div>

                {foundProfile ? (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
                    <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Usuário Encontrado</p>
                      <h4 className="font-black text-midnight">{foundProfile.name}</h4>
                    </div>
                  </div>
                ) : searchCpf.length >= 11 && !isSearching && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input required placeholder="Nome do Gerente" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input required type="email" placeholder="email@exemplo.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input required type="password" placeholder="Mínimo 6 caracteres" value={newMember.password} onChange={e => setNewMember({...newMember, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atribuir Filial</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight appearance-none" value={newMember.branchId} onChange={e => setNewMember({...newMember, branchId: e.target.value})}>
                        <option value="">Selecionar Filial</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cashback Gerencial (%)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required type="number" placeholder="Cashback (%)" value={newMember.commissionRate} onChange={e => setNewMember({...newMember, commissionRate: parseInt(e.target.value)})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>
                <button type="submit" className="w-full bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">
                  {foundProfile ? 'Vincular Gerente' : 'Criar Acesso Completo'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddShipping && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddShipping(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-midnight mb-4 uppercase italic">Novo Frete / Logística</h3>
              <form onSubmit={handleAddShipping} className="space-y-4">
                <select value={newShipping.type} onChange={e => setNewShipping({...newShipping, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight">
                  <option value="fixed" className="text-midnight">Entrega Fixa (Moto/Local)</option>
                  <option value="calculated" className="text-midnight">Calculado (Transportadora)</option>
                </select>
                <input required placeholder="Nome (Ex: Motoboy Centro)" value={newShipping.name} onChange={e => setNewShipping({...newShipping, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.01" placeholder="Taxa (R$)" value={newShipping.fee || ''} onChange={e => setNewShipping({...newShipping, fee: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                  <input required placeholder="Prazo (Ex: 24h)" value={newShipping.deadline} onChange={e => setNewShipping({...newShipping, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight" />
                </div>
                <button type="submit" className="w-full bg-midnight text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Salvar Método</button>
              </form>
            </motion.div>
          </div>
        )}
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-midnight uppercase italic leading-none">Editar Gerente</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Atualize as permissões e dados do membro</p>
                </div>
              </div>
              
              <form onSubmit={handleUpdateMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required placeholder="Nome do Gerente" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required type="email" placeholder="email@exemplo.com" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alterar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="password" placeholder="Deixe em branco para manter" value={(editingMember as any).password || ''} onChange={e => setEditingMember({...editingMember, password: e.target.value} as any)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cashback Gerencial (%)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required type="number" placeholder="Cashback (%)" value={editingMember.commissionRate} onChange={e => setEditingMember({...editingMember, commissionRate: parseInt(e.target.value)})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filial Atribuída</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-midnight appearance-none" value={editingMember.branchId} onChange={e => setEditingMember({...editingMember, branchId: e.target.value})}>
                      <option value="">Selecionar Filial</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button type="button" onClick={() => setEditingMember(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="w-full bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary-blue/20">Salvar Dados</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
