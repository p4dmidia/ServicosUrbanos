import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Smartphone, 
  ShieldCheck, 
  LayoutGrid, 
  Wallet,
  CreditCard,
  QrCode,
  DollarSign,
  Loader2,
  Package,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Clock,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AffiliateWallet() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'cd' | 'mensal' | 'anual'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesFilter = 
        activeFilter === 'all' || 
        (activeFilter === 'cd' && t.cashbackType === 'Digital') ||
        (activeFilter === 'mensal' && t.cashbackType === 'Mensal') ||
        (activeFilter === 'anual' && t.cashbackType === 'Anual');
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        t.orderId?.toLowerCase().includes(searchLower) ||
        t.affiliateName?.toLowerCase().includes(searchLower) ||
        t.cashbackType?.toLowerCase().includes(searchLower) ||
        t.date?.toLowerCase().includes(searchLower) ||
        t.status?.toLowerCase().includes(searchLower) ||
        String(t.amount).includes(searchQuery);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, activeFilter, searchQuery]);

  const totalPending = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
  }, [filteredTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString('pt-BR');

    // Estilo Profissional
    doc.setFillColor(15, 23, 42); // Midnight
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO FINANCEIRO', 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`Afiliado: ${profile?.full_name || '---'}`, 14, 33);
    doc.text(`Emissão: ${now}`, 150, 33);

    // Resumo
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Filtro', 14, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filtro Ativo: ${activeFilter === 'all' ? 'Todos' : activeFilter === 'cd' ? 'Carteira Digital' : activeFilter === 'mensal' ? 'Mensal' : 'Anual'}`, 14, 62);
    doc.text(`Registros: ${filteredTransactions.length}`, 14, 67);
    doc.text(`Total Acumulado: ${totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 72);

    // Tabela
    const tableData = filteredTransactions.map(t => [
      t.orderId,
      t.affiliateName,
      t.level,
      t.cashbackType,
      t.date,
      Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      t.status
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['ID DO PEDIDO', 'AFILIADO', 'NÍVEL', 'CASHBACK', 'PERÍODO', 'VALOR', 'STATUS']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255], 
        fontSize: 8, 
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' }
      },
      styles: {
        lineColor: [241, 245, 249],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
      doc.text('Plataforma Urbamoby - Relatório Financeiro Oficial', 14, 285);
    }

    doc.save(`extrato-${profile?.full_name?.split(' ')[0].toLowerCase() || 'afiliado'}-${new Date().getTime()}.pdf`);
  };

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        businessRules.getAffiliateStats(user.id),
        businessRules.getEcosystemActivity(user.id)
      ]);
      
      setStats(statsData);
      setTransactions(activityData);
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user]);


  if (loading || !stats) {
    return (
      <AffiliateLayout title="Minha Carteira">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-12 text-primary-blue animate-spin" />
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Minha Carteira">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Header with Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h2 className="text-3xl font-black text-midnight tracking-tighter uppercase italic">Minha <span className="text-primary-blue">Carteira</span></h2>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de ganhos e cashback</p>
          </div>
          
          {/* Consumos Badge in the Corner */}
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
             <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Package size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Consumos</p>
                <p className="text-lg font-black text-midnight tracking-tighter">{stats.consumptionCount} <span className="text-[10px] text-slate-400">Serviços</span></p>
             </div>
          </div>
        </div>

        {/* Balance Cards Grid - Credit Card Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           
           {/* Card 1: Saldo Disponível */}
           <motion.div 
             whileHover={{ y: -5 }}
             onClick={() => {
               setActiveFilter(activeFilter === 'cd' ? 'all' : 'cd');
               setCurrentPage(1);
             }}
             className={`aspect-[1.6/1] bg-slate-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all cursor-pointer group ${
               activeFilter === 'cd' ? 'ring-4 ring-emerald-500 shadow-emerald-500/20' : 'shadow-slate-900/20'
             }`}
           >
              {/* Design Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-blue/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Disponível</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Carteira CD</p>
                 </div>
                 <div className={`size-10 rounded-xl flex items-center justify-center border transition-colors ${
                   activeFilter === 'cd' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-emerald-500 border-white/5'
                 }`}>
                    <Wallet size={20} />
                 </div>
              </div>

              <div className="relative z-10">
                 <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-2">R$ {Number(stats.availableBalance).toFixed(2)}</h2>
                 <div className="flex items-center gap-2">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagamentos Dia 10</p>
                 </div>
              </div>

              {/* Card Footer Decoration */}
              <div className="relative z-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                 <div className="flex -space-x-2">
                    <div className="size-6 rounded-full border border-white/20 bg-white/5"></div>
                    <div className="size-6 rounded-full border border-white/20 bg-white/5"></div>
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest">**** 4829</span>
              </div>
           </motion.div>

           {/* Card 2: Bônus Mensal */}
           <motion.div 
             whileHover={{ y: -5 }}
             onClick={() => {
               setActiveFilter(activeFilter === 'mensal' ? 'all' : 'mensal');
               setCurrentPage(1);
             }}
             className={`aspect-[1.6/1] bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all cursor-pointer group ${
               activeFilter === 'mensal' ? 'ring-4 ring-blue-400 shadow-blue-500/20' : 'shadow-blue-900/20'
             }`}
           >
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest mb-1">Bônus Acumulado</p>
                    <p className="text-[8px] font-bold text-blue-300/40 uppercase tracking-[0.2em]">Mensalidade</p>
                 </div>
                 <div className={`size-10 rounded-xl flex items-center justify-center border transition-colors ${
                   activeFilter === 'mensal' ? 'bg-white text-indigo-600 border-white' : 'bg-white/10 text-white border-white/10'
                 }`}>
                    <TrendingUp size={20} />
                 </div>
              </div>

              <div className="relative z-10">
                 <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-2">R$ {Number(stats.monthlyBonus).toFixed(2)}</h2>
                 <p className="text-[9px] font-black text-blue-200/60 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Proteção Ativa
                 </p>
              </div>

              <div className="relative z-10 flex justify-between items-center opacity-40">
                 <div className="flex gap-1">
                    <div className="w-6 h-1 bg-white/20 rounded-full"></div>
                    <div className="w-3 h-1 bg-white/20 rounded-full"></div>
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest">PRO PREMIUM</span>
              </div>
           </motion.div>

           {/* Card 3: Bônus Anual */}
           <motion.div 
             whileHover={{ y: -5 }}
             onClick={() => {
               setActiveFilter(activeFilter === 'anual' ? 'all' : 'anual');
               setCurrentPage(1);
             }}
             className={`aspect-[1.6/1] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all cursor-pointer group ${
               activeFilter === 'anual' ? 'ring-4 ring-emerald-400 shadow-emerald-500/20' : 'shadow-emerald-900/20'
             }`}
           >
              <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-emerald-200/60 uppercase tracking-widest mb-1">Bônus Acumulado</p>
                    <p className="text-[8px] font-bold text-emerald-300/40 uppercase tracking-[0.2em]">Anualidade</p>
                 </div>
                 <div className={`size-10 rounded-xl flex items-center justify-center border transition-colors ${
                   activeFilter === 'anual' ? 'bg-white text-emerald-600 border-white' : 'bg-white/10 text-white border-white/10'
                 }`}>
                    <Calendar size={20} />
                 </div>
              </div>

              <div className="relative z-10">
                 <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-2">R$ {Number(stats.annualBonus).toFixed(2)}</h2>
                 <p className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest">Liberação em Dezembro</p>
              </div>

              <div className="relative z-10 flex justify-between items-center opacity-40">
                 <div className="size-8 bg-white/10 rounded-full flex items-center justify-center">
                    <QrCode size={14} />
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest">URBA ANNUAL</span>
              </div>
           </motion.div>
        </div>

        {/* Bottom Section: Bank Info and Eligibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Eligibility Warning if blocked */}
           {!stats.isEligible && (
              <div className="lg:col-span-2 bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex items-center gap-6">
                 <div className="size-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-600 shrink-0">
                    <Clock size={32} />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-amber-800 uppercase tracking-tighter">Resgate Bloqueado</h4>
                    <p className="text-sm font-medium text-amber-700/80">
                       {stats.consumptionCount < 1 
                         ? 'Você precisa realizar ao menos 1 consumo mensal no ecossistema para liberar seus bônus.' 
                         : 'Seu saldo ainda não atingiu o limite mínimo para saque.'}
                    </p>
                    <Link to="/afiliado/ecossistema" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-800 mt-4 hover:underline">
                       Explorar Ecossistema <ChevronRight size={12} />
                    </Link>
                 </div>
              </div>
           )}

           {/* Real Bank Info Card */}
           <div className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between ${stats.isEligible ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
              <div className={`flex ${stats.isEligible ? 'flex-row items-center justify-between' : 'flex-col'} gap-8`}>
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                          <CreditCard size={20} />
                       </div>
                       <h3 className="text-xl font-black text-midnight italic uppercase">Dados Bancários</h3>
                    </div>
                    <div className={`grid ${stats.isEligible ? 'grid-cols-1 md:grid-cols-2 gap-12' : 'grid-cols-1 gap-6'}`}>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco / Chave PIX</p>
                          <p className="font-bold text-midnight tracking-tight italic uppercase truncate">
                            {profile?.bank_name || 'Ag. Cadastro'} 
                            <span className="block text-[10px] text-slate-400 not-italic mt-1 uppercase truncate font-medium">{profile?.pix_key || 'Chave não informada'}</span>
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agência e Conta</p>
                          <p className="font-bold text-midnight tracking-tight italic truncate">
                            {profile?.bank_branch && profile?.bank_account 
                              ? `Ag: ${profile.bank_branch} / CC: ${profile.bank_account}` 
                              : 'Dados não informados'}
                          </p>
                       </div>
                    </div>
                 </div>
                 <Link 
                   to="/afiliado/perfil"
                   className="text-sm font-black text-primary-blue hover:text-midnight transition-colors uppercase tracking-widest flex items-center gap-2 whitespace-nowrap"
                 >
                    Gerenciar Dados
                    <ChevronRight size={16} />
                 </Link>
              </div>
           </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div>
                 <h2 className="text-2xl font-black text-midnight tracking-tighter uppercase italic underline decoration-primary-blue decoration-4 underline-offset-8 mb-2">
                   Histórico {activeFilter === 'cd' ? '(Carteira CD)' : activeFilter === 'mensal' ? '(Mensal)' : activeFilter === 'anual' ? '(Anual)' : 'Financeiro'}
                 </h2>
                 <p className="text-slate-500 font-medium">
                    {activeFilter !== 'all' 
                      ? `Exibindo apenas lançamentos de ${activeFilter === 'cd' ? 'Carteira CD' : activeFilter === 'mensal' ? 'Bônus Mensal' : 'Bônus Anual'}.` 
                      : 'Veja todos os créditos e débitos realizados na sua conta.'}
                 </p>
              </div>
              <div className="flex items-center gap-4">
                 {activeFilter !== 'all' && (
                   <button 
                     onClick={() => {
                       setActiveFilter('all');
                       setCurrentPage(1);
                     }}
                     className="text-[10px] font-black text-primary-blue uppercase tracking-widest hover:underline px-4 py-2 bg-primary-blue/5 rounded-xl"
                   >
                     Limpar Filtro
                   </button>
                 )}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 hover:text-primary-blue hover:border-primary-blue transition-all uppercase tracking-widest shrink-0 shadow-sm hover:shadow-md"
                    >
                      <FileText size={16} />
                      PDF
                    </button>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Filtrar histórico..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary-blue text-xs font-bold"
                     />
                    </div>
                  </div>
              </div>
           </div>

           <div className="space-y-4">
              {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
                const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

                if (filteredTransactions.length === 0) {
                  return (
                    <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                       Nenhuma transação encontrada para este filtro.
                    </div>
                  );
                }

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-2">ID DO PEDIDO</th>
                            <th className="px-6 py-2">AFILIADO</th>
                            <th className="px-6 py-2 text-center">NÍVEL</th>
                            <th className="px-6 py-2">CASHBACK</th>
                            <th className="px-6 py-2">PERIODO</th>
                            <th className="px-6 py-2 text-right">VALOR A RECEBER</th>
                            <th className="px-6 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.map((t, i) => (
                            <motion.tr
                              key={t.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all cursor-pointer group"
                            >
                              <td className="px-6 py-5 rounded-l-3xl font-black text-midnight text-xs border-y border-transparent group-hover:border-slate-100">
                                {t.orderId}
                              </td>
                              <td className="px-6 py-5 font-bold text-slate-600 text-xs border-y border-transparent group-hover:border-slate-100">
                                {t.affiliateName}
                              </td>
                              <td className="px-6 py-5 text-center border-y border-transparent group-hover:border-slate-100">
                                <span className={`inline-flex items-center justify-center size-6 rounded-full text-[10px] font-black ${
                                  t.level === '0' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {t.level}
                                </span>
                              </td>
                              <td className="px-6 py-5 border-y border-transparent group-hover:border-slate-100">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                                  t.cashbackType === 'Mensal' ? 'bg-red-50 text-red-600' : 
                                  t.cashbackType === 'Digital' ? 'bg-emerald-50 text-emerald-600' : 
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {t.cashbackType}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase border-y border-transparent group-hover:border-slate-100">
                                {t.date}
                              </td>
                              <td className="px-6 py-5 text-right border-y border-transparent group-hover:border-slate-100">
                                <p className={`text-sm font-black tracking-tighter ${
                                   t.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                   {t.amount > 0 ? '+' : ''}{Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                              </td>
                              <td className="px-6 py-5 rounded-r-3xl text-center border-y border-transparent group-hover:border-slate-100">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase whitespace-nowrap ${
                                  t.status === 'Cancelado' ? 'bg-red-50 text-red-600' : 
                                  (t.status === 'Concluído' || t.status === 'Pago' || t.status === 'Pago, Aguardando Retirada') ? 'bg-emerald-50 text-emerald-600' : 
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]">
                            <td colSpan={5} className="px-6 py-4 rounded-l-2xl">A RECEBER</td>
                            <td className="px-6 py-4 text-right">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 rounded-r-2xl"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-12 flex items-center justify-between border-t border-slate-50 pt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            <ArrowDownLeft className="rotate-45" size={18} />
                          </button>
                          <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`size-8 rounded-lg text-xs font-black transition-all ${
                                  currentPage === i + 1 
                                    ? 'bg-primary-blue text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                {i + 1}
                              </button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                          </div>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            <ArrowUpRight className="-rotate-45" size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
           </div>
        </div>
      </div>

    </AffiliateLayout>
  );
}
