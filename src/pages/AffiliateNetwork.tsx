import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import MMNTree from '../components/MMNTree';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateNetwork() {
  const { user, profile } = useAuth();
  const [viewType, setViewType] = useState<'list' | 'tree'>('list');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [network, setNetwork] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [treeData, setTreeData] = useState<any>(null);
  const [mmnConfig, setMmnConfig] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<number>(0);

  const handleInvite = () => {
    if (!user) return;
    
    const code = profile?.referral_code || user.id;
    const inviteLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link de convite copiado!', {
      style: {
        borderRadius: '16px',
        background: '#0a0e17',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      },
      iconTheme: {
        primary: '#0f49bd',
        secondary: '#fff',
      },
    });
  };

  useEffect(() => {
    async function loadNetworkData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [networkData, treeInfo, statsData, levelsConfig] = await Promise.all([
          businessRules.getAffiliateNetwork(user.id),
          businessRules.getAffiliateTree(user.id),
          businessRules.getAffiliateStats(user.id),
          businessRules.getMMNLevels()
        ]);
        
        setNetwork(networkData);
        setTreeData(treeInfo);
        setStats(statsData);
        setMmnConfig(levelsConfig);
      } catch (error) {
        console.error("Error loading network:", error);
      } finally {
        setLoading(false);
      }
    }

    loadNetworkData();
  }, [user]);

  if (loading || !stats) {
    return (
      <AffiliateLayout title="Minha Rede MMN">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-12 text-primary-blue animate-spin" />
        </div>
      </AffiliateLayout>
    );
  }

  const filteredNetwork = network.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.referralCode || item.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 0 || Number(item.level) === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const levels = mmnConfig
    .filter(level => level.level >= 1)
    .map((level, i) => {
      const gen = level.level; // G1, G2...
      const count = stats.networkSummary[`g${gen}`] || 0;
      const colors = [
        { text: 'text-emerald-500', bg: 'bg-emerald-50' },
        { text: 'text-blue-500', bg: 'bg-blue-50' },
        { text: 'text-purple-500', bg: 'bg-purple-50' },
        { text: 'text-indigo-500', bg: 'bg-indigo-50' },
        { text: 'text-amber-500', bg: 'bg-amber-50' },
        { text: 'text-rose-500', bg: 'bg-rose-50' }
      ];
      const colorSet = colors[i % colors.length];

      return {
        label: `G${gen}${gen === 1 ? ' (Diretos)' : ''}`,
        count: count,
        bonus: `${level.value.toFixed(2)}%`,
        color: colorSet.text,
        bg: colorSet.bg
      };
    });

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
                <p className="text-slate-500 font-medium">Status: <span className="text-emerald-600 font-bold uppercase">{stats.rank}</span> • {stats.networkSummary.total} usuários no total.</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <UserPlus size={18} className="text-primary-blue" />
                 <span className="text-sm font-black text-midnight uppercase tracking-tighter">Rede Direta: <span className="text-primary-blue">{stats.networkSummary.g1} parceiros</span></span>
              </div>
              <button 
                onClick={handleInvite}
                className="bg-primary-blue text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary-blue/20 hover:scale-105 transition-all uppercase tracking-widest"
              >
                Convidar Parceiro
              </button>
           </div>
        </div>

        {/* Network Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {levels.map((level, i) => (
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
                <span className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">Parceiros</span>
              </div>
              <div className="flex flex-col gap-2">
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-md w-fit ${level.bg} ${level.color}`}>BÔNUS: {level.bonus}</span>
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
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
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
                 <div className="relative">
                   <select 
                     value={levelFilter}
                     onChange={(e) => setLevelFilter(Number(e.target.value))}
                     className="appearance-none flex items-center gap-2 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:text-midnight transition-all uppercase tracking-widest cursor-pointer pr-10 focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5"
                   >
                      <option value={0}>Todos os Níveis</option>
                      {mmnConfig.filter(l => l.level >= 1).map((l) => (
                        <option key={l.level} value={l.level}>Nível G{l.level}</option>
                      ))}
                   </select>
                   <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 </div>
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
                      {filteredNetwork.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                            {searchTerm ? 'Nenhum parceiro encontrado com este filtro.' : 'Nenhum parceiro direto encontrado na sua rede.'}
                          </td>
                        </tr>
                      ) : (
                        filteredNetwork.map((item, i) => (
                          <motion.tr 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                          >
                            <td className="py-6 pl-4">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                                   {item.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-bold text-midnight text-sm tracking-tight">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">CÓD: {item.referralCode || item.id.substring(0, 6)}</p>
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
                            <td className="py-6 font-black text-midnight text-sm">R$ {Number(item.earnings).toFixed(2)}</td>
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
                        ))
                      )}
                    </tbody>
                 </table>
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
