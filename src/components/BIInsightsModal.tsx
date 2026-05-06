import React from 'react';
import { 
  X, 
  Zap, 
  Clock, 
  CheckCircle2,
  DollarSign,
  Users,
  LineChart,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BIInsightsModal({ isOpen, onClose }: BIInsightsModalProps) {
  if (!isOpen) return null;

  const plannedFeatures = [
    {
      title: 'Previsão de Liquidez',
      desc: 'Algoritmos que projetam o fluxo de caixa e datas de repasse para os próximos 30 dias.',
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      title: 'Análise de Rede MMN',
      desc: 'Mapeamento profundo da viralidade e performance de cada braço da sua rede de afiliados.',
      icon: Users,
      color: 'text-indigo-500'
    },
    {
      title: 'Tendências Preditivas',
      desc: 'IA que identifica categorias em ascensão antes mesmo do pico de vendas.',
      icon: LineChart,
      color: 'text-purple-500'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-2xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl bg-[#0a0e17] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Banner */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 w-full" />
          
          <div className="p-8 lg:p-12">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-6">
                <div className="size-16 bg-white text-indigo-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-white/10">
                  <Zap size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">BI Digital <span className="text-indigo-500">Premium</span></h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                    <Clock size={12} className="text-amber-500" /> Em Desenvolvimento
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="size-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-12">
              <div className="max-w-2xl">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">O futuro da gestão inteligente</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Estamos construindo uma central de inteligência artificial exclusiva para os administradores da <strong className="text-white">Services Urbanos</strong>. 
                  Em breve, este botão dará acesso a relatórios preditivos e auditorias automáticas que transformarão seus dados em lucro.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plannedFeatures.map((feature, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all">
                    <div className={`size-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 ${feature.color}`}>
                      <feature.icon size={24} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{feature.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <CheckCircle2 className="text-indigo-500 shrink-0" size={32} />
                  <div>
                    <p className="text-white font-black uppercase italic tracking-tighter">Seja o primeiro a saber</p>
                    <p className="text-xs text-slate-400 font-medium">Você será notificado assim que a versão Alpha for liberada.</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-200 transition-all shrink-0"
                >
                  Entendido!
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#05070a] border-t border-white/5 flex items-center justify-center gap-2">
            <ShieldCheck className="text-slate-600" size={14} />
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Services Urbanos - Intelligence Division 2026</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
