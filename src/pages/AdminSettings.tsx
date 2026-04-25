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
import { businessRules } from '../lib/businessRules';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'mmn' | 'financeiro' | 'plataforma' | 'seguranca'>('mmn');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // MMN State
  const [mmnDepth, setMmnDepth] = useState(6);
  const [mmnType, setMmnType] = useState<'percent' | 'fixed'>('percent');
  const [mmnLevels, setMmnLevels] = useState<any[]>([]);
  const [cashbackMensal, setCashbackMensal] = useState(2.75);
  const [cashbackDigital, setCashbackDigital] = useState(1.00);
  const [cashbackAnual, setCashbackAnual] = useState(0.75);

  // Financeiro State
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [withdrawalFee, setWithdrawalFee] = useState(4.90);
  const [payoutSchedule, setPayoutSchedule] = useState('Padrão (D+15)');

  // Plataforma State
  const [marketplaceCommission, setMarketplaceCommission] = useState(12);

  // Carregar dados iniciais
  React.useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const [mmnConfig, levelsData, finConfig, marketConfig] = await Promise.all([
          businessRules.getMMNConfig(),
          businessRules.getMMNLevels(),
          businessRules.getFinancialConfig(),
          businessRules.getMarketplaceConfig()
        ]);
        
        // MMN
        setMmnDepth(mmnConfig.depth);
        setMmnType(mmnConfig.paymentType);
        setCashbackMensal(mmnConfig.cashbackMensal);
        setCashbackDigital(mmnConfig.cashbackDigital);
        setCashbackAnual(mmnConfig.cashbackAnual);
        
        setMmnLevels(levelsData.length > 0 ? levelsData : [
          { level: 1, value: 0.25 },
          { level: 2, value: 1.5 },
          { level: 3, value: 1.5 },
          { level: 4, value: 1.5 },
          { level: 5, value: 0 },
          { level: 6, value: 0 },
        ]);

        // Financeiro
        setMinWithdrawal(finConfig.minWithdrawalAmount);
        setWithdrawalFee(finConfig.withdrawalFee);
        setPayoutSchedule(finConfig.payoutSchedule);

        // Plataforma
        setMarketplaceCommission(marketConfig.commissionRate);

      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (activeTab === 'mmn') {
        await businessRules.saveMMNConfig({ 
          depth: mmnDepth, 
          paymentType: mmnType,
          cashbackMensal,
          cashbackDigital,
          cashbackAnual
        });
        await businessRules.saveMMNLevels(mmnLevels.slice(0, Math.max(mmnDepth, 6)));
      } else if (activeTab === 'financeiro') {
        await businessRules.saveFinancialConfig({
          minWithdrawalAmount: minWithdrawal,
          withdrawalFee: withdrawalFee,
          payoutSchedule: payoutSchedule
        });
      } else if (activeTab === 'plataforma') {
        await businessRules.updateMarketplaceConfig({ commissionRate: marketplaceCommission });
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
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
                              max="6" 
                              value={mmnDepth}
                              onChange={(e) => {
                                const newDepth = parseInt(e.target.value);
                                setMmnDepth(newDepth);
                                if (newDepth > mmnLevels.length) {
                                  const extended = [...mmnLevels];
                                  for (let i = mmnLevels.length + 1; i <= newDepth; i++) {
                                    extended.push({ level: i, value: 0 });
                                  }
                                  setMmnLevels(extended);
                                }
                              }}
                              className="flex-1 accent-indigo-500"
                            />
                            <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
                              {mmnDepth}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cashback Mensal</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={cashbackMensal}
                                  onChange={e => setCashbackMensal(Number(e.target.value))}
                                  className="w-full bg-white/5 border border-white/5 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-black text-center"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/50 text-[10px] font-black">%</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cashback Digital</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={cashbackDigital}
                                  onChange={e => setCashbackDigital(Number(e.target.value))}
                                  className="w-full bg-white/5 border border-white/5 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-black text-center"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/50 text-[10px] font-black">%</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cashback Anual</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={cashbackAnual}
                                  onChange={e => setCashbackAnual(Number(e.target.value))}
                                  className="w-full bg-white/5 border border-white/5 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-black text-center"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/50 text-[10px] font-black">%</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    {mmnLevels.slice(0, Math.max(mmnDepth, 6)).map((level, index) => (
                      <div key={level.level} className={`bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-colors group ${level.level > mmnDepth ? 'opacity-20 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{level.level === 1 ? 'G1 - Você' : `G${level.level} - Nível ${level.level - 1}`}</p>
                           {level.level === 1 && <div className="size-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 animate-pulse" />}
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01"
                            value={level.value}
                            onChange={(e) => {
                              const newLevels = [...mmnLevels];
                              newLevels[index] = { ...newLevels[index], value: Number(e.target.value) };
                              setMmnLevels(newLevels);
                            }}
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
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                          <input 
                            type="number" 
                            value={minWithdrawal} 
                            onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/5 pl-14 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxa de Saque Operacional</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                          <input 
                            type="number" 
                            step="0.10"
                            value={withdrawalFee} 
                            onChange={(e) => setWithdrawalFee(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/5 pl-14 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>
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
                        <div 
                          key={p} 
                          onClick={() => setPayoutSchedule(p)}
                          className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer group ${payoutSchedule === p ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                          <span className={`text-xs font-black uppercase tracking-widest ${payoutSchedule === p ? 'text-white' : 'text-slate-400'}`}>{p}</span>
                          <div className={`size-6 rounded-full border-2 transition-all ${payoutSchedule === p ? 'bg-indigo-600 border-indigo-500 border-4' : 'border-white/10'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'plataforma' && (
                <motion.div 
                  key="plataforma"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Marketplace</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configurações globais de vendas</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxa de Comissão da Plataforma</label>
                        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                          <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            value={marketplaceCommission}
                            onChange={(e) => setMarketplaceCommission(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500"
                          />
                          <div className="size-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
                            {marketplaceCommission}%
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-2">
                          Esta taxa é aplicada sobre o valor bruto de cada venda realizada no marketplace.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-10 flex flex-col justify-center">
                    <Globe className="text-indigo-500 mb-6" size={40} />
                    <h4 className="text-lg font-black text-white tracking-tighter uppercase italic mb-4 text-left">Visibilidade e Escopo</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
                      As alterações nesta aba afetam todos os lojistas ativos no ecossistema Urbano. 
                      Novas filiais herdarão automaticamente estas configurações de comissionamento.
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <Layers size={18} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Marketplace Multi-Vendedor Ativo</span>
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
