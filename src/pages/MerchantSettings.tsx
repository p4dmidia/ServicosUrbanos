import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  CreditCard, 
  Bell, 
  Shield, 
  Image as ImageIcon,
  Save,
  CheckCircle,
  Truck
} from 'lucide-react';
import MerchantLayout from '../components/MerchantLayout';
import { motion } from 'motion/react';

export default function MerchantSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil da Loja', icon: Store },
    { id: 'address', label: 'Endereço e Frete', icon: MapPin },
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
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

          <form onSubmit={handleSave} className="p-8 lg:p-12">
            
            {activeTab === 'profile' && (
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
                  {/* Logo Upload */}
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Contato</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Curta</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight resize-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'address' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Endereço e Logística</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local de origem para cálculo de fretes</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço (Rua, Número)</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                    <input 
                      type="text" 
                      value={formData.zipCode}
                      onChange={e => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-primary-blue shadow-sm shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-midnight text-sm mb-1">Integração Correios</h4>
                    <p className="text-xs text-slate-500 font-medium">Os fretes serão calculados automaticamente usando o CEP de origem cadastrado acima.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'financial' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Dados Bancários</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conta para recebimento de saques</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                    <input 
                      type="text" 
                      value={formData.bank}
                      onChange={e => setFormData({...formData, bank: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Chave PIX</label>
                    <select 
                      value={formData.pixType}
                      onChange={e => setFormData({...formData, pixType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight cursor-pointer"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="Email">E-mail</option>
                      <option value="Celular">Celular</option>
                      <option value="Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                    <input 
                      type="text" 
                      value={formData.agency}
                      onChange={e => setFormData({...formData, agency: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                    <input 
                      type="text" 
                      value={formData.pixKey}
                      onChange={e => setFormData({...formData, pixKey: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta (com dígito)</label>
                    <input 
                      type="text" 
                      value={formData.account}
                      onChange={e => setFormData({...formData, account: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic mb-1">Segurança e Acesso</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Proteja sua conta</p>
                </div>

                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                    <input 
                      type="password" 
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-bold text-midnight"
                    />
                  </div>
                </div>

                <div className="mt-8 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-orange-600 text-sm mb-1">Notificações de Login</h4>
                    <p className="text-xs text-orange-600/80 font-medium">Enviaremos um e-mail sempre que houver um acesso à sua conta de um novo dispositivo.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-primary-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-blue/20 flex items-center gap-2"
              >
                {isSaving ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Save size={18} />
                  </motion.div>
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </MerchantLayout>
  );
}
