import React, { useState, useEffect } from 'react';
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
  Edit2
} from 'lucide-react';
import MerchantLayout from '../components/MerchantLayout';
import { motion, AnimatePresence } from 'motion/react';
import { businessRules, Branch, MerchantUser } from '../lib/businessRules';

export default function MerchantSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<MerchantUser | null>(null);

  // Estados para Filiais e Equipe
  const [branches, setBranches] = useState<Branch[]>([]);
  const [team, setTeam] = useState<MerchantUser[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddShipping, setShowAddShipping] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const [newBranch, setNewBranch] = useState<Omit<Branch, 'id'>>({
    name: '', address: '', city: '', state: '', zipCode: ''
  });

  const [newMember, setNewMember] = useState<Omit<MerchantUser, 'id'>>({
    name: '', email: '', role: 'manager', branchId: '', commissionRate: 30
  });

  const [formData, setFormData] = useState({
    storeName: 'Minha Loja Tech',
    document: '12.345.678/0001-90',
    email: 'contato@minhalojatech.com',
    phone: '(11) 99999-9999',
    description: 'A melhor loja de eletrônicos do marketplace.',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    bank: 'Itaú (341)',
    agency: '0001',
    account: '12345-6',
    pixType: 'CNPJ',
    pixKey: '12.345.678/0001-90',
  });

  useEffect(() => {
    const user = businessRules.getCurrentUser();
    setCurrentUser(user);
    setBranches(businessRules.getBranches());
    setTeam(businessRules.getUsers().filter(u => u.role === 'manager'));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const added = businessRules.addBranch(newBranch);
    
    // Associar gerente se selecionado
    if (selectedManagerId) {
      businessRules.assignUserToBranch(selectedManagerId, added.id);
      // Atualizar o estado da equipe localmente
      setTeam(team.map(u => u.id === selectedManagerId ? { ...u, branchId: added.id } : u));
    }

    setBranches([...branches, added]);
    setNewBranch({ name: '', address: '', city: '', state: '', zipCode: '' });
    setSelectedManagerId('');
    setShowAddBranch(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const added = businessRules.addUser(newMember);
    setTeam([...team, added]);
    setShowAddMember(false);
    setNewMember({ name: '', email: '', role: 'manager', branchId: '', commissionRate: 30 });
  };

  const tabs = [
    { id: 'profile', label: 'Perfil da Loja', icon: Store },
    { id: 'address', label: 'Endereço e Frete', icon: MapPin },
    { id: 'branches', label: 'Filiais', icon: Building2 },
    { id: 'team', label: 'Equipe / Gerentes', icon: UsersIcon },
    { id: 'financial', label: 'Dados Bancários', icon: CreditCard },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

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
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Perfil da Loja</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informações públicas exibidas para os clientes</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="w-full sm:w-48 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-primary-blue transition-all cursor-pointer group">
                    <ImageIcon size={32} className="mb-2 group-hover:scale-110 transition-transform group-hover:text-primary-blue" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Alterar Logo</span>
                  </div>

                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Loja</label>
                        <input 
                          type="text" 
                          value={formData.storeName}
                          onChange={e => setFormData({...formData, storeName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                        <input 
                          type="text" 
                          disabled
                          value={formData.document}
                          className="w-full bg-slate-100 border border-slate-200 px-6 py-4 rounded-2xl text-slate-400 cursor-not-allowed font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button type="submit" className="bg-primary-blue hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                    <Save size={18} /> Salvar Alterações
                  </button>
                </div>
              </motion.div>
            </form>
          )}

          {activeTab === 'branches' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Gestão de Filiais</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lojas físicas vinculadas à sua matriz</p>
                  </div>
                  <button 
                    onClick={() => setShowAddBranch(true)}
                    className="bg-midnight hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Filial
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {branches.map(branch => (
                    <div key={branch.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start justify-between group">
                      <div className="flex gap-4">
                        <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary-blue shadow-sm shrink-0">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-midnight uppercase tracking-tighter">{branch.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{branch.address}, {branch.city} - {branch.state}</p>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block">ID: {branch.id}</span>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  {branches.length === 0 && (
                    <div className="col-span-2 py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <Building2 size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma filial cadastrada</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Equipe de Gerentes</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Responsáveis pelas filiais e suas comissões personalizadas</p>
                  </div>
                  <button 
                    onClick={() => setShowAddMember(true)}
                    className="bg-midnight hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus size={16} /> Novo Gerente
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-relaxed">
                  ❗ A comissão é definida individualmente para cada gerente no momento do cadastro ou edição. 
                  O valor padrão é 30%, mas você pode ajustar conforme o acordo com cada colaborador.
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerente</th>
                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filial</th>
                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão Ganha</th>
                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {team.map(member => (
                        <tr key={member.id} className="group">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-midnight">{member.name}</p>
                                <p className="text-[10px] text-slate-400">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 font-bold text-xs text-slate-500 uppercase">
                            {branches.find(b => b.id === member.branchId)?.name || 'Nenhuma'}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-[10px] border border-emerald-100">
                                {member.commissionRate}% por venda
                              </span>
                              <button 
                                onClick={() => {
                                  const newRate = prompt('Nova comissão (%)', member.commissionRate.toString());
                                  if (newRate) {
                                    businessRules.updateUserCommission(member.id, parseInt(newRate));
                                    setTeam(team.map(u => u.id === member.id ? {...u, commissionRate: parseInt(newRate)} : u));
                                  }
                                }}
                                className="size-6 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary-blue hover:text-white transition-all"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                             <button className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Endereço e Frete</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configure locais de retirada e opções de entrega</p>
                  </div>
                  <button 
                    onClick={() => setShowAddShipping(true)}
                    className="bg-midnight hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus size={16} /> Novo Método / Endereço
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-midnight uppercase tracking-widest border-l-4 border-primary-blue pl-4">Opções de Frete</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Frete Fixo (Moto)', value: 'R$ 15,00', active: true },
                        { label: 'Retirada na Loja', value: 'Grátis', active: true },
                        { label: 'Entrega Própria', value: 'Sob consulta', active: false }
                      ].map((opt, i) => (
                        <div key={i} className={`p-6 rounded-3xl border ${opt.active ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                            <Truck className={opt.active ? 'text-emerald-500' : 'text-slate-300'} size={20} />
                            <div>
                              <p className={`text-sm font-black ${opt.active ? 'text-midnight' : 'text-slate-400'}`}>{opt.label}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{opt.value}</p>
                            </div>
                          </div>
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center ${opt.active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200'}`}>
                            {opt.active && <CheckCircle size={14} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-midnight uppercase tracking-widest border-l-4 border-primary-blue pl-4">Exemplo de Cálculo</h4>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Simulação de Rota</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-bold">Base: Matriz Centro</span>
                          <span className="font-black text-emerald-400">R$ 0,00</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-bold">Raio até 5km</span>
                          <span className="font-black text-emerald-400">R$ 10,00</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-bold">Raio até 10km</span>
                          <span className="font-black text-emerald-400">R$ 20,00</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-slate-50 hover:bg-slate-100 text-midnight py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 transition-all flex items-center justify-center gap-2">
                       <MapPin size={16} /> Configurar Raio de Busca
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Dados Bancários</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Para onde enviaremos seus saques</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary-blue shadow-sm">
                        <CreditCard size={24} />
                      </div>
                      <h4 className="font-black text-midnight uppercase tracking-widest text-xs">Conta Principal</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instituição</p>
                        <p className="text-sm font-black text-midnight">{formData.bank}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agência</p>
                          <p className="text-sm font-black text-midnight">{formData.agency}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta</p>
                          <p className="text-sm font-black text-midnight">{formData.account}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-midnight p-8 rounded-[2.5rem] shadow-xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                          <DollarSign size={24} />
                        </div>
                        <h4 className="font-black text-white uppercase tracking-widest text-xs">Chave PIX</h4>
                      </div>
                      <div className="space-y-4 font-black">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Tipo de Chave</p>
                          <p className="text-sm text-white">{formData.pixType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Valor da Chave</p>
                          <p className="text-sm text-white">{formData.pixKey}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 lg:p-12">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Segurança e Acesso</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Proteja sua conta e controle acessos</p>
                </div>

                <div className="max-w-2xl space-y-6">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-[12px]">
                      <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary-blue shadow-sm">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-midnight uppercase tracking-widest text-xs">Alterar Senha</h4>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Última alteração há 3 meses</p>
                      </div>
                    </div>
                    <button className="bg-white hover:bg-slate-100 text-midnight px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 transition-all">
                      Atualizar
                    </button>
                   </div>

                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-[12px]">
                      <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary-blue shadow-sm">
                        <Bell size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-midnight uppercase tracking-widest text-xs">Autenticação em Duas Etapas</h4>
                        <p className="text-emerald-500 font-black uppercase text-[9px]">Ativado • Máximo Nível</p>
                      </div>
                    </div>
                    <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle size={20} />
                    </div>
                   </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ... Outras abas (financeiro, segurança) permanecem similares ... */}
        </div>
      </div>

      {/* MODAIS */}
      <AnimatePresence>
        {showAddBranch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddBranch(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <h3 className="text-2xl font-black text-midnight mb-6 uppercase italic tracking-tighter">Cadastrar Nova Filial</h3>
              <form onSubmit={handleAddBranch} className="space-y-4">
                <input required placeholder="Nome da Filial" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                <input required placeholder="Endereço" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Cidade" value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                  <input required placeholder="Estado" value={newBranch.state} onChange={e => setNewBranch({...newBranch, state: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Atribuir Gerente (Opcional)</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all appearance-none"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                  >
                    <option value="">Nenhum Gerente Inicial</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({branches.find(b => b.id === m.branchId)?.name || 'Sem Filial'})</option>
                    ))}
                  </select>
                </div>
                
                <button type="submit" className="w-full bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Salvar Filial</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddMember(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <h3 className="text-2xl font-black text-midnight mb-6 uppercase italic tracking-tighter">Novo Gerente</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <input required placeholder="Nome Completo" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                <input required type="email" placeholder="E-mail" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                <select required className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold appearance-none text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" value={newMember.branchId} onChange={e => setNewMember({...newMember, branchId: e.target.value})}>
                  <option value="">Selecionar Filial</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comissão sobre vendas (%)</label>
                  <input required type="number" value={newMember.commissionRate} onChange={e => setNewMember({...newMember, commissionRate: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                </div>
                <button type="submit" className="w-full bg-primary-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Criar Acesso</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddShipping && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddShipping(false)} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-midnight uppercase italic tracking-tighter">Configurar Logística</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adicione métodos de entrega ou pontos de coleta</p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); setShowAddShipping(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Serviço</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold appearance-none text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all">
                    <option value="delivery">Entrega (Motoboy/Transportadora)</option>
                    <option value="pickup">Ponto de Retirada (Endereço)</option>
                  </select>
                </div>
                <input required placeholder="Nome do Serviço (ex: Entrega Rápida)" className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Valor Base (R$)" type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                  <input required placeholder="Tempo Estimado" className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all" />
                </div>
                <button type="submit" className="w-full bg-midnight text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Confirmar Cadastro</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
