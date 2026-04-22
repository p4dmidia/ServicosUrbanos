import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Loader2,
  Copy,
  User,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await businessRules.getPendingWithdrawals();
      setPendingWithdrawals(data);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error('Erro ao carregar solicitações de saque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Confirmar a aprovação deste saque? Certifique-se de que o pagamento via PIX foi realizado.')) return;
    
    try {
      setProcessingId(id);
      await businessRules.approveWithdrawal(id);
      toast.success('Saque aprovado com sucesso!');
      loadWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Erro ao aprovar saque');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Deseja realmente rejeitar este saque? O saldo retornará para o usuário.')) return;
    
    try {
      setProcessingId(id);
      await businessRules.rejectWithdrawal(id);
      toast.error('Saque rejeitado.');
      loadWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Erro ao rejeitar saque');
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const filteredWithdrawals = pendingWithdrawals.filter(w => 
    w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.pixKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Gestão de Saques" subtitle="Aprovação e processamento de resgates PIX">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Stats Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl pr-12">
             <div className="size-16 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <DollarSign size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Total Pendente para Pagamento</p>
                <p className="text-4xl font-black text-white tracking-tighter italic">
                  R$ {pendingWithdrawals.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou chave PIX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white text-sm font-bold placeholder:text-slate-600 transition-all"
            />
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="bg-[#0a0e17] rounded-[2.5rem] p-32 flex flex-col items-center justify-center border border-white/5">
              <Loader2 className="size-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando solicitações...</p>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="bg-[#0a0e17] rounded-[2.5rem] p-32 flex flex-col items-center justify-center border border-white/5 text-center">
              <div className="size-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-6 font-black text-4xl italic">!</div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Nenhum saque pendente</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Todas as solicitações foram processadas ou não há pedidos no momento.</p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {filteredWithdrawals.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-indigo-500/30 transition-all"
                >
                  <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="size-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-xl shadow-indigo-500/10">
                        {w.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{w.userName}</h3>
                          <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-widest">#{w.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><User size={12} className="text-slate-600" /> {w.userEmail}</span>
                          <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-600" /> {w.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                      <div className="text-center md:text-left">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor do Saque</p>
                         <p className="text-3xl font-black text-white tracking-tighter italic">
                           R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </p>
                      </div>

                      <div className="h-10 w-px bg-white/10 hidden md:block"></div>

                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Chave PIX</p>
                            <p className="text-xs font-black text-white truncate max-w-[150px]">{w.pixKey}</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(w.pixKey, 'PIX')}
                            className="size-8 bg-white/10 border border-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-400 transition-all active:scale-95"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <button
                           disabled={processingId === w.id}
                           onClick={() => handleReject(w.id)}
                           className="px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/5 border border-white/5 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2"
                         >
                           {processingId === w.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                           Negar
                         </button>
                         <button
                           disabled={processingId === w.id}
                           onClick={() => handleApprove(w.id)}
                           className="px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                         >
                           {processingId === w.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                           Aprovar PIX
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-6">
                     <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <Smartphone size={10} />
                        Dados Bancários: <span className="text-white ml-1">{w.bankDetails}</span>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
