import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  ChevronRight, 
  ShieldCheck, 
  Building2, 
  Users,
  AlertTriangle,
  Receipt,
  Printer,
  Download,
  Filter,
  Eye,
  Check,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [payableBalances, setPayableBalances] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<'network' | 'reseller' | 'history'>('network');
  const [cycleFilter, setCycleFilter] = useState<'all' | 'weekly' | 'monthly' | 'annual'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Tranca inteligente de data: Pagamento Anual é liberado exclusivamente em 10 de Dezembro
  const isDecemberAnnualWindow = useMemo(() => {
    const now = new Date();
    // 11 é Dezembro (0-indexado)
    return now.getMonth() === 11 && now.getDate() >= 10;
  }, []);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<any[]>([]);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'all' | 'network' | 'reseller'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadBalances = async (category: 'network' | 'reseller') => {
    try {
      setLoading(true);
      const data = await businessRules.getPayableBalances(category);
      setPayableBalances(data);
    } catch (error) {
      console.error('Error loading balances:', error);
      toast.error('Erro ao carregar saldos para pagamento');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await businessRules.getPaymentHistory();
      setHistoryList(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Erro ao carregar histórico de pagamentos.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (viewTab === 'history') {
      loadHistory();
    } else {
      loadBalances(viewTab);
    }
    setCurrentPage(1);
  }, [viewTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Abrir PaymentModal para pagamento individual de um ciclo ou total
  const handleOpenPaymentModal = (userItem: any, payoutType: 'mensal' | 'digital' | 'anual' | 'total') => {
    if (!userItem.isEligible) {
      toast.error('Usuário inadimplente: pagamentos bloqueados até a regularização do plano.');
      return;
    }

    if (payoutType === 'mensal' && !userItem.canPayMonthly) {
      toast.error('Pagamento mensal bloqueado: usuário não enviou a Nota Fiscal para conferência.');
      return;
    }

    if (payoutType === 'anual' && !isDecemberAnnualWindow) {
      toast.error('Pagamento Anual bloqueado: liberado exclusivamente no dia 10 de Dezembro!');
      return;
    }

    let amountToPay = 0;
    let grossAmount = 0;
    let inssAmount = 0;
    let descLabel = '';

    if (payoutType === 'mensal') {
      amountToPay = userItem.monthlyLiquid !== undefined ? userItem.monthlyLiquid : userItem.monthlyPending;
      grossAmount = userItem.monthlyPending;
      inssAmount = userItem.monthlyInss || 0;
      descLabel = 'Cashback Mensal';
    } else if (payoutType === 'digital') {
      amountToPay = userItem.digitalLiquid !== undefined ? userItem.digitalLiquid : userItem.digitalPending;
      grossAmount = userItem.digitalPending;
      inssAmount = userItem.digitalInss || 0;
      descLabel = 'Cashback Semanal';
    } else if (payoutType === 'anual') {
      amountToPay = userItem.annualLiquid !== undefined ? userItem.annualLiquid : userItem.annualPending;
      grossAmount = userItem.annualPending;
      inssAmount = userItem.annualInss || 0;
      descLabel = 'Cashback Anual';
    } else {
      // Payout total / liberados hoje (Semanal + Mensal se NF enviada, Anual só se for >= 10/Dez)
      let calcGross = userItem.digitalPending || 0;
      let calcLiquid = userItem.digitalLiquid || 0;
      let calcInss = userItem.digitalInss || 0;
      const labels: string[] = ['Semanal'];

      if (userItem.canPayMonthly && (userItem.monthlyPending || 0) > 0) {
        calcGross += userItem.monthlyPending;
        calcLiquid += (userItem.monthlyLiquid || 0);
        calcInss += (userItem.monthlyInss || 0);
        labels.push('Mensal');
      }

      if (isDecemberAnnualWindow && (userItem.annualPending || 0) > 0) {
        calcGross += userItem.annualPending;
        calcLiquid += (userItem.annualLiquid || 0);
        calcInss += (userItem.annualInss || 0);
        labels.push('Anual');
      }

      if (calcLiquid <= 0) {
        toast.error('Nenhum valor liberado para pagamento no momento.');
        return;
      }

      amountToPay = calcLiquid;
      grossAmount = calcGross;
      inssAmount = calcInss;
      descLabel = `Pagamento Liberado (${labels.join(' + ')})`;
    }

    const record = {
      payeeId: userItem.profileId,
      payeeName: userItem.userName,
      payeeCpf: userItem.cpf,
      payeePixKey: userItem.pixKey,
      payeeWhatsapp: userItem.whatsapp,
      orderId: userItem.orderNumber ? `PED-${userItem.orderNumber}` : `SAQUE-${userItem.profileId.substring(0, 5)}`,
      repasse: amountToPay,
      bruto: grossAmount,
      inss: inssAmount,
      is_pj: userItem.isPJ,
      payoutType,
      viewCategory: viewTab,
      descLabel
    };

    setSelectedForPayment([record]);
    setIsPaymentModalOpen(true);
  };

  // Confirmação vinda da PaymentModal
  const handleConfirmPaymentFromModal = async (payeeGroup: any) => {
    try {
      const record = payeeGroup.orders[0];
      let receiptUrl = '';

      if (payeeGroup.receiptFile) {
        receiptUrl = await businessRules.uploadReceipt(payeeGroup.receiptFile);
      }

      const pType = record.payoutType === 'total' ? 'mensal' : record.payoutType;

      await businessRules.processPayout(
        record.payeeId,
        record.bruto,
        pType,
        receiptUrl,
        record.viewCategory === 'reseller' ? 'reseller' : 'network'
      );

      // Notificação WhatsApp opcional
      if (payeeGroup.payeeWhatsapp && payeeGroup.payeeWhatsapp.trim() !== '') {
        try {
          const msg = `Olá ${payeeGroup.payeeName}! Seu pagamento no valor de R$ ${record.repasse.toFixed(2).replace('.', ',')} foi liquidado com sucesso na chave PIX cadastrada.`;
          await businessRules.sendTestWhatsAppMessage(payeeGroup.payeeWhatsapp, msg);
        } catch (wErr) {
          console.error('WhatsApp notify error:', wErr);
        }
      }

      toast.success(`Pagamento de R$ ${record.repasse.toFixed(2).replace('.', ',')} confirmado com sucesso!`);
      setIsPaymentModalOpen(false);

      if (viewTab !== 'history') {
        await loadBalances(viewTab);
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Erro ao confirmar pagamento.');
    }
  };

  // Filtragem de Pagamentos Pendentes
  const filteredBalances = useMemo(() => {
    return payableBalances.filter(w => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        w.userName.toLowerCase().includes(q) ||
        w.userEmail.toLowerCase().includes(q) ||
        w.pixKey.toLowerCase().includes(q) ||
        w.cpf.toLowerCase().includes(q);

      const matchesCycle = 
        cycleFilter === 'all' ||
        (cycleFilter === 'weekly' && w.digitalPending > 0) ||
        (cycleFilter === 'monthly' && w.monthlyPending > 0) ||
        (cycleFilter === 'annual' && w.annualPending > 0);

      return matchesSearch && matchesCycle;
    });
  }, [payableBalances, searchTerm, cycleFilter]);

  // Filtragem do Histórico de Pagamentos
  const filteredHistory = useMemo(() => {
    return historyList.filter(h => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        h.userName.toLowerCase().includes(q) ||
        h.userEmail.toLowerCase().includes(q) ||
        h.pixKey.toLowerCase().includes(q) ||
        h.cpf.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q);

      const matchesCat = 
        historyCategoryFilter === 'all' ||
        (historyCategoryFilter === 'network' && h.categoryLabel === 'Rede MMN') ||
        (historyCategoryFilter === 'reseller' && h.categoryLabel === 'Revendedor Regional');

      return matchesSearch && matchesCat;
    });
  }, [historyList, searchTerm, historyCategoryFilter]);

  // Totais Gerais dos Pendentes
  const totalMonthlyPending = payableBalances.reduce((acc, curr) => acc + (curr.monthlyLiquid !== undefined ? curr.monthlyLiquid : (curr.monthlyPending || 0)), 0);
  const totalAnnualPending = payableBalances.reduce((acc, curr) => acc + (curr.annualLiquid !== undefined ? curr.annualLiquid : (curr.annualPending || 0)), 0);
  const totalDigitalPending = payableBalances.reduce((acc, curr) => acc + (curr.digitalLiquid !== undefined ? curr.digitalLiquid : (curr.digitalPending || 0)), 0);
  const totalPending = totalMonthlyPending + totalAnnualPending + totalDigitalPending;

  // Exportar CSV de Pendentes
  const handleExportCSV = () => {
    const csvContent: string[] = [];
    const reportTitle = viewTab === 'history' 
      ? 'Relatorio de Historico de Pagamentos Liquidados'
      : viewTab === 'reseller'
        ? 'Relatorio de Repasses de Revendedores Regionais Pendentes'
        : 'Relatorio de Comissoes de Rede MMN Pendentes';
    
    csvContent.push(`${reportTitle} - Gerado em ${new Date().toLocaleString('pt-BR')}`);
    csvContent.push('');

    if (viewTab === 'history') {
      csvContent.push('Data;Beneficiario;CPF;Categoria;Ciclo;Valor Pago;Chave PIX;Status;Comprovante');
      filteredHistory.forEach(h => {
        csvContent.push([
          new Date(h.date).toLocaleDateString('pt-BR'),
          `"${h.userName}"`,
          `"${h.cpf}"`,
          h.categoryLabel,
          h.cycleLabel,
          `R$ ${h.amount.toFixed(2).replace('.', ',')}`,
          `"${h.pixKey}"`,
          h.status,
          h.receiptUrl || 'Sem comprovante'
        ].join(';'));
      });
    } else {
      csvContent.push('Nivel;Pedido;Nome;Email;Tipo;Chave PIX;Status NF;Mensal Liquido;Semanal Liquido;Anual Liquido;Total Liquido');
      filteredBalances.forEach(w => {
        csvContent.push([
          w.level || 'G0',
          w.orderNumber ? `#${w.orderNumber}` : '---',
          `"${w.userName}"`,
          w.userEmail,
          w.isPJ ? 'PJ' : 'PF',
          `"${w.pixKey}"`,
          w.hasInvoice ? 'Enviada' : 'Pendente',
          `R$ ${(w.monthlyLiquid || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(w.digitalLiquid || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(w.annualLiquid || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(w.totalLiquid || 0).toFixed(2).replace('.', ',')}`
        ].join(';'));
      });
    }

    const csvString = csvContent.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_pagamentos_${viewTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV baixado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Paginação
  const currentList = viewTab === 'history' ? filteredHistory : filteredBalances;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = currentList.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(currentList.length / itemsPerPage);

  return (
    <AdminLayout 
      title="Gestão de Pagamentos" 
      subtitle="Central de pagamentos de comissões, repasses e auditoria fiscal com QR Code PIX"
    >
      <div className="p-6 md:p-10 lg:p-12 space-y-8">
        
        {/* Toggle das 3 Abas Principais */}
        <div className="flex flex-wrap bg-[#0a0e17] p-2 rounded-[2rem] border border-white/5 shadow-2xl w-full max-w-3xl gap-2">
          <button
            onClick={() => setViewTab('network')}
            className={`flex-1 min-w-[200px] py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'network'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Afiliados (Rede MMN)
          </button>
          
          <button
            onClick={() => setViewTab('reseller')}
            className={`flex-1 min-w-[200px] py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'reseller'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={16} />
            Revendedores Regionais
          </button>

          <button
            onClick={() => setViewTab('history')}
            className={`flex-1 min-w-[200px] py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt size={16} />
            Histórico (Auditoria)
          </button>
        </div>

        {/* Bloco de Métricas (Aparece para Afiliados e Revendedores) */}
        {viewTab !== 'history' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="size-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                <DollarSign size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Geral Líquido</p>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="size-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Semanal (Pagar Sexta)</p>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  R$ {totalDigitalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                <Calendar size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Mensal (Dia 10 - Exige NF)</p>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  R$ {totalMonthlyPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="size-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Anual (10 de Dezembro)</p>
                  {!isDecemberAnnualWindow && (
                    <span className="bg-amber-500/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 uppercase flex items-center gap-0.5">
                      <Lock size={9} /> Bloqueado
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  R$ {totalAnnualPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros, Busca e Ações de Exportação */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Campo de Busca */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar por nome, CPF, e-mail ou chave PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0e17] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
              />
            </div>

            {/* Subfiltros de Ciclo para as abas de Afiliados e Revendedores */}
            {viewTab !== 'history' && (
              <div className="flex bg-[#0a0e17] p-1 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => setCycleFilter('all')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    cycleFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setCycleFilter('weekly')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    cycleFilter === 'weekly' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Semanal
                </button>
                <button
                  onClick={() => setCycleFilter('monthly')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    cycleFilter === 'monthly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔵 Mensal
                </button>
                <button
                  onClick={() => setCycleFilter('annual')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    cycleFilter === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟣 Anual
                </button>
              </div>
            )}

            {/* Subfiltros de Categoria para a aba de Histórico */}
            {viewTab === 'history' && (
              <div className="flex bg-[#0a0e17] p-1 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => setHistoryCategoryFilter('all')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    historyCategoryFilter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setHistoryCategoryFilter('network')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    historyCategoryFilter === 'network' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rede MMN
                </button>
                <button
                  onClick={() => setHistoryCategoryFilter('reseller')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    historyCategoryFilter === 'reseller' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Revendedor
                </button>
              </div>
            )}
          </div>

          {/* Botões de Ação: Exportar CSV e Imprimir */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 bg-[#0a0e17] hover:bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download size={15} />
              Exportar CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer size={15} />
              Imprimir
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL: AFILIADOS E REVENDEDORES (CARDS COM PAYMENTMODAL E NOTA FISCAL) */}
        {viewTab !== 'history' && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando dados de pagamentos...</p>
              </div>
            ) : filteredBalances.length === 0 ? (
              <div className="py-20 text-center bg-[#0a0e17] rounded-[2.5rem] border border-white/5 p-8">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4 opacity-50" />
                <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhum pagamento pendente encontrado</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Todos os repasses e comissões da categoria selecionada foram devidamente liquidados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedList.map((w: any) => (
                  <div 
                    key={w.profileId}
                    className="bg-[#0a0e17] p-6 lg:p-8 rounded-[2rem] border border-white/5 shadow-xl hover:border-white/10 transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6"
                  >
                    {/* Dados do Afiliado / Revendedor */}
                    <div className="space-y-3 flex-1 min-w-[280px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {w.level}
                        </span>
                        <h4 className="text-base font-black text-white uppercase tracking-tight">
                          {w.userName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          CPF/CNPJ: {w.cpf || '---'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          w.isPJ ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {w.isPJ ? 'PJ (Isento)' : 'PF (INSS 11%)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          w.isEligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {w.isEligible ? '🟢 Adimplente' : '🔒 Inadimplente'}
                        </span>
                      </div>

                      {/* Dados de Contato e Chave PIX */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400">
                        <span>Email: <strong className="text-slate-300">{w.userEmail}</strong></span>
                        <span className="flex items-center gap-1.5">
                          PIX: <strong className="font-mono text-amber-300">{w.pixKey}</strong>
                          <button
                            onClick={() => copyToClipboard(w.pixKey, 'Chave PIX')}
                            className="p-1 hover:text-white transition-colors cursor-pointer"
                            title="Copiar PIX"
                          >
                            <Copy size={13} />
                          </button>
                        </span>
                        <span>Banco: <strong className="text-slate-300">{w.bankDetails}</strong></span>
                      </div>

                      {/* Status da Nota Fiscal */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Nota Fiscal do Mês:
                        </span>
                        {w.hasInvoice ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                              w.isInvoiceAmountMatching
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              <CheckCircle2 size={11} /> 
                              {w.isInvoiceAmountMatching ? 'NF Conferida' : 'NF Registrada'} ({w.invoiceNumber ? `#${w.invoiceNumber}` : 'Registrada'}
                              {w.invoiceAmount ? ` - R$ ${w.invoiceAmount.toFixed(2).replace('.', ',')}` : ''})
                            </span>
                            {(w.invoiceLink || w.invoiceFileUrl) && (
                              <a 
                                href={w.invoiceLink || w.invoiceFileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider cursor-pointer"
                              >
                                <Eye size={12} /> Abrir Nota Fiscal
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle size={11} /> Aguardando Envio de NF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Blocos de Valores por Ciclo */}
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-white/5">
                      
                      {/* 1. Semanal */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center min-w-[130px]">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider block mb-1">
                          Semanal Líquido
                        </span>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.digitalLiquid || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          disabled={!w.isEligible || (w.digitalLiquid || 0) <= 0}
                          onClick={() => handleOpenPaymentModal(w, 'digital')}
                          className="mt-2 w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Pagar Semanal
                        </button>
                      </div>

                      {/* 2. Mensal (Exige NF) */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center min-w-[130px]">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mb-1">
                          Mensal Líquido
                        </span>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.monthlyLiquid || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          disabled={!w.isEligible || (w.monthlyLiquid || 0) <= 0 || !w.canPayMonthly}
                          onClick={() => handleOpenPaymentModal(w, 'mensal')}
                          title={!w.canPayMonthly ? 'Bloqueado: Requer envio prévio da Nota Fiscal' : 'Pagar via PIX'}
                          className={`mt-2 w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            !w.canPayMonthly 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 opacity-70 cursor-not-allowed' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:pointer-events-none'
                          }`}
                        >
                          {!w.hasInvoice ? 'Aguardando NF' : 'Pagar Mensal'}
                        </button>
                      </div>

                      {/* 3. Anual (Liberado exclusivamente em 10 de Dezembro) */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center min-w-[130px]">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">
                            Anual Líquido
                          </span>
                          {!isDecemberAnnualWindow && (
                            <span title="Bloqueado até 10 de Dezembro">
                              <Lock size={10} className="text-amber-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.annualLiquid || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          disabled={!w.isEligible || (w.annualLiquid || 0) <= 0 || !isDecemberAnnualWindow}
                          onClick={() => handleOpenPaymentModal(w, 'anual')}
                          title={!isDecemberAnnualWindow ? 'Bloqueado: Liberado exclusivamente no dia 10 de Dezembro' : 'Pagar Bônus Anual'}
                          className={`mt-2 w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            !isDecemberAnnualWindow
                              ? 'bg-slate-800/90 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-75'
                              : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white'
                          }`}
                        >
                          {!isDecemberAnnualWindow ? (
                            <>
                              <Lock size={10} /> Libera 10/Dez
                            </>
                          ) : (
                            'Pagar Anual'
                          )}
                        </button>
                      </div>

                      {/* 4. Total Consolidado (Liberado Hoje) */}
                      {(() => {
                        const liquidPayableToday = (w.digitalLiquid || 0) + 
                          (w.canPayMonthly ? (w.monthlyLiquid || 0) : 0) + 
                          (isDecemberAnnualWindow ? (w.annualLiquid || 0) : 0);

                        return (
                          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 p-4 rounded-2xl border border-indigo-500/30 text-center min-w-[140px]">
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider block mb-1">
                              {isDecemberAnnualWindow ? 'Total Líquido' : 'Liberado Hoje'}
                            </span>
                            <span className="text-xl font-black text-amber-400 font-mono block">
                              R$ {liquidPayableToday.toFixed(2).replace('.', ',')}
                            </span>
                            {!isDecemberAnnualWindow && (w.annualLiquid || 0) > 0 && (
                              <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">
                                + R$ {(w.annualLiquid || 0).toFixed(2).replace('.', ',')} em 10/Dez
                              </span>
                            )}
                            <button
                              disabled={!w.isEligible || liquidPayableToday <= 0}
                              onClick={() => handleOpenPaymentModal(w, 'total')}
                              className="mt-2 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                            >
                              {isDecemberAnnualWindow ? 'Pagar Total' : 'Pagar Liberados'}
                            </button>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: HISTÓRICO DE PAGAMENTOS (AUDITORIA COMPLETA) */}
        {viewTab === 'history' && (
          <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Auditoria de Pagamentos Liquidados
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Registros oficiais de baixas realizadas via PIX com comprovantes e detalhamento contábil.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                Total de Registros: {filteredHistory.length}
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-20 text-center">
                <Loader2 size={36} className="animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando histórico de auditoria...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-20 text-center">
                <Receipt size={48} className="text-slate-600 mx-auto mb-4 opacity-40" />
                <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhum histórico encontrado</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Nenhuma transação de saída/saque liquidada corresponde aos filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="py-4 px-4">Data / Hora</th>
                      <th className="py-4 px-4">Beneficiário</th>
                      <th className="py-4 px-4">Categoria</th>
                      <th className="py-4 px-4">Ciclo</th>
                      <th className="py-4 px-4 text-right">Valor Pago</th>
                      <th className="py-4 px-4">Chave PIX</th>
                      <th className="py-4 px-4 text-center">Comprovante</th>
                      <th className="py-4 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedList.map((h: any) => (
                      <tr key={h.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(h.date).toLocaleDateString('pt-BR')} às {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white uppercase">{h.userName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">CPF: {h.cpf}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            h.categoryLabel === 'Revendedor Regional' 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            {h.categoryLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-300">
                          {h.cycleLabel}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                          R$ {h.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                          {h.pixKey}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {h.receiptUrl ? (
                            <a 
                              href={h.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-black text-[9px] uppercase tracking-wider transition-colors"
                            >
                              <FileText size={12} /> Ver Recibo
                            </a>
                          ) : (
                            <span className="text-[9px] text-slate-600 font-bold uppercase">---</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                            <CheckCircle2 size={11} /> Liquidado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, currentList.length)} de {currentList.length} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-white px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PaymentModal com QR Code PIX e Baixa */}
        {isPaymentModalOpen && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedRecords={selectedForPayment}
            onConfirmPayment={handleConfirmPaymentFromModal}
          />
        )}

      </div>
    </AdminLayout>
  );
}
