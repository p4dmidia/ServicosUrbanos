import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  UserCheck,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import MMNTree from '../components/MMNTree';

export default function AffiliateNetwork() {
  const [viewType, setViewType] = React.useState<'list' | 'tree'>('list');
  const network = businessRules.getAffiliateNetwork('user123');
  const treeData = businessRules.getAffiliateTree('user123');

  return (
    <AffiliateLayout title="Minha Rede MMN">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="size-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100/50 shrink-0">
                <Users size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-midnight tracking-tighter italic uppercase">Gerenciamento de Rede</h2>
                <p className="text-slate-500 font-medium">Acompanhe seus parceiros e o crescimento da sua estrutura.</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <UserPlus size={18} className="text-primary-blue" />
                 <span className="text-sm font-black text-midnight">Novas Indicações: <span className="text-primary-blue">+15/mês</span></span>
              </div>
              <button className="bg-primary-blue text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary-blue/20 hover:scale-105 transition-all">
                Convidar Parceiro
              </button>
           </div>
        </div>

        {/* Network Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'G1 (Titular)', count: 1, limit: 1, bonus: '1.5%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'G2 (Limite 10)', count: 10, limit: 10, bonus: '1.5%', color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'G3 (Limite 100)', count: 85, limit: 100, bonus: '1.5%', color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'G4 (Limite 1000)', count: 432, limit: 1000, bonus: '1.5%', color: 'text-slate-400', bg: 'bg-slate-50' },
          ].map((level, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${level.bg.replace('bg-', 'bg-')}`}></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{level.label}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-3xl font-black text-midnight tracking-tighter">{level.count}</h3>
                <span className="text-xs text-slate-300 font-bold">/ {level.limit}</span>
              </div>
              <div className="flex flex-col gap-2">
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-md w-fit ${level.bg} ${level.color}`}>BÔNUS CAM: {level.bonus}</span>
                 {level.count >= level.limit && (
                   <span className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                     <AlertCircle size={12} />
                     Derramamento Bloqueado
                   </span>
                 )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 mt-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                   type="text" 
                   placeholder="Buscar parceiro por nome ou ID..."
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all text-sm font-bold placeholder:text-slate-400"
                  />
              </div>
              <div className="flex gap-4">
                 <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-100">
                    <button 
                      onClick={() => setViewType('list')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        viewType === 'list' ? 'bg-white text-midnight shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Lista
                    </button>
                    <button 
                      onClick={() => setViewType('tree')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        viewType === 'tree' ? 'bg-white text-midnight shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Árvore
                    </button>
                 </div>
                 <button className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:text-midnight transition-colors uppercase tracking-widest">
                    <Filter size={16} />
                    Filtrar Nível
                 </button>
              </div>
           </div>


           {viewType === 'list' ? (
             <>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Parceiro</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Adesão</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganhos Gerados</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {network.map((item, i) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                        >
                          <td className="py-6 pl-4">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                 {item.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-midnight text-sm tracking-tight">{item.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">ID: {item.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              item.level === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              Nível {item.level}
                            </span>
                          </td>
                          <td className="py-6 text-sm font-bold text-slate-500">
                            <div className="flex flex-col">
                              <span>{item.joinedDate}</span>
                              {item.spillover && (
                                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Derramamento</span>
                              )}
                            </div>
                          </td>
                          <td className="py-6 font-black text-midnight text-sm">R$ {item.earnings.toFixed(2)}</td>
                          <td className="py-6">
                            <div className="flex items-center gap-2 text-xs font-bold">
                               <div className={`size-2 rounded-full ${item.status === 'Ativo' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`}></div>
                               <span className={item.status === 'Ativo' ? 'text-emerald-600' : 'text-slate-400'}>{item.status}</span>
                            </div>
                          </td>
                          <td className="py-6 text-right pr-4">
                            <button className="p-2 text-slate-400 hover:text-midnight transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                 </table>
               </div>

               <div className="mt-12 flex justify-center">
                  <button className="px-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-white hover:text-primary-blue hover:border-primary-blue transition-all uppercase tracking-widest">
                    Carregar Mais Parceiros
                  </button>
               </div>
             </>
           ) : (
             <MMNTree treeData={treeData} />
           )}
        </div>
      </div>
    </AffiliateLayout>
  );
}
