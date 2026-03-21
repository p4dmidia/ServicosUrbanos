import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';

export default function AffiliateDashboard() {
  const stats = businessRules.getAffiliateStats('user123');
  const links = businessRules.getAffiliateLinks('user123');
  const activity = businessRules.getEcosystemActivity('user123');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado!');
  };

  return (
    <AffiliateLayout title="Escritório Virtual">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <TrendingUp size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                CAM Mensal
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acúmulo 0.75% / Nível</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              R$ {stats.monthlyBonus.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                Anual Fidelidade
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acúmulo 0.5% / Nível</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              R$ {stats.annualBonus.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <Wallet size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                Carteira Digital
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acúmulo 0.25% / Nível</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              R$ {stats.walletBonus.toFixed(2)}
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white p-6 rounded-3xl border-2 transition-all shadow-sm ${stats.isEligible ? 'border-emerald-500 bg-emerald-50/10' : 'border-amber-200 bg-amber-50/10'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stats.isEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Target size={22} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase ${stats.isEligible ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                {stats.isEligible ? 'Elegível' : 'Pendente'}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Meta: 4 Consumos Mensais</p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              {stats.consumptionCount} / 4 <span className="text-sm font-medium text-slate-400">serviços</span>
            </h3>
          </motion.div>
        </div>

        {stats.maintenanceFee > 0 && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
            <Clock size={16} className="text-slate-400" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Taxa de manutenção e licenciamento (10%): - R$ {stats.maintenanceFee.toFixed(2)} já descontados do total acumulado.
            </p>
          </div>
        )}

        {/* Action & Links Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Referral Links Card */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
               <Target size={240} className="text-midnight" />
            </div>

            <div className="relative z-10 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-midnight tracking-tight mb-2 italic uppercase">Indique e Ganhe</h2>
                <p className="text-slate-500 font-medium">Compartilhe seu link exclusivo e receba comissões imediatas por cada novo usuário ou parceiro.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {links.map((link) => (
                  <div key={link.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group/link hover:bg-white hover:border-primary-blue hover:shadow-xl hover:shadow-primary-blue/10 transition-all">
                    <p className="text-[10px] font-black text-primary-blue uppercase tracking-widest mb-2">{link.name}</p>
                    <p className="text-xs text-slate-600 font-bold mb-4">{link.description}</p>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl font-mono text-[10px] text-slate-500 overflow-hidden truncate">
                          {link.url}
                       </div>
                       <button 
                         onClick={() => copyToClipboard(link.url)}
                         className="p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-blue hover:text-primary-blue transition-all"
                        >
                         <Copy size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="flex items-center gap-3 text-sm font-black text-primary-blue bg-primary-blue/5 px-8 py-4 rounded-2xl hover:bg-primary-blue hover:text-white transition-all">
                Ver Todos os Link de Indicação
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Quick Stats/Summary */}
          <div className="bg-midnight rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-primary-blue/20 rounded-full blur-[80px]"></div>
             
             <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desempenho da Rede</p>
               <h3 className="text-3xl font-black tracking-tighter mb-8 italic uppercase">Status Diamante</h3>
               
               <div className="space-y-6">
                 {[
                   { label: 'Conversão', value: '18%', color: 'bg-emerald-500' },
                   { label: 'Retenção', value: '92%', color: 'bg-primary-blue' },
                   { label: 'Crescimento', value: '+45%', color: 'bg-purple-500' },
                 ].map((bar, i) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                       <span className="text-slate-400">{bar.label}</span>
                       <span>{bar.value}</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: bar.value }}
                         transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                         className={`h-full ${bar.color}`}
                        />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-primary-blue flex items-center justify-center text-white">
                     <Users size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400">Total na Rede</p>
                     <p className="text-xl font-black">1.240 <span className="text-[10px] text-emerald-500">+12 hoje</span></p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Activity Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-black text-midnight tracking-tight italic uppercase">Atividade no Ecossistema</h2>
              <p className="text-slate-500 font-medium">Histórico de consumos, corridas e compras realizadas dentro da rede Urba.</p>
            </div>
            <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-midnight transition-colors tracking-widest uppercase">
              Ver Histórico Completo
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Tipo/Serviço</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Pontos/Bônus</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item, i) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                  >
                    <td className="py-6 pl-4">
                       <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${
                            item.type === 'Urba Moby' ? 'bg-emerald-50 text-emerald-600' :
                            item.type === 'Marketplace' ? 'bg-primary-blue/10 text-primary-blue' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {item.type === 'Urba Moby' ? <ArrowUpRight size={18} /> : <ExternalLink size={18} />}
                          </div>
                          <span className="font-bold text-sm">{item.type}</span>
                       </div>
                    </td>
                    <td className="py-6">
                      <p className="font-bold text-midnight text-sm">{item.description}</p>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{item.date}</span>
                      </div>
                    </td>
                    <td className="py-6 text-right font-black text-midnight text-sm">
                      R$ {item.amount.toFixed(2)}
                    </td>
                    <td className="py-6 text-right pr-4">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black">
                         +{item.points} pts
                         <CheckCircle2 size={12} />
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
