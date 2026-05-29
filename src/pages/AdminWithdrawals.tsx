import React, { useEffect, useState, useRef } from 'react';
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
  Smartphone,
  Upload,
  FileText,
  Calendar,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [payableBalances, setPayableBalances] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const data = await businessRules.getPayableBalances();
      setPayableBalances(data);
    } catch (error) {
      console.error('Error loading balances:', error);
      toast.error('Erro ao carregar saldos para pagamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleProcessPayout = async (type: 'mensal' | 'anual' | 'digital') => {
    if (!selectedPayout || !receiptFile) {
      toast.error('Selecione o comprovante de pagamento.');
      return;
    }
    
    try {
      setUploading(true);
      setProcessingId(selectedPayout.profileId);
      
      // 1. Upload do comprovante
      const receiptUrl = await businessRules.uploadReceipt(receiptFile);
      
      // 2. Registrar o pagamento
      const amount = type === 'mensal' 
        ? selectedPayout.monthlyPending 
        : type === 'anual' 
          ? selectedPayout.annualPending 
          : selectedPayout.digitalPending;
      await businessRules.processPayout(selectedPayout.profileId, amount, type, receiptUrl);
      
      let displayType = '';
      if (type === 'mensal') displayType = 'Mensal';
      else if (type === 'anual') displayType = 'Anual';
      else displayType = 'Digital';

      toast.success(`Pagamento ${displayType} processado com sucesso!`);
      setSelectedPayout(null);
      setReceiptFile(null);
      loadBalances();
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setUploading(false);
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleExportCSV = () => {
    if (payableBalances.length === 0) {
      toast.error('Nenhum dado disponível para exportação.');
      return;
    }

    const csvContent = [];
    
    // Header
    csvContent.push(`Relatorio de Saldos de Cashback Pendentes - Gerado em ${new Date().toLocaleString('pt-BR')}`);
    csvContent.push('');
    
    // Totais Gerais
    csvContent.push('Total Geral Pendente;Pendente Mensal;Pendente Digital;Pendente Anual');
    csvContent.push([
      `R$ ${totalPending.toFixed(2).replace('.', ',')}`,
      `R$ ${totalMonthlyPending.toFixed(2).replace('.', ',')}`,
      `R$ ${totalDigitalPending.toFixed(2).replace('.', ',')}`,
      `R$ ${totalAnnualPending.toFixed(2).replace('.', ',')}`
    ].join(';'));
    csvContent.push('');
    
    // Detalhado
    csvContent.push('Nome;Email;Chave PIX;Dados Bancarios;Pendente Mensal;Pendente Digital;Pendente Anual;Pendente Total');
    
    payableBalances.forEach(w => {
      const userTotal = (w.monthlyPending || 0) + (w.digitalPending || 0) + (w.annualPending || 0);
      csvContent.push([
        w.userName,
        w.userEmail,
        `"${w.pixKey}"`,
        `"${w.bankDetails}"`,
        `R$ ${(w.monthlyPending || 0).toFixed(2).replace('.', ',')}`,
        `R$ ${(w.digitalPending || 0).toFixed(2).replace('.', ',')}`,
        `R$ ${(w.annualPending || 0).toFixed(2).replace('.', ',')}`,
        `R$ ${userTotal.toFixed(2).replace('.', ',')}`
      ].join(';'));
    });

    const csvString = csvContent.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_cashback_pendente_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV baixado com sucesso!');
  };

  const filteredBalances = payableBalances.filter(w => 
    w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.pixKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBalances = filteredBalances.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredBalances.length / itemsPerPage);

  const totalMonthlyPending = payableBalances.reduce((acc, curr) => acc + (curr.monthlyPending || 0), 0);
  const totalAnnualPending = payableBalances.reduce((acc, curr) => acc + (curr.annualPending || 0), 0);
  const totalDigitalPending = payableBalances.reduce((acc, curr) => acc + (curr.digitalPending || 0), 0);
  const totalPending = totalMonthlyPending + totalAnnualPending + totalDigitalPending;

  return (
    <AdminLayout title="Gestão de Pagamentos" subtitle="Central de pagamentos manuais de cashback">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Geral */}
          <div className="flex items-center gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="size-16 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
                <DollarSign size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Total Geral Pendente</p>
                <p className="text-3xl font-black text-white tracking-tighter italic">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          {/* Card 2: Mensal */}
          <div className="flex items-center gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="size-16 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
                <TrendingUp size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pendente Mensal</p>
                <p className="text-3xl font-black text-white tracking-tighter italic">
                  R$ {totalMonthlyPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          {/* Card 3: Digital */}
          <div className="flex items-center gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="size-16 bg-purple-500/20 text-purple-400 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/10 shrink-0">
                <Wallet size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pendente Digital</p>
                <p className="text-3xl font-black text-white tracking-tighter italic">
                  R$ {totalDigitalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          {/* Card 4: Anual */}
          <div className="flex items-center gap-6 bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="size-16 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                <Calendar size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pendente Anual</p>
                <p className="text-3xl font-black text-white tracking-tighter italic">
                  R$ {totalAnnualPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <button 
            onClick={handleExportCSV}
            className="w-full md:w-auto px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0"
          >
            <FileText size={18} className="text-slate-400" />
            Relatório CSV
          </button>
        </div>

        {/* Withdrawals List */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="bg-[#0a0e17] rounded-[2.5rem] p-32 flex flex-col items-center justify-center border border-white/5">
              <Loader2 className="size-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando saldos...</p>
            </div>
          ) : filteredBalances.length === 0 ? (
            <div className="bg-[#0a0e17] rounded-[2.5rem] p-32 flex flex-col items-center justify-center border border-white/5 text-center">
              <div className="size-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-6 font-black text-4xl italic">!</div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Nenhum pagamento pendente</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Todos os usuários estão com os pagamentos em dia.</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode='popLayout'>
                {paginatedBalances.map((w, i) => (
                <motion.div
                  key={w.profileId}
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
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><User size={12} className="text-slate-600" /> {w.userEmail}</span>
                          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-600" /> Ref: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                      <div className="flex gap-8">
                        <div className="text-center md:text-left border-r border-white/10 pr-8">
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Mensal</p>
                           <p className="text-2xl font-black text-white tracking-tighter italic">
                             R$ {w.monthlyPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                           <button 
                             onClick={() => setSelectedPayout({ ...w, currentType: 'mensal' })}
                             className="mt-2 text-[8px] font-black uppercase text-emerald-400 hover:text-white transition-colors"
                           >
                             Dar Baixa
                           </button>
                        </div>
                        <div className="text-center md:text-left border-r border-white/10 pr-8">
                           <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Digital</p>
                           <p className="text-2xl font-black text-white tracking-tighter italic">
                             R$ {(w.digitalPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                           <button 
                             onClick={() => setSelectedPayout({ ...w, currentType: 'digital' })}
                             className="mt-2 text-[8px] font-black uppercase text-purple-400 hover:text-white transition-colors"
                           >
                             Dar Baixa
                           </button>
                        </div>
                        <div className="text-center md:text-left">
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Anual</p>
                           <p className="text-2xl font-black text-white tracking-tighter italic">
                             R$ {w.annualPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                           <button 
                             onClick={() => setSelectedPayout({ ...w, currentType: 'anual' })}
                             className="mt-2 text-[8px] font-black uppercase text-blue-400 hover:text-white transition-colors"
                           >
                             Dar Baixa
                           </button>
                        </div>
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBalances.length)} de {filteredBalances.length}
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`size-10 rounded-xl text-xs font-black transition-all ${
                          currentPage === i + 1 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>

        {/* Payout Modal */}
        <AnimatePresence>
          {selectedPayout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-midnight/90 backdrop-blur-md"
                onClick={() => setSelectedPayout(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-[#0d1117] rounded-[3rem] border border-white/10 shadow-3xl p-12 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setSelectedPayout(null)} className="text-slate-500 hover:text-white transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="text-center">
                    <div className="size-20 bg-indigo-500/10 text-indigo-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <DollarSign size={40} />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Confirmar Pagamento</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
                      {selectedPayout.userName} • {selectedPayout.currentType === 'mensal' ? 'Cashback Mensal' : selectedPayout.currentType === 'anual' ? 'Cashback Anual' : 'Cashback Digital'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor a Pagar</p>
                    <p className="text-5xl font-black text-white tracking-tighter italic">
                      R$ {(
                        selectedPayout.currentType === 'mensal' 
                          ? selectedPayout.monthlyPending 
                          : selectedPayout.currentType === 'anual' 
                            ? selectedPayout.annualPending 
                            : selectedPayout.digitalPending
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anexar Comprovante (Obrigatório)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full aspect-video rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer gap-4 ${
                        receiptFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5 hover:border-indigo-500/30'
                      }`}
                    >
                      {receiptFile ? (
                        <>
                          <div className="size-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                            <FileText size={24} />
                          </div>
                          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{receiptFile.name}</p>
                        </>
                      ) : (
                        <>
                          <div className="size-12 bg-white/10 text-slate-500 rounded-2xl flex items-center justify-center">
                            <Upload size={24} />
                          </div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Clique para selecionar</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <button
                    disabled={!receiptFile || uploading}
                    onClick={() => handleProcessPayout(selectedPayout.currentType)}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Dar Baixa no Pagamento
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
