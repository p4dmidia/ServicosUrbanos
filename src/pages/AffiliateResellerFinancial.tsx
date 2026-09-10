import React, { useState, useEffect, useMemo } from 'react';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  ArrowUpRight, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  DollarSign,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function AffiliateResellerFinancial() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [cycleFilter, setCycleFilter] = useState<'all' | 'mensal' | 'anual'>('all');
  const [viewMode, setViewMode] = useState<'itemized' | 'orders'>('itemized');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  const loadFinancialData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await businessRules.getResellerFinancialSummary(user.id, selectedYear, selectedMonth);
      setData(res);
    } catch (error) {
      console.error("Erro ao carregar financeiro do revendedor:", error);
      toast.error("Erro ao carregar dados financeiros de revenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user, selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setCurrentPage(1);
  };

  const filteredSales = useMemo(() => {
    if (!data?.salesList) return [];
    return data.salesList.filter((s: any) => {
      const matchesCycle = 
        cycleFilter === 'all' || 
        (cycleFilter === 'mensal' && s.mensal > 0) ||
        (cycleFilter === 'anual' && s.anual > 0);

      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'completed' && (s.status === 'completed' || s.status === 'pago')) ||
        (statusFilter === 'pending' && s.status === 'pending');

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        s.orderId.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        String(s.orderAmount).includes(q) ||
        String(s.mensal).includes(q);

      return matchesCycle && matchesStatus && matchesSearch;
    });
  }, [data?.salesList, searchQuery, statusFilter, cycleFilter]);

  const filteredItemized = useMemo(() => {
    if (!data?.itemizedTransactions) return [];
    return data.itemizedTransactions.filter((tx: any) => {
      const matchesCycle = 
        cycleFilter === 'all' ||
        (cycleFilter === 'mensal' && tx.category?.toLowerCase().includes('mensal')) ||
        (cycleFilter === 'anual' && tx.category?.toLowerCase().includes('anual'));

      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'completed' && (tx.status === 'PAGO' || tx.status === 'completed' || tx.status === 'pago')) ||
        (statusFilter === 'pending' && (tx.status === 'PENDENTE' || tx.status === 'pending'));

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        tx.orderId.toLowerCase().includes(q) ||
        tx.affiliateName.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        String(tx.amount).includes(q);

      return matchesCycle && matchesStatus && matchesSearch;
    });
  }, [data?.itemizedTransactions, searchQuery, statusFilter, cycleFilter]);

  const handleExportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const monthLabel = `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;
    const now = new Date().toLocaleString('pt-BR');

    // Header profissional
    doc.setFillColor(15, 23, 42); // Midnight
    doc.rect(0, 0, 210, 45, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO FINANCEIRO DO REVENDEDOR', 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.setFont('helvetica', 'normal');
    doc.text(`Revendedor: ${profile?.full_name || 'Revendedor Autorizado'}`, 14, 30);
    doc.text(`Mês de Referência: ${monthLabel}`, 14, 36);
    doc.text(`Emissão: ${now}`, 150, 30);
    doc.text(`Documento: ${profile?.cpf || profile?.cnpj || '---'} (${data.isPJ ? 'PJ' : 'PF'})`, 150, 36);

    // Resumo
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo dos Repasses do Mês', 14, 58);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Vendas Fechadas no Mês: ${data.salesCount} pedidos`, 14, 66);
    doc.text(`Faturamento Total de Revenda: R$ ${data.totalOrderVolume.toFixed(2).replace('.', ',')}`, 14, 72);
    doc.text(`Repasse Mensal da Revenda: R$ ${data.monthlyToReceive.toFixed(2).replace('.', ',')}`, 14, 78);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // Amber
    doc.text(`REPASSE MENSAL BRUTO A RECEBER: R$ ${data.tax.bruto.toFixed(2).replace('.', ',')}`, 120, 66);
    if (!data.isPJ) {
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(`Dedução INSS (11% PF): -R$ ${data.tax.inss.toFixed(2).replace('.', ',')}`, 120, 72);
    }
    doc.setTextColor(16, 185, 129); // Emerald
    doc.setFontSize(11);
    doc.text(`VALOR LÍQUIDO A RECEBER NO DIA 10: R$ ${data.tax.liquido.toFixed(2).replace('.', ',')}`, 120, 80);

    // Tabela de Pedidos
    const tableData = filteredSales.map((s: any) => [
      `#${s.orderId}`,
      s.customerName,
      new Date(s.date).toLocaleDateString('pt-BR'),
      `R$ ${s.orderAmount.toFixed(2).replace('.', ',')}`,
      `R$ ${s.mensal.toFixed(2).replace('.', ',')}`,
      `R$ ${s.anual.toFixed(2).replace('.', ',')}`,
      `R$ ${s.totalCommission.toFixed(2).replace('.', ',')}`,
      s.status === 'completed' || s.status === 'pago' ? 'Liquidado' : 'Aguardando Pagamento'
    ]);

    const regMensalRate = data?.config?.commission_regional_mensal ?? 4;
    const regAnualRate = data?.config?.commission_regional_anual ?? 2;
    const regTotalRate = regMensalRate + regAnualRate;

    autoTable(doc, {
      startY: 92,
      head: [['PEDIDO', 'CLIENTE', 'DATA', 'VALOR VENDA', `MENSAL (${regMensalRate}%)`, `ANUAL (${regAnualRate}%)`, `TOTAL REG. (${regTotalRate}%)`, 'STATUS']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', textColor: [217, 119, 6] },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center' }
      }
    });

    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
      doc.text('Serviços Urbanos - Relatório Financeiro de Revenda', 14, 285);
    }

    doc.save(`extrato-revenda-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.pdf`);
    toast.success('Extrato em PDF gerado com sucesso!');
  };

  const isDecember = selectedMonth === 11;
  const nextPayoutDate = isDecember 
    ? new Date(selectedYear, 11, 10) 
    : new Date(selectedYear, selectedMonth + 1, 10);
  const nextPayoutFormatted = nextPayoutDate.toLocaleDateString('pt-BR');

  return (
    <AffiliateLayout title="Financeiro do Revendedor">
      <div className="p-8 lg:p-12 space-y-10">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles size={12} />
              Exclusivo Revendedor Regional
            </div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <CircleDollarSign size={24} />
              </div>
              Financeiro do <span className="text-amber-500">Revendedor</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Acompanhe suas comissões de revenda e previsão exata de repasses a receber no mês.
            </p>
          </div>

          {/* Month Selector & PDF Export */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-1.5 flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="size-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 py-1 text-center">
                <span className="text-xs font-black text-midnight uppercase tracking-wider block">
                  {MONTH_NAMES[selectedMonth]}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">
                  {selectedYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="size-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={loading || !data}
              className="bg-midnight hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download size={16} className="text-amber-400" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Balance Cards - Credit Card Style (Idêntico ao Financeiro de Rede) */}
        <div className="flex flex-col sm:flex-row items-stretch gap-6 md:gap-8">
           
           {/* Card 1: Cashback Mensal Valor Bruto */}
           <motion.div 
             whileHover={{ y: -4 }}
             onClick={() => {
               setCycleFilter(cycleFilter === 'mensal' ? 'all' : 'mensal');
               setCurrentPage(1);
             }}
             className={`w-full sm:w-[350px] aspect-[1.58/1] bg-slate-950 p-6 rounded-[1.75rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl transition-all cursor-pointer group shrink-0 ${
               cycleFilter === 'mensal' ? 'ring-3 ring-emerald-500 shadow-emerald-500/20' : 'shadow-slate-900/20'
             }`}
           >
              {/* Design Elements */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-blue/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">CASHBACK MENSAL VALOR BRUTO</p>
                 </div>
                 <div className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
                   cycleFilter === 'mensal' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-emerald-500 border-white/5'
                 }`}>
                    <Wallet size={16} />
                 </div>
              </div>

              <div className="relative z-10 my-auto">
                 <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase mb-1">
                   R$ {Number(data?.monthlyToReceive !== undefined ? data.monthlyToReceive : (data?.monthlyEarned ?? 0)).toFixed(2)}
                 </h2>
                 <div className="flex items-center gap-1.5">
                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pagamentos Todo Dia 10</p>
                 </div>
              </div>

              {/* Card Footer Decoration */}
              <div className="relative z-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                 <div className="flex -space-x-1.5">
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest">URBA WALLET</span>
              </div>
           </motion.div>

           {/* Card 2: Cashback Valor Bruto Acumulado */}
           <motion.div 
             whileHover={{ y: -4 }}
             onClick={() => {
               setCycleFilter(cycleFilter === 'anual' ? 'all' : 'anual');
               setCurrentPage(1);
             }}
             className={`w-full sm:w-[350px] aspect-[1.58/1] bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 p-6 rounded-[1.75rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl transition-all cursor-pointer group shrink-0 ${
               cycleFilter === 'anual' ? 'ring-3 ring-blue-400 shadow-blue-500/20' : 'shadow-blue-900/20'
             }`}
           >
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">CASHBACK VALOR BRUTO ACUMULADO</p>
                 </div>
                 <div className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
                   cycleFilter === 'anual' ? 'bg-white text-indigo-600 border-white' : 'bg-white/10 text-white border-white/10'
                 }`}>
                    <Calendar size={16} />
                 </div>
              </div>

              <div className="relative z-10 my-auto">
                 <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase mb-1">
                   R$ {Number(data?.annualToReceive !== undefined ? data.annualToReceive : (data?.annualEarned ?? 0)).toFixed(2)}
                 </h2>
                 <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-blue-300" />
                    <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest">Liberação em 10 de Dezembro</p>
                 </div>
              </div>

              {/* Card Footer Decoration */}
              <div className="relative z-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                 <div className="flex -space-x-1.5">
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest">POUPANÇA URBA</span>
              </div>
           </motion.div>
        </div>

        {/* 2 Secondary Cards: Anual e Volume de Vendas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 2. Repasse Anual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <Calendar size={22} />
              </div>
              <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                Anual ({data?.rates?.anual ?? 2}% reg.)
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Repasse Anual da Revenda
            </p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter text-emerald-600">
              R$ {loading ? '...' : (data?.annualToReceive ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2">
              Saldo acumulado até 30/Nov (pago em 10 de Dezembro)
            </p>
          </motion.div>

          {/* 3. Vendas / Faturamento no Mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <Receipt size={22} />
              </div>
              <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase">
                Volume {MONTH_NAMES[selectedMonth]}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Vendas Fechadas no Mês
            </p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              {loading ? '...' : data?.salesCount ?? 0} <span className="text-sm font-bold text-slate-400">pedidos</span>
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2">
              Faturamento Total: <strong className="text-slate-700 font-bold">R$ {loading ? '...' : (data?.totalOrderVolume ?? 0).toFixed(2).replace('.', ',')}</strong>
            </p>
          </motion.div>
        </div>

        {/* Tabela de Fechamentos / Vendas e Comissões do Mês */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm p-8 md:p-10 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-midnight tracking-tight italic uppercase">
                Extrato de Vendas de Revenda ({MONTH_NAMES[selectedMonth]}/{selectedYear})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Detalhamento dos pedidos vinculados e repasses gerados para você.
              </p>
            </div>

            {/* Search, View Mode and Status Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Alternador de Visão: Lançamentos REG vs Por Pedido */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => { setViewMode('itemized'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'itemized' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className={`px-1 py-0.2 rounded text-[8px] font-black ${viewMode === 'itemized' ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-700'}`}>REG</span>
                  Lançamentos (REG)
                </button>
                <button
                  onClick={() => { setViewMode('orders'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'orders' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Por Pedido
                </button>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar pedido ou cliente..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-midnight shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'pending' ? 'bg-white text-midnight shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => { setStatusFilter('completed'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-white text-midnight shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pagas
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {(() => {
            const currentList = viewMode === 'itemized' ? filteredItemized : filteredSales;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedList = currentList.slice(startIndex, startIndex + itemsPerPage);
            const totalPages = Math.ceil(currentList.length / itemsPerPage);

            if (loading) {
              return (
                <div className="py-20 text-center">
                  <div className="size-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando dados de revenda...</p>
                </div>
              );
            }

            if (currentList.length === 0) {
              return (
                <div className="py-16 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <Receipt size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-wider">
                    Nenhuma comissão de revenda encontrada para {MONTH_NAMES[selectedMonth]}/{selectedYear}.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Novas vendas e assinaturas fechadas no período aparecerão automaticamente aqui.
                  </p>
                </div>
              );
            }

            return (
              <>
                <div className="overflow-x-auto">
                  {viewMode === 'itemized' ? (
                    /* Tabela Detalhada com Nível REG e Categoria/Período */
                    <table className="w-full text-left border-separate border-spacing-y-2.5">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-5 py-2">ID DO PEDIDO</th>
                          <th className="px-5 py-2">AFILIADO / ORIGEM</th>
                          <th className="px-5 py-2 text-center">NÍVEL</th>
                          <th className="px-5 py-2 text-center">CATEGORIA / PERÍODO</th>
                          <th className="px-5 py-2">DATA</th>
                          <th className="px-5 py-2 text-right">VALOR</th>
                          <th className="px-5 py-2 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedList.map((tx: any) => (
                          <tr
                            key={tx.id}
                            className="bg-slate-50/70 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all rounded-2xl text-xs font-medium"
                          >
                            <td className="px-5 py-4 rounded-l-2xl font-black text-midnight font-mono">
                              #{tx.orderId}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-700">
                              {tx.affiliateName}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-black rounded-lg text-[9px] tracking-wider uppercase border border-purple-200/60">
                                REG
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                tx.category.includes('MENSAL')
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {tx.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-[11px]">
                              {new Date(tx.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-black text-emerald-600">
                              +R$ {tx.amount.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-5 py-4 text-center rounded-r-2xl">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                tx.status === 'PAGO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    /* Tabela Consolidada por Pedido */
                    <table className="w-full text-left border-separate border-spacing-y-2.5">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-5 py-2">ID DO PEDIDO</th>
                          <th className="px-5 py-2">CLIENTE / COMPRADOR</th>
                          <th className="px-5 py-2">DATA</th>
                          <th className="px-5 py-2 text-right">VALOR VENDA</th>
                          <th className="px-5 py-2 text-right text-amber-600 font-black">MENSAL ({data?.config?.commission_regional_mensal ?? 4}%)</th>
                          <th className="px-5 py-2 text-right">ANUAL ({data?.config?.commission_regional_anual ?? 2}%)</th>
                          <th className="px-5 py-2 text-right">TOTAL COMISSÃO ({(Number(data?.config?.commission_regional_mensal ?? 4) + Number(data?.config?.commission_regional_anual ?? 2)).toFixed(0)}%)</th>
                          <th className="px-5 py-2 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedList.map((sale: any) => (
                          <tr
                            key={sale.orderId}
                            className="bg-slate-50/70 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all rounded-2xl text-xs font-medium"
                          >
                            <td className="px-5 py-4 rounded-l-2xl font-black text-midnight font-mono">
                              #{sale.orderId}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-700">
                              {sale.customerName}
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-[11px]">
                              {new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-slate-800">
                              R$ {sale.orderAmount.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-amber-600 font-black bg-amber-50/50">
                              R$ {sale.mensal.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-emerald-600 font-bold">
                              R$ {sale.anual.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-black text-midnight">
                              R$ {sale.totalCommission.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-5 py-4 text-center rounded-r-2xl">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                sale.status === 'completed' || sale.status === 'pago'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {sale.status === 'completed' || sale.status === 'pago' ? 'Liquidado' : 'Aguardando'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, currentList.length)} de {currentList.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black text-midnight px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        </div>

      </div>
    </AffiliateLayout>
  );
}
