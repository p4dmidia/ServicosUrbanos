import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  X,
  UserCheck
} from 'lucide-react';

interface TreeNodeProps {
  member: any;
  isLast?: boolean;
}

const TreeNode = ({ member }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const hasChildren = member.children && member.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Content */}
      <div className="relative z-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`
            relative cursor-pointer flex flex-col items-center p-6 rounded-full border-2 transition-all aspect-square min-w-[160px] justify-center
            ${showDetails ? 'border-primary-blue bg-primary-blue text-white shadow-2xl shadow-primary-blue/30' : 'bg-white border-slate-100 shadow-sm'}
          `}
          onClick={() => setShowDetails(true)}
        >
          <div className={`size-16 rounded-full flex items-center justify-center mb-3 ${showDetails ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
            <User size={32} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${showDetails ? 'text-white/70' : 'text-slate-400'}`}>
            Cód: {member.referralCode || member.id.substring(0, 6)}
          </span>
          <span className="text-xs font-black italic uppercase tracking-tighter truncate w-24 text-center">
            {member.name}
          </span>
          
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`absolute -bottom-3 left-1/2 -translate-x-1/2 size-8 rounded-full border shadow-lg flex items-center justify-center transition-all ${
                isExpanded ? 'bg-white border-slate-100 text-slate-400' : 'bg-primary-blue border-primary-blue text-white'
              }`}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </motion.div>
      </div>

      {/* Children Container */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="flex gap-8 pt-12 relative overflow-visible"
          >
            {/* Horizontal Connection Line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-slate-200" />
            
            {member.children.map((child: any, idx: number) => (
              <div key={child.id} className="relative pt-8">
                 {/* Vertical Vertical Connector */}
                 <div className="absolute top-[-33px] left-1/2 -translate-x-1/2 w-px h-[32px] bg-slate-200" />
                 <TreeNode member={child} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Details Modal (Integrated for simplicity) */}
      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-midnight/80 backdrop-blur-md">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative overflow-hidden"
             >
                <button 
                  onClick={() => setShowDetails(false)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-midnight hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>

                <div className="space-y-8">
                   <div className="text-center space-y-4">
                      <div className="size-24 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-100/50">
                         <User size={48} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-midnight tracking-tighter italic uppercase">{member.name}</h3>
                        <p className="text-xs font-black text-primary-blue uppercase tracking-widest">Nível {member.level} na Rede</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ganhos Gerados</p>
                         <p className="text-xl font-black text-midnight tracking-tighter">R$ {(member.earnings || member.totalEarnings || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Indicados</p>
                         <p className="text-xl font-black text-midnight tracking-tighter">{member.children?.length || 0}</p>
                      </div>
                   </div>

                   <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                      <div className="size-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
                         <UserCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status de Atividade</p>
                        <p className="text-sm font-bold text-emerald-700">Consumidor Ativo</p>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => {
                          if (member.whatsapp) {
                            window.open(`https://wa.me/55${member.whatsapp.replace(/\D/g, '')}`, '_blank');
                          }
                        }}
                        className="flex-1 bg-midnight text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-midnight/20 transition-all flex items-center justify-center gap-2"
                      >
                        Enviar Mensagem
                      </button>
                      <button className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
                        Ver Histórico
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MMNTree({ treeData }: { treeData: any }) {
  if (!treeData) return null;

  return (
    <div className="w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 overflow-x-auto min-h-[600px] flex justify-center py-20">
      <div className="h-fit">
        <TreeNode member={treeData} />
      </div>
    </div>
  );
}
