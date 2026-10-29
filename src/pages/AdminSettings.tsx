import React, { useState } from 'react';
import toast from 'react-hot-toast';
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
  Smartphone,
  Eye,
  EyeOff,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'mmn' | 'financeiro' | 'plataforma' | 'whatsapp' | 'seguranca'>('mmn');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Segurança State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // WhatsApp State
  const [zapiInstanceId, setZapiInstanceId] = useState('');
  const [zapiToken, setZapiToken] = useState('');
  const [zapiClientToken, setZapiClientToken] = useState('');
  const [whatsappSupabaseUrl, setWhatsappSupabaseUrl] = useState('');
  const [whatsappSupabaseAnonKey, setWhatsappSupabaseAnonKey] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Mensagem de teste do sistema Serviços Urbanos.');
  const [sendingTest, setSendingTest] = useState(false);
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [runningRenewalCadence, setRunningRenewalCadence] = useState(false);
  const [cadenceResult, setCadenceResult] = useState<any>(null);

  // MMN State
  const [mmnDepth, setMmnDepth] = useState(3);
  const [mmnType, setMmnType] = useState<'percent' | 'fixed'>('percent');
  const [mmnLevels, setMmnLevels] = useState<any[]>([
    { level: 1, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
    { level: 2, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
    { level: 3, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
  ]);

  const handleLevelChange = (levelNum: number, field: 'cashbackSemanal' | 'cashbackAnual', newValue: number) => {
    setMmnLevels(prev => prev.map(lvl => {
      if (lvl.level === levelNum) {
        const updated = { ...lvl, [field]: newValue };
        const sem = field === 'cashbackSemanal' ? newValue : Number(updated.cashbackSemanal || 0);
        const anu = field === 'cashbackAnual' ? newValue : Number(updated.cashbackAnual || 0);
        updated.value = Number((sem + anu).toFixed(2));
        return updated;
      }
      return lvl;
    }));
  };

  const activeLevels = mmnLevels.filter(lvl => lvl.level <= mmnDepth);
  const totalCashbackSemanal = Number(activeLevels.reduce((acc, lvl) => acc + (Number(lvl.cashbackSemanal) || 0), 0).toFixed(2));
  const totalCashbackAnual = Number(activeLevels.reduce((acc, lvl) => acc + (Number(lvl.cashbackAnual) || 0), 0).toFixed(2));
  const totalDistribuicaoMMN = Number((totalCashbackSemanal + totalCashbackAnual).toFixed(2));
  const margemEmpresa = Number(Math.max(0, 100 - totalDistribuicaoMMN).toFixed(2));

  // Financeiro State
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [withdrawalFee, setWithdrawalFee] = useState(4.90);
  const [payoutSchedule, setPayoutSchedule] = useState('Padrão (D+15)');

  // Plataforma State
  const [marketplaceCommission, setMarketplaceCommission] = useState(12);

  // System Logs State
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [systemLogsLoading, setSystemLogsLoading] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [fullLogs, setFullLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'Success' | 'Warning' | 'Error' | 'Info'>('all');

  // Carregar dados iniciais
  React.useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const [mmnConfig, levelsData, finConfig, marketConfig, whatsappConfig] = await Promise.all([
          businessRules.getMMNConfig(),
          businessRules.getMMNLevels(),
          businessRules.getFinancialConfig(),
          businessRules.getMarketplaceConfig(),
          businessRules.getWhatsAppConfig()
        ]);
        
        // MMN
        setMmnDepth(mmnConfig.depth || 3);
        setMmnType(mmnConfig.paymentType || 'percent');

        const defaultLevels = [
          { level: 1, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
          { level: 2, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
          { level: 3, cashbackSemanal: 8.00, cashbackAnual: 3.00, value: 11.00 },
        ];

        if (levelsData && levelsData.length > 0) {
          const merged = defaultLevels.map(def => {
            const found = levelsData.find((l: any) => l.level === def.level);
            if (found) {
              const sem = Number(found.cashbackSemanal !== undefined && found.cashbackSemanal !== null ? found.cashbackSemanal : def.cashbackSemanal);
              const anu = Number(found.cashbackAnual !== undefined && found.cashbackAnual !== null ? found.cashbackAnual : def.cashbackAnual);
              return {
                level: def.level,
                cashbackSemanal: sem,
                cashbackAnual: anu,
                value: Number((sem + anu).toFixed(2))
              };
            }
            return def;
          });
          setMmnLevels(merged);
        } else {
          setMmnLevels(defaultLevels);
        }

        // Financeiro
        setMinWithdrawal(finConfig.minWithdrawalAmount);
        setWithdrawalFee(finConfig.withdrawalFee);
        setPayoutSchedule(finConfig.payoutSchedule);

        // Plataforma
        setMarketplaceCommission(marketConfig.commissionRate);

        // WhatsApp
        setZapiInstanceId(whatsappConfig.zapiInstanceId);
        setZapiToken(whatsappConfig.zapiToken);
        setZapiClientToken(whatsappConfig.zapiClientToken);
        setWhatsappSupabaseUrl(whatsappConfig.supabaseUrl || (import.meta as any).env?.VITE_SUPABASE_URL || '');
        setWhatsappSupabaseAnonKey(whatsappConfig.supabaseAnonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
        setWhatsappEnabled(whatsappConfig.isEnabled);

      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const loadWhatsAppLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await businessRules.getWhatsAppMessages(15);
      setWhatsappLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'whatsapp') {
      loadWhatsAppLogs();
    }
  }, [activeTab]);

  const loadSystemLogs = async () => {
    setSystemLogsLoading(true);
    try {
      const logsData = await businessRules.getAdminSystemLogs();
      setSystemLogs(logsData || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setSystemLogs([]);
    } finally {
      setSystemLogsLoading(false);
    }
  };

  const handleProcessRenewalCadence = async () => {
    setRunningRenewalCadence(true);
    setCadenceResult(null);
    try {
      const res = await businessRules.processSubscriptionRenewalAlerts();
      setCadenceResult(res);
      if (res.totalQueued > 0) {
        toast.success(`Régua processada! ${res.totalQueued} mensagem(ns) enfileirada(s) com sucesso.`);
      } else {
        toast.success('Régua verificada! Nenhuma nova notificação pendente no momento.');
      }
      setTimeout(loadWhatsAppLogs, 1000);
    } catch (err: any) {
      toast.error('Erro ao processar régua: ' + (err.message || err));
    } finally {
      setRunningRenewalCadence(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'seguranca') {
      loadSystemLogs();
    }
  }, [activeTab]);

  const openLogsModal = async () => {
    setIsLogsModalOpen(true);
    try {
      const data = await businessRules.getAdminSystemLogs(50);
      setFullLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs completos:', error);
    }
  };

  const filteredLogs = fullLogs.filter(log => logFilter === 'all' || log.type === logFilter);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (activeTab === 'mmn') {
        await businessRules.saveMMNConfig({ 
          depth: mmnDepth, 
          paymentType: mmnType,
          cashbackMensal: totalCashbackSemanal,
          cashbackDigital: 0,
          cashbackAnual: totalCashbackAnual,
          commissionRegionalSemanal: 0,
          commissionRegionalMensal: 0,
          commissionRegionalAnual: 0
        });
        await businessRules.saveMMNLevels(mmnLevels);
        toast.success("Configurações de MMN atualizadas com sucesso!");
      } else if (activeTab === 'financeiro') {
        await businessRules.saveFinancialConfig({
          minWithdrawalAmount: minWithdrawal,
          withdrawalFee: withdrawalFee,
          payoutSchedule: payoutSchedule
        });
      } else if (activeTab === 'plataforma') {
        await businessRules.updateMarketplaceConfig({ commissionRate: marketplaceCommission });
      } else if (activeTab === 'whatsapp') {
        await businessRules.saveWhatsAppConfig({
          zapiInstanceId,
          zapiToken,
          zapiClientToken,
          supabaseUrl: whatsappSupabaseUrl,
          supabaseAnonKey: whatsappSupabaseAnonKey,
          isEnabled: whatsappEnabled
        });
      } else if (activeTab === 'seguranca') {
        if (!currentPassword || !newPassword) {
          toast.error("Por favor, preencha a senha atual e a nova senha.");
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error("A nova senha deve ter pelo menos 6 caracteres.");
          setLoading(false);
          return;
        }

        const email = user?.email;
        if (!email) {
          toast.error("Erro ao obter o email do usuário.");
          setLoading(false);
          return;
        }

        // Verify current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: currentPassword
        });

        if (signInError) {
          toast.error("Senha atual incorreta.");
          setLoading(false);
          return;
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          toast.error("Erro ao atualizar a senha: " + updateError.message);
          setLoading(false);
          return;
        }

        toast.success("Senha alterada com sucesso!");
        setCurrentPassword('');
        setNewPassword('');
        setLoading(false);
        return;
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
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
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
                  className="space-y-10"
                >
                  {/* Top Section: Depth + Commission Type + Totals Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Network Depth & Payment Type */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                          Configuração MMN
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Defina a profundidade e distribuição da rede
                        </p>
                      </div>

                      {/* Profundidade da Rede */}
                      <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-indigo-400" />
                            Profundidade da Rede: 3 Níveis (G0, G1 e G2)
                          </label>
                          <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider">
                            {mmnDepth} Níveis Ativos (G0 a G{mmnDepth - 1})
                          </span>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                          <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            value={mmnDepth}
                            onChange={(e) => setMmnDepth(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                          />
                          <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30 shrink-0">
                            {mmnDepth}
                          </div>
                        </div>

                        {/* Level markers */}
                        <div className="grid grid-cols-3 text-center pt-1 text-[9px] font-bold text-slate-500">
                          <span className={mmnDepth >= 1 ? 'text-indigo-400 font-black' : ''}>1º (G0)</span>
                          <span className={mmnDepth >= 2 ? 'text-indigo-400 font-black' : ''}>2º (G1)</span>
                          <span className={mmnDepth >= 3 ? 'text-indigo-400 font-black' : ''}>3º (G2)</span>
                        </div>
                      </div>

                      {/* Tipo de Comissionamento */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Tipo de Comissionamento
                        </label>
                        <div className="flex p-1.5 bg-white/5 rounded-3xl border border-white/5">
                          <button 
                            type="button"
                            onClick={() => setMmnType('percent')}
                            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mmnType === 'percent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                          >
                            <Percent size={14} /> Percentual (%)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMmnType('fixed')}
                            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mmnType === 'fixed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                          >
                            <DollarSign size={14} /> Valor Fixo (R$)
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-3">
                        <HelpCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          O administrador pode alterar os percentuais de <strong className="text-white">Cashback Semanal</strong> e <strong className="text-white">Cashback Anual</strong> individualmente para cada geração da rede na tabela abaixo.
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Resumo da Distribuição Total */}
                    <div className="bg-gradient-to-br from-indigo-950/30 via-[#0a0e17] to-purple-950/20 border border-indigo-500/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                              <Zap size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white tracking-wider uppercase italic">
                                Resumo da Distribuição Total
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                {mmnDepth} Gerações Ativas (G0 a G{mmnDepth - 1})
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Parâmetros Globais
                          </span>
                        </div>

                        {/* Cards breakdown */}
                        <div className="space-y-2.5 text-xs">
                          {/* Cashback Semanal Total */}
                          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                              <span className="font-bold text-white uppercase block text-xs">Cashback Semanal Total</span>
                              <span className="text-[10px] text-slate-400">
                                Repasse às terças-feiras (R$ {(48 * totalCashbackSemanal / 100).toFixed(2)} sobre R$ 48,00)
                              </span>
                            </div>
                            <span className="font-mono font-black text-indigo-400 text-base">
                              {totalCashbackSemanal.toFixed(1)}{mmnType === 'percent' ? '%' : ' R$'}
                            </span>
                          </div>

                          {/* Cashback Anual Total */}
                          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                              <span className="font-bold text-white uppercase block text-xs">Cashback Anual Total (10/Dez)</span>
                              <span className="text-[10px] text-slate-400">
                                Provisão anual acumulada (R$ {(48 * totalCashbackAnual / 100).toFixed(2)} sobre R$ 48,00)
                              </span>
                            </div>
                            <span className="font-mono font-black text-cyan-400 text-base">
                              {totalCashbackAnual.toFixed(1)}{mmnType === 'percent' ? '%' : ' R$'}
                            </span>
                          </div>

                          {/* Total Distribuído MMN */}
                          <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                            <div>
                              <span className="font-black text-white uppercase block text-xs flex items-center gap-1.5">
                                <span className="size-2 bg-emerald-400 rounded-full animate-pulse" />
                                Total Distribuído em Comissões (MMN)
                              </span>
                              <span className="text-[10px] text-emerald-300/80">
                                Distribuição aos microfranqueados (R$ {(48 * totalDistribuicaoMMN / 100).toFixed(2)} sobre R$ 48,00)
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-400 text-lg">
                              {totalDistribuicaoMMN.toFixed(1)}{mmnType === 'percent' ? '%' : ' R$'}
                            </span>
                          </div>

                          {/* Margem Retida pela Empresa */}
                          <div className="flex items-center justify-between p-3.5 bg-purple-500/10 rounded-2xl border border-purple-500/30">
                            <div>
                              <span className="font-black text-white uppercase block text-xs">
                                Margem Retida pela Empresa
                              </span>
                              <span className="text-[10px] text-purple-300/80">
                                Receita retida para operação (R$ {(48 * margemEmpresa / 100).toFixed(2)} sobre R$ 48,00)
                              </span>
                            </div>
                            <span className="font-mono font-black text-purple-300 text-lg">
                              {margemEmpresa.toFixed(1)}{mmnType === 'percent' ? '%' : ' R$'}
                            </span>
                          </div>
                        </div>

                        {/* Dual-color visual progress bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                            <div 
                              style={{ width: `${Math.min(100, Math.max(0, totalDistribuicaoMMN))}%` }} 
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300" 
                              title={`MMN: ${totalDistribuicaoMMN}%`}
                            />
                            <div 
                              style={{ width: `${Math.min(100, Math.max(0, margemEmpresa))}%` }} 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300" 
                              title={`Empresa: ${margemEmpresa}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 px-1">
                            <span className="text-emerald-400">Rede MMN: {totalDistribuicaoMMN.toFixed(1)}%</span>
                            <span className="text-purple-400">Margem Empresa: {margemEmpresa.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 bg-white/5 rounded-2xl border border-white/5 mt-5">
                        <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                          Regra do Sistema: Novos pedidos e comissões aplicam rigorosamente estes percentuais ativos.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section: Interactive Generations Table (G0 to G5) */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-white tracking-wider uppercase italic flex items-center gap-2">
                          <Layers size={18} className="text-indigo-400" />
                          Tabela de Distribuição por Geração MMN
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Deixar os percentuais de Cashbacks semanal e anual editáveis para alteração quando necessário
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Simulação base:</span>
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-black text-[10px]">
                          Plano R$ 48,00
                        </span>
                      </div>
                    </div>

                    {/* Generations Table */}
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#05070a]/80 shadow-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Geração</th>
                            <th className="py-4 px-4 text-center">Cashback Semanal (%)</th>
                            <th className="py-4 px-4 text-center">Cashback Anual (%)</th>
                            <th className="py-4 px-4 text-center">Total Geração</th>
                            <th className="py-4 px-6 text-center">Simulação Pedido (R$ 48,00)</th>
                            <th className="py-4 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                          {[
                            { level: 1, tag: 'G0', title: 'G0 - Venda Direta', subtitle: `Venda Direta (${mmnLevels.find(l => l.level === 1)?.cashbackSemanal ?? 8}% semanal, ${mmnLevels.find(l => l.level === 1)?.cashbackAnual ?? 3}% anual)` },
                            { level: 2, tag: 'G1', title: 'G1 - Venda do Microfranqueado Indicado Direto', subtitle: `Microfranqueado Indicado Direto (${mmnLevels.find(l => l.level === 2)?.cashbackSemanal ?? 8}% semanal, ${mmnLevels.find(l => l.level === 2)?.cashbackAnual ?? 3}% anual)` },
                            { level: 3, tag: 'G2', title: 'G2 - Venda do Microfranqueado Indireto', subtitle: `Microfranqueado Indireto (${mmnLevels.find(l => l.level === 3)?.cashbackSemanal ?? 8}% semanal, ${mmnLevels.find(l => l.level === 3)?.cashbackAnual ?? 3}% anual)` },
                          ].map((gen) => {
                            const lvl = mmnLevels.find(l => l.level === gen.level) || {
                              level: gen.level,
                              cashbackSemanal: 8,
                              cashbackAnual: 3,
                              value: 11
                            };

                            const isActive = gen.level <= mmnDepth;
                            const semVal = Number(lvl.cashbackSemanal || 0);
                            const anuVal = Number(lvl.cashbackAnual || 0);
                            const totVal = Number((semVal + anuVal).toFixed(2));

                            const simSemanal = Number((48 * semVal / 100).toFixed(2));
                            const simAnual = Number((48 * anuVal / 100).toFixed(2));
                            const simTotal = Number((simSemanal + simAnual).toFixed(2));

                            return (
                              <tr 
                                key={gen.level}
                                className={`transition-colors ${isActive ? 'bg-white/[0.01] hover:bg-white/[0.03]' : 'opacity-30 bg-black/20'}`}
                              >
                                {/* Geração Column */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`size-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                                      gen.level === 1 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                        : gen.level <= 3
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'bg-white/5 text-slate-400 border border-white/5'
                                    }`}>
                                      {gen.tag}
                                    </div>
                                    <div>
                                      <div className="font-black text-white text-xs flex items-center gap-2">
                                        {gen.title}
                                        {gen.level === 1 && (
                                          <span className="size-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        {gen.subtitle}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Cashback Semanal Input */}
                                <td className="py-4 px-4 text-center">
                                  <div className="relative inline-block w-28">
                                    <input 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      disabled={!isActive}
                                      value={lvl.cashbackSemanal}
                                      onChange={(e) => handleLevelChange(gen.level, 'cashbackSemanal', Number(e.target.value))}
                                      className={`w-full bg-[#0a0e17] border px-3 py-2.5 rounded-xl text-center font-black text-sm transition-all focus:outline-none ${
                                        isActive 
                                          ? 'border-indigo-500/30 text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20' 
                                          : 'border-white/5 text-slate-500 cursor-not-allowed'
                                      }`}
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500/50">
                                      %
                                    </span>
                                  </div>
                                </td>

                                {/* Cashback Anual Input */}
                                <td className="py-4 px-4 text-center">
                                  <div className="relative inline-block w-28">
                                    <input 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      disabled={!isActive}
                                      value={lvl.cashbackAnual}
                                      onChange={(e) => handleLevelChange(gen.level, 'cashbackAnual', Number(e.target.value))}
                                      className={`w-full bg-[#0a0e17] border px-3 py-2.5 rounded-xl text-center font-black text-sm transition-all focus:outline-none ${
                                        isActive 
                                          ? 'border-cyan-500/30 text-cyan-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20' 
                                          : 'border-white/5 text-slate-500 cursor-not-allowed'
                                      }`}
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-cyan-500/50">
                                      %
                                    </span>
                                  </div>
                                </td>

                                {/* Total Geração Badge */}
                                <td className="py-4 px-4 text-center">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl font-mono font-black text-xs ${
                                    isActive
                                      ? gen.level === 1 
                                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                                        : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                                      : 'bg-white/5 text-slate-500 border border-white/5'
                                  }`}>
                                    {totVal.toFixed(1)}%
                                  </span>
                                </td>

                                {/* Simulação Pedido R$ 48 */}
                                <td className="py-4 px-6 text-center">
                                  {isActive ? (
                                    <div className="text-[11px] font-mono leading-tight">
                                      <span className="text-indigo-300 font-bold">Sem: R$ {simSemanal.toFixed(2)}</span>
                                      <span className="text-slate-500 mx-1.5">+</span>
                                      <span className="text-cyan-300 font-bold">Anu: R$ {simAnual.toFixed(2)}</span>
                                      <span className="text-slate-500 mx-1.5">=</span>
                                      <span className="text-emerald-400 font-black">R$ {simTotal.toFixed(2)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-mono italic">
                                      Nível desativado pela profundidade
                                    </span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-4 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    isActive
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-white/5 text-slate-500 border border-white/5'
                                  }`}>
                                    <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                    {isActive ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                        {/* Totals Summary Footer */}
                        <tfoot>
                          <tr className="bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-indigo-950/40 border-t-2 border-indigo-500/30 font-black">
                            <td className="py-4 px-6">
                              <div className="text-xs text-white uppercase tracking-wider">
                                TOTAL MMN ({mmnDepth} Gerações Ativas)
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Distribuição total da rede + margem retida pela empresa
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-mono text-indigo-400 text-sm">
                                {totalCashbackSemanal.toFixed(1)}%
                              </span>
                              <div className="text-[9px] font-mono text-slate-400 font-normal">
                                R$ {(48 * totalCashbackSemanal / 100).toFixed(2)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-mono text-cyan-400 text-sm">
                                {totalCashbackAnual.toFixed(1)}%
                              </span>
                              <div className="text-[9px] font-mono text-slate-400 font-normal">
                                R$ {(48 * totalCashbackAnual / 100).toFixed(2)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 font-mono text-emerald-400 text-sm">
                                {totalDistribuicaoMMN.toFixed(1)}%
                              </span>
                              <div className="text-[9px] font-mono text-emerald-400/80 font-normal mt-0.5">
                                R$ {(48 * totalDistribuicaoMMN / 100).toFixed(2)}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-mono">
                                <span>Margem Empresa:</span>
                                <strong className="text-white text-xs">{margemEmpresa.toFixed(1)}% (R$ {(48 * margemEmpresa / 100).toFixed(2)})</strong>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-[9px] uppercase tracking-wider">
                                Ativo
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxa de Cashback das Filiais</label>
                        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                          <input 
                            type="range" 
                            min="1" 
                            max="100" 
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

              {activeTab === 'whatsapp' && (
                <motion.div 
                  key="whatsapp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Configuração Z-API</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Integração para envio de mensagens via WhatsApp</p>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                          <div>
                            <p className="text-xs font-black text-white">Status das Notificações</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ativar ou desativar envios globais</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                            className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${
                              whatsappEnabled ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                            }`}
                          >
                            <motion.div layout className="size-6 bg-white rounded-full shadow-md" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instance ID</label>
                          <input 
                            type="text" 
                            value={zapiInstanceId}
                            onChange={e => setZapiInstanceId(e.target.value)}
                            placeholder="Ex: 3C5E9B44F..."
                            className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instance Token</label>
                          <input 
                            type="text" 
                            value={zapiToken}
                            onChange={e => setZapiToken(e.target.value)}
                            placeholder="Ex: T8A3F2..."
                            className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Token (Security API Key)</label>
                          <input 
                            type="password" 
                            value={zapiClientToken}
                            onChange={e => setZapiClientToken(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Conexão do Sistema (Supabase)</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configurações para chamadas das Edge Functions</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase API URL</label>
                          <input 
                            type="text" 
                            value={whatsappSupabaseUrl}
                            onChange={e => setWhatsappSupabaseUrl(e.target.value)}
                            placeholder="https://xxx.supabase.co"
                            className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
                          <input 
                            type="password" 
                            value={whatsappSupabaseAnonKey}
                            onChange={e => setWhatsappSupabaseAnonKey(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                          />
                        </div>

                        {/* Test Message Box */}
                        <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6">
                          <div>
                            <p className="text-xs font-black text-white">Enviar Mensagem de Teste</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Valide as credenciais enviando uma mensagem manual</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone (DDI + DDD + Num)</label>
                              <input 
                                type="text"
                                placeholder="5511999999999"
                                value={testPhone}
                                onChange={e => setTestPhone(e.target.value)}
                                className="w-full bg-[#05070a] border border-white/5 px-4 py-3 rounded-xl focus:outline-none text-white text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1 flex items-end">
                              <button 
                                type="button"
                                onClick={async () => {
                                  if (!testPhone) {
                                    toast.error("Insira um número de telefone.");
                                    return;
                                  }
                                  setSendingTest(true);
                                  try {
                                    await businessRules.sendTestWhatsAppMessage(testPhone, testMessage);
                                    toast.success("Mensagem de teste enfileirada!");
                                    setTimeout(loadWhatsAppLogs, 1000);
                                  } catch (e: any) {
                                    toast.error(e.message || "Erro ao enfileirar.");
                                  } finally {
                                    setSendingTest(false);
                                  }
                                }}
                                disabled={sendingTest}
                                className="w-full bg-indigo-600 hover:bg-indigo-50 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                {sendingTest ? "Enviando..." : "Enviar Teste"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Régua de Disparos Automáticos de Renovação */}
                  <div className="bg-gradient-to-br from-indigo-950/40 via-[#0a0f1d] to-[#05070a] border border-indigo-500/20 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                            <Bell size={20} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">
                              Régua de Comunicação de Renovações (Z-API)
                            </h3>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">
                              Automação de alertas preventivos e recuperação de afiliados
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                          <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Régua Ativa
                        </span>

                        <button 
                          type="button"
                          onClick={handleProcessRenewalCadence}
                          disabled={runningRenewalCadence}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {runningRenewalCadence ? (
                            <>
                              <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Processando...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={14} />
                              <span>Disparar Verificação Agora</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Cards dos 3 Marcos da Régua */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Marco 1: 30 Dias */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 relative hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            Etapa 1 • 30 Dias Antes
                          </span>
                          <span className="text-lg">🚀</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">Abertura de Renovação</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                            Notifica o afiliado de que a renovação antecipada está aberta no painel, garantindo que ele não perca os dias restantes e continue ativo com Telemedicina.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                          <span>Gatilho</span>
                          <span className="text-indigo-300 font-mono">25 a 30 dias</span>
                        </div>
                      </div>

                      {/* Marco 2: 5 Dias */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 relative hover:border-amber-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            Etapa 2 • 5 Dias Antes
                          </span>
                          <span className="text-lg">⚠️</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">Alerta Crítico Preventivo</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                            Alerta urgente informando que a não renovação nos próximos 5 dias causará a retenção do saque de comissões do dia 10 e a suspensão da Telemedicina.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                          <span>Gatilho</span>
                          <span className="text-amber-300 font-mono">1 a 5 dias</span>
                        </div>
                      </div>

                      {/* Marco 3: Vencido */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 relative hover:border-rose-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            Etapa 3 • Vencido / Inadimplente
                          </span>
                          <span className="text-lg">🔒</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">Aviso de Bloqueio & Resgate</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                            Dispara imediatamente após o término do plano, informando que os saques foram retidos e a telemedicina pausada, fornecendo link para regularização rápida.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                          <span>Gatilho</span>
                          <span className="text-rose-300 font-mono">0 a 15 dias pós-venc.</span>
                        </div>
                      </div>

                    </div>

                    {/* Resultado da Última Execução */}
                    {cadenceResult && (
                      <div className="bg-[#05070a] border border-white/10 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="text-indigo-400 uppercase text-[10px] tracking-widest">Resultado da Execução:</span>
                          <span>Total Enfileirado: <strong className="text-white font-mono">{cadenceResult.totalQueued}</strong></span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-white/5">
                          <div className="bg-white/5 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">30 Dias</span>
                            <span className="text-indigo-400 font-black">{cadenceResult.alerts30d}</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">5 Dias</span>
                            <span className="text-amber-400 font-black">{cadenceResult.alerts5d}</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">Vencidos</span>
                            <span className="text-rose-400 font-black">{cadenceResult.alertsExpired}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logs Queue Log Table */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Fila de Transmissão</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logs de envio recentes via Z-API</p>
                      </div>
                      <button 
                        type="button"
                        onClick={loadWhatsAppLogs}
                        disabled={logsLoading}
                        className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2"
                      >
                        {logsLoading ? "Atualizando..." : "Atualizar Fila"}
                      </button>
                    </div>

                    <div className="bg-[#05070a]/50 rounded-[2rem] border border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                              <th className="px-6 py-4">Criado em</th>
                              <th className="px-6 py-4">Destinatário</th>
                              <th className="px-6 py-4">Mensagem</th>
                              <th className="px-6 py-4 text-center">Tentativas</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4">Erro / Info</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {whatsappLogs.length > 0 ? (
                              whatsappLogs.map(log => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors text-xs">
                                  <td className="px-6 py-4 font-bold text-slate-500">{log.createdAt}</td>
                                  <td className="px-6 py-4 font-black">{log.phone}</td>
                                  <td className="px-6 py-4 max-w-xs truncate" title={log.message}>{log.message}</td>
                                  <td className="px-6 py-4 text-center font-bold">{log.attempts}</td>
                                  <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                      log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      log.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Falhou' : 'Pendente'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-red-400/80 max-w-sm truncate" title={log.errorMessage}>
                                    {log.errorMessage || '-'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                                  Nenhuma mensagem enfileirada nas últimas horas.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'seguranca' && (
                <motion.div 
                  key="seguranca"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12 w-full"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Super Admin Access Control */}
                    <div className="space-y-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Segurança do Painel</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestão de acesso super admin</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
                          <div className="relative group">
                            <input 
                              type={showCurrentPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              autoComplete="new-password"
                              className="w-full bg-white/5 border border-white/5 pl-6 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                          <div className="relative group">
                            <input 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              autoComplete="new-password"
                              className="w-full bg-white/5 border border-white/5 pl-6 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center gap-6">
                          <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Lock size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-white">Autenticação em Dois Fatores (2FA)</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recomendado para Super Admin</p>
                          </div>
                          <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center px-1 opacity-50 cursor-not-allowed">
                            <div className="size-4 bg-white rounded-full translate-x-6" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Logs */}
                    <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 flex flex-col justify-between min-h-[400px]">
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none mb-1">Log do Sistema</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Auditoria de operações recentes</p>
                          </div>
                          <ShieldCheck className="text-indigo-500" size={24} />
                        </div>

                        <div className="space-y-6">
                          {systemLogs.length > 0 ? (
                            systemLogs.slice(0, 5).map((log, i) => (
                              <div key={i} className="flex gap-4">
                                <div className={`size-2 mt-1.5 rounded-full shrink-0 ${log.type === 'Success' ? 'bg-emerald-500' : log.type === 'Warning' ? 'bg-amber-500' : log.type === 'Error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                <div>
                                  <p className="text-xs text-white/80 font-medium leading-relaxed">{log.text}</p>
                                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{log.time} • Local Server</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-20">
                              <Activity size={32} className="text-slate-500 mb-2" />
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nenhuma atividade recente</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={openLogsModal}
                        className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                      >
                        Ver Logs Completos
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Action */}
          <div className="p-8 lg:p-12 border-t border-white/5 flex items-center justify-between gap-6">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] hidden md:block italic">
              Atenção: Alterações nas configurações MMN afetam cálculos de cashbacks futuros.
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
          {/* Logs Modal */}
          <AnimatePresence>
            {isLogsModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLogsModalOpen(false)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-4xl bg-[#0a0e17] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                  <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Logs do Sistema</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Histórico completo de atividades</p>
                    </div>
                    <button 
                      onClick={() => setIsLogsModalOpen(false)}
                      className="size-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all"
                    >
                      <ShieldCheck size={24} />
                    </button>
                  </div>

                  <div className="p-4 lg:p-6 border-b border-white/5 bg-white/5 flex flex-wrap gap-2">
                    {[
                      { label: 'Todos', value: 'all' },
                      { label: 'Sucesso', value: 'Success' },
                      { label: 'Alertas', value: 'Warning' },
                      { label: 'Erros', value: 'Error' },
                      { label: 'Info', value: 'Info' }
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setLogFilter(f.value as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          logFilter === f.value 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white/5 text-slate-500 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10 space-y-6">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-start gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                        >
                          <div className={`mt-2 size-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                            log.type === 'Success' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                            log.type === 'Warning' ? 'bg-amber-500 shadow-amber-500/20' : 
                            log.type === 'Error' ? 'bg-red-500 shadow-red-500/20' : 
                            'bg-indigo-500 shadow-indigo-500/20'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm lg:text-base text-white/90 font-bold leading-relaxed">{log.text}</p>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                #{i + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('pt-BR')} • {log.time}</p>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full">
                                <Activity size={10} className="text-indigo-400" />
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">Local Server</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Activity size={48} className="text-slate-500 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Nenhum log encontrado para este filtro</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 border-t border-white/5 bg-white/5 flex flex-col items-center gap-1">
                    <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-[0.2em]">Serviços Urbanos • Auditoria em Tempo Real</p>
                    <p className="text-[8px] text-slate-700 lowercase font-medium tracking-normal opacity-30">
                      Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors underline decoration-indigo-400/20 font-bold">P4D Mídia</a>
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
