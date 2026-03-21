import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  DollarSign, 
  Percent, 
  Save, 
  Plus, 
  Trash2, 
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

interface MMNLevel {
  level: number;
  value: number;
}

export default function AdminMMN() {
  const [depth, setDepth] = useState(4);
  const [paymentType, setPaymentType] = useState<'percent' | 'fixed'>('percent');
  const [levels, setLevels] = useState<MMNLevel[]>([
    { level: 1, value: 1.5 },
    { level: 2, value: 1.5 },
    { level: 3, value: 1.5 },
    { level: 4, value: 1.5 },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDepthChange = (newDepth: number) => {
    const d = Math.max(1, Math.min(10, newDepth));
    setDepth(d);
    
    if (d > levels.length) {
      const newLevels = [...levels];
      for (let i = levels.length + 1; i <= d; i++) {
        newLevels.push({ level: i, value: 0 });
      }
      setLevels(newLevels);
    } else {
      setLevels(levels.slice(0, d));
    }
  };

  const updateLevelValue = (level: number, value: string) => {
    const val = parseFloat(value) || 0;
    setLevels(levels.map(l => l.level === level ? { ...l, value: val } : l));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const totalDistributed = levels.reduce((acc, l) => acc + l.value, 0);

  return (
    <AdminLayout title="Configuração MMN" subtitle="Gestão de niveis e comissões da rede">
      <div className="p-8 lg:p-12 space-y-12 max-w-5xl">
        
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0a0e17] p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Profundidade</p>
              <h4 className="text-xl font-black text-white">{depth} Níveis</h4>
            </div>
          </div>
          <div className="bg-[#0a0e17] p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="size-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
              {paymentType === 'percent' ? <Percent size={24} /> : <DollarSign size={24} />}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tipo de Pagamento</p>
              <h4 className="text-xl font-black text-white">{paymentType === 'percent' ? 'Percentual' : 'Valor Fixo'}</h4>
            </div>
          </div>
          <div className="bg-[#0a0e17] p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Distribuição Total</p>
              <h4 className="text-xl font-black text-white">{paymentType === 'percent' ? `${totalDistributed}%` : `R$ ${totalDistributed.toFixed(2)}`}</h4>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full bg-emerald-500 text-midnight p-4 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest z-50"
            >
              <CheckCircle size={16} /> Configurações salvas e replicadas com sucesso!
            </motion.div>
          )}

          <div className="p-8 lg:p-12 space-y-12">
            
            {/* General Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tighter uppercase italic mb-1">Regras Gerais</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Defina o escopo da rede</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Profundidade da Rede (Máx 10)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={depth}
                        onChange={(e) => handleDepthChange(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-xl font-black text-white w-8">{depth}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modo de Cálculo</label>
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => setPaymentType('percent')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentType === 'percent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                      >
                        Percentual (%)
                      </button>
                      <button 
                        onClick={() => setPaymentType('fixed')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentType === 'fixed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                      >
                        Valor Fixo (R$)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/5 rounded-3xl p-8 border border-indigo-500/10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4 text-indigo-400">
                  <Info size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Como funciona?</h4>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  As configurações acima definem quanto do valor de cada venda será distribuído para a rede de afiliados. 
                  Ao usar <strong>Percentual</strong>, o sistema calcula sobre o valor total da venda. Com <strong>Valor Fixo</strong>, o montante é debitado integralmente por transação.
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-white/5 w-full" />

            {/* Levels Grid */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-black text-white tracking-tighter uppercase italic mb-1">Distribuição por Nível</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ajuste os ganhos para cada geração</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <AnimatePresence mode='popLayout'>
                  {levels.map((level, i) => (
                    <motion.div 
                      key={level.level}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{level.level}º Nível</span>
                        <div className={`p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={level.value}
                          onChange={(e) => updateLevelValue(level.level, e.target.value)}
                          className="w-full bg-[#0a0e17] border border-white/5 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-black text-lg"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">
                          {paymentType === 'percent' ? '%' : 'R$'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <AlertCircle size={18} className="text-amber-500" />
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-tight">Atenção: Alterações entram em vigor imediatamente para novas vendas.</p>
              </div>

              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 group"
              >
                {loading ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Save size={18} />
                  </motion.div>
                ) : (
                  <Save size={18} className="group-hover:scale-110 transition-transform" />
                )}
                {loading ? 'Processando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
