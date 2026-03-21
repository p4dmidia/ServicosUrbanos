import React, { useState } from 'react';
import { 
  Settings, 
  Zap, 
  Shield, 
  CreditCard, 
  Bell, 
  Save, 
  Percent, 
  DollarSign, 
  Layers, 
  CheckCircle,
  HelpCircle,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'mmn' | 'financeiro' | 'plataforma' | 'seguranca'>('mmn');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // MMN State
  const [mmnDepth, setMmnDepth] = useState(5);
  const [mmnType, setMmnType] = useState<'percent' | 'fixed'>('percent');
  const [mmnLevels, setMmnLevels] = useState([
    { level: 1, value: 10 },
    { level: 2, value: 5 },
    { level: 3, value: 3 },
    { level: 4, value: 2 },
    { level: 5, value: 1 },
  ]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'mmn', label: 'Lógica MMN', icon: Zap },
    { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
    { id: 'plataforma', label: 'Plataforma', icon: Globe },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ];

  return (
    <AdminLayout title="Configurações do Sistema" subtitle="Gerenciamento de Parâmetros Globais e MMN">
      <div className="p-8 lg:p-12 space-y-8">
        
        {/* Settings Secondary Navigation */}
        <div className="flex p-1.5 bg-[#0a0e17] rounded-3xl border border-white/5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full bg-emerald-500 text-midnight p-4 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest z-50 shadow-2xl"
            >
              <CheckCircle size={16} /> Configurações aplicadas com sucesso em todo o ecossistema!
            </motion.div>
          )}

          <div className="p-8 lg:p-12">
            <AnimatePresence mode='wait'>
              {activeTab === 'mmn' && (
                <motion.div 
                  key="mmn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Configuração MMN</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Defina a profundidade e distribuição da rede</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Profundidade da Rede (Níveis)</label>
                          <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={mmnDepth}
                              onChange={(e) => setMmnDepth(parseInt(e.target.value))}
                              className="flex-1 accent-indigo-500"
                            />
                            <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
                              {mmnDepth}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Comissionamento</label>
                          <div className="flex p-1.5 bg-white/5 rounded-3xl border border-white/5">
                            <button 
                              onClick={() => setMmnType('percent')}
                              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mmnType === 'percent' ? 'bg-white/10 text-indigo-400 border border-indigo-500/20 shadow-xl shadow-indigo-500/5' : 'text-slate-500'}`}
                            >
                              <Percent size={14} /> Percentual (%)
                            </button>
                            <button 
                              onClick={() => setMmnType('fixed')}
                              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mmnType === 'fixed' ? 'bg-white/10 text-indigo-400 border border-indigo-500/20 shadow-xl shadow-indigo-500/5' : 'text-slate-500'}`}
                            >
                              <DollarSign size={14} /> Valor Fixo (R$)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-10 flex flex-col justify-center">
                      <Zap className="text-indigo-500 mb-6" size={40} />
                      <h4 className="text-lg font-black text-white tracking-tighter uppercase italic mb-4 text-left">Resumo da Rede</h4>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
                        Ao selecionar <strong>{mmnType === 'percent' ? 'Percentual' : 'Valor Fixo'}</strong>, o total distribuído será de <strong>{mmnLevels.slice(0, mmnDepth).reduce((a, b) => a + b.value, 0)}{mmnType === 'percent' ? '%' : ' R$'}</strong> ao longo de <strong>{mmnDepth} gerações</strong>.
                      </p>
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <HelpCircle size={18} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuração Global Aplicada</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {mmnLevels.slice(0, mmnDepth).map((level) => (
                      <div key={level.level} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-colors group">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{level.level}º Nível</p>
                        <div className="relative">
                          <input 
                            type="number" 
                            defaultValue={level.value}
                            className="w-full bg-[#05070a] border border-white/5 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-black text-xl"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-500/50 text-base">
                            {mmnType === 'percent' ? '%' : 'R$'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'financeiro' && (
                <motion.div 
                  key="financeiro"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Taxas e Limites</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Controle transacional do ecossistema</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Mínimo para Saque (PIX)</label>
                        <input type="text" defaultValue="R$ 50,00" className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxa de Saque Operacional</label>
                        <input type="text" defaultValue="R$ 4,90" className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Prazos de Recebimento</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Antecipação e compensação</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {['Padrão (D+15)', 'Acelerado (D+7)', 'Flash (D+2)'].map((p) => (
                        <div key={p} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                          <span className="text-xs font-black text-white uppercase tracking-widest">{p}</span>
                          <div className={`size-6 rounded-full border-2 ${p.includes('Padrão') ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 group-hover:border-white/20'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'seguranca' && (
                <motion.div 
                  key="seguranca"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-2xl space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Segurança do Painel</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestão de acesso super admin</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" />
                    </div>
                    
                    <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center gap-6">
                      <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Lock size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white">Autenticação em Dois Fatores (2FA)</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recomendado para Super Admin</p>
                      </div>
                      <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center px-1">
                        <div className="size-4 bg-white rounded-full translate-x-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Action */}
          <div className="p-8 lg:p-12 border-t border-white/5 flex items-center justify-between gap-6">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] hidden md:block italic">
              Atenção: Alterações nas configurações MMN afetam cálculos de comissões futuras.
            </p>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Save size={20} />
                </motion.div>
              ) : (
                <Save size={20} className="group-hover:scale-110 transition-transform" />
              )}
              {loading ? 'Processando...' : 'Salvar Todas as Configurações'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
