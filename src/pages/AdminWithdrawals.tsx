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
  AlertCircle,
  Receipt,
  Printer,
  Download,
  Filter,
  Eye,
  Check,
  Lock,
  FolderArchive,
  FileSpreadsheet,
  BarChart3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [payableBalances, setPayableBalances] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<'network' | 'reseller' | 'history' | 'monthly_folder'>('network');
  const [cycleFilter, setCycleFilter] = useState<'all' | 'monthly' | 'annual'>('all');
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

  // Statement Modal State (Informativo Valor Líquido)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Consolidated Statement Modal State (Financeiro Resumo)
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<any | null>(null);
  const [loadingConsolidated, setLoadingConsolidated] = useState(false);

  // Pasta de Pagamentos Mensais State
  const [archivedMonths, setArchivedMonths] = useState<string[]>([]);
  const [selectedArchiveMonth, setSelectedArchiveMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyArchives, setMonthlyArchives] = useState<any[]>([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

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

  const loadArchives = async (targetMonth?: string) => {
    try {
      setLoadingArchives(true);
      const month = targetMonth || selectedArchiveMonth;
      const data = await businessRules.getMonthlyPayoutArchives(month);
      setMonthlyArchives(data);
      const months = await businessRules.getArchivedMonths();
      setArchivedMonths(months);
    } catch (error) {
      console.error('Error loading archives:', error);
      toast.error('Erro ao carregar pasta de pagamentos.');
    } finally {
      setLoadingArchives(false);
    }
  };

  const handleOpenStatementModal = async (userItem: any) => {
    try {
      setLoadingStatement(true);
      setIsStatementModalOpen(true);
      const now = new Date();
      const statement = await businessRules.getConsolidatedFinancialStatement(
        userItem.profileId || userItem.userId,
        now.getFullYear(),
        now.getMonth() + 1
      );
      setStatementData({
        refMonth: statement.refMonth,
        periodLabel: `PERÍODO DE ${statement.periodoStr}`,
        paymentDateLabel: statement.previsaoPagamentoStr,
        user: {
          id: statement.userId,
          name: statement.beneficiaryName,
          cpf: statement.cpfCnpj,
          pixKey: statement.pixKey,
          isPJ: statement.isPJ
        },
        mensalMmnBruto: statement.brutoMensalMmn,
        mensalRevendedorBruto: statement.brutoMensalRevendedor,
        anualMmnBruto: statement.brutoAnualMmn,
        anualRevendedorBruto: statement.brutoAnualRevendedor,
        mensalBruto: statement.brutoMensalMmn,
        anualBruto: statement.brutoAnualMmn,
        annualPeriodLabel: statement.annualPeriodLabel,
        isAnnualPaymentCycle: statement.isDecemberAnnualPayout,
        totalBruto: statement.totalBruto,
        inss: statement.inss,
        baseIRPF: statement.baseIrrf,
        irrf: statement.irrf,
        liquido: statement.liquido,
        receiptUrl: statement.receiptUrl,
        isPaid: statement.isPaid
      });
    } catch (err) {
      console.error('Error loading statement:', err);
      toast.error('Erro ao carregar demonstrativo.');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleOpenConsolidatedModal = async (userItem: any) => {
    try {
      setLoadingConsolidated(true);
      setIsConsolidatedModalOpen(true);
      const now = new Date();
      const statement = await businessRules.getConsolidatedFinancialStatement(
        userItem.profileId || userItem.userId,
        now.getFullYear(),
        now.getMonth() + 1
      );
      setConsolidatedData(statement);
    } catch (err) {
      console.error('Error loading consolidated statement:', err);
      toast.error('Erro ao carregar resumo consolidado.');
    } finally {
      setLoadingConsolidated(false);
    }
  };

  const handleOpenArchivedStatementModal = (archivedRecord: any) => {
    // Monta o objeto de demonstrativo a partir do registro arquivado
    setStatementData({
      refMonth: archivedRecord.refMonth,
      periodLabel: archivedRecord.periodLabel,
      paymentDateLabel: archivedRecord.paymentDateLabel,
      user: {
        id: archivedRecord.userId,
        name: archivedRecord.userName,
        cpf: archivedRecord.userCpf,
        pixKey: archivedRecord.userPixKey,
        isPJ: archivedRecord.isPJ
      },
      g0Value: archivedRecord.g0Value,
      g1Value: archivedRecord.g1Value,
      g2Value: archivedRecord.g2Value,
      mensalBruto: archivedRecord.mensalBruto,
      anualBruto: archivedRecord.anualBruto,
      isAnnualPaymentCycle: (archivedRecord.anualBruto || 0) > 0,
      totalBruto: archivedRecord.totalBruto,
      inss: archivedRecord.inss,
      baseIRPF: Math.max(0, archivedRecord.totalBruto - archivedRecord.inss),
      irrf: archivedRecord.irrf,
      liquido: archivedRecord.liquido,
      receiptUrl: archivedRecord.receiptUrl,
      status: archivedRecord.status
    });
    setIsStatementModalOpen(true);
  };

  const handleExportScheduledPixCSV = () => {
    if (payableBalances.length === 0) {
      toast.error('Nenhum saldo pendente para exportar.');
      return;
    }
    const now = new Date();
    const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    businessRules.exportNetPayoutsCSV(payableBalances, refMonth);
    toast.success('CSV de programação PIX para o dia 10 gerado com sucesso!');
  };

  const handleExportConsolidatedCSV = async () => {
    try {
      if (payableBalances.length === 0) {
        toast.error('Nenhum saldo pendente para exportar.');
        return;
      }
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const refMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const statements = await Promise.all(
        payableBalances.map(u => 
          businessRules.getConsolidatedFinancialStatement(u.profileId || u.userId, currentYear, currentMonth)
        )
      );
      businessRules.exportConsolidatedPayoutsCSV(statements, refMonthStr);
      toast.success('Relatório Consolidado (MMN + Revendedor) CSV gerado com sucesso!');
    } catch (e) {
      console.error('Erro ao gerar CSV consolidado:', e);
      toast.error('Erro ao gerar CSV consolidado.');
    }
  };

  useEffect(() => {
    if (viewTab === 'history') {
      loadHistory();
    } else if (viewTab === 'monthly_folder') {
      loadArchives(selectedArchiveMonth);
    } else {
      loadBalances(viewTab);
    }
    setCurrentPage(1);
  }, [viewTab, selectedArchiveMonth]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Abrir PaymentModal para pagamento individual de um ciclo ou total
  const handleOpenPaymentModal = (userItem: any, payoutType: 'mensal' | 'anual' | 'total') => {
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
    let irrfAmount = 0;
    let descLabel = '';
    let splitDetails: any = null;

    if (payoutType === 'mensal') {
      amountToPay = userItem.monthlyLiquid !== undefined ? userItem.monthlyLiquid : userItem.monthlyPending;
      grossAmount = userItem.monthlyPending;
      inssAmount = userItem.monthlyInss || 0;
      irrfAmount = userItem.monthlyIrrf || 0;
      descLabel = 'Cashback Mensal';
    } else if (payoutType === 'anual') {
      amountToPay = userItem.annualLiquid !== undefined ? userItem.annualLiquid : userItem.annualPending;
      grossAmount = userItem.annualPending;
      inssAmount = userItem.annualInss || 0;
      irrfAmount = userItem.annualIrrf || 0;
      descLabel = 'Cashback Anual';
    } else {
      // Payout total / liberados hoje (Mensal somado no mês com NF)
      const payableLiq = userItem.liberadoLiquid !== undefined 
        ? userItem.liberadoLiquid 
        : (userItem.canPayMonthly ? (userItem.monthlyLiquid || 0) : 0);

      if (payableLiq <= 0) {
        toast.error('Nenhum valor liberado para pagamento no momento.');
        return;
      }

      amountToPay = payableLiq;
      grossAmount = userItem.liberadoPending !== undefined 
        ? userItem.liberadoPending 
        : (userItem.canPayMonthly ? (userItem.monthlyPending || 0) : 0);
      inssAmount = userItem.liberadoInss || 0;
      irrfAmount = userItem.liberadoIrrf || 0;
      
      descLabel = 'Pagamento Liberado (Mensal)';

      splitDetails = {
        monthly: userItem.canPayMonthly && (userItem.monthlyPending || 0) > 0 ? {
          bruto: userItem.monthlyPending,
          inss: userItem.monthlyInss || 0,
          irrf: userItem.monthlyIrrf || 0,
          liquido: userItem.monthlyLiquid || 0
        } : null
      };
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
      irrf: irrfAmount,
      is_pj: userItem.isPJ,
      payoutType,
      viewCategory: viewTab,
      descLabel,
      splitDetails
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

      await businessRules.processPayout(
        record.payeeId,
        record.bruto,
        record.payoutType,
        receiptUrl,
        record.viewCategory === 'reseller' ? 'reseller' : 'network',
        {
          inss: record.inss,
          irrf: record.irrf,
          liquido: record.repasse,
          splitDetails: record.splitDetails
        }
      );

      // Arquivar no histórico mensal do afiliado e da administração
      try {
        const now = new Date();
        const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const nextMonthNum = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
        const nextYearNum = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();

        await businessRules.archiveMonthlyPayout({
          id: `arch_${Date.now()}_${record.payeeId.substring(0, 5)}`,
          refMonth,
          periodLabel: `PERIODO DE 01.${String(now.getMonth() + 1).padStart(2, '0')} A ${lastDay}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`,
          paymentDateLabel: `10.${String(nextMonthNum).padStart(2, '0')}.${nextYearNum}`,
          paidAt: new Date().toISOString(),
          userId: record.payeeId,
          userName: record.payeeName,
          userCpf: record.payeeCpf,
          userPixKey: record.payeePixKey,
          isPJ: record.is_pj,
          g0Value: record.splitDetails?.monthly?.bruto || (record.payoutType === 'mensal' ? record.bruto : 0),
          g1Value: 0,
          g2Value: 0,
          mensalBruto: record.splitDetails?.monthly?.bruto || (record.payoutType === 'mensal' ? record.bruto : 0),
          anualBruto: record.payoutType === 'anual' ? record.bruto : 0,
          totalBruto: record.bruto,
          inss: record.inss || 0,
          irrf: record.irrf || 0,
          liquido: record.repasse,
          receiptUrl,
          status: 'PAID'
        });
      } catch (arcErr) {
        console.error('Error archiving monthly payout:', arcErr);
      }

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

      if (viewTab === 'monthly_folder') {
        await loadArchives(selectedArchiveMonth);
      } else if (viewTab !== 'history') {
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

  // Filtragem da Pasta de Pagamentos Mensais
  const filteredArchives = useMemo(() => {
    return monthlyArchives.filter(a => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        a.userName?.toLowerCase().includes(q) ||
        a.userPixKey?.toLowerCase().includes(q) ||
        a.userCpf?.toLowerCase().includes(q)
      );
    });
  }, [monthlyArchives, searchTerm]);

  // Totais Gerais dos Pendentes
  const totalMonthlyPending = payableBalances.reduce((acc, curr) => acc + (curr.monthlyLiquid !== undefined ? curr.monthlyLiquid : (curr.monthlyPending || 0)), 0);
  const totalAnnualPending = payableBalances.reduce((acc, curr) => acc + (curr.annualPending || 0), 0);
  const totalDigitalPending = 0;
  const totalPending = payableBalances.reduce((acc, curr) => acc + (curr.liberadoLiquid !== undefined ? curr.liberadoLiquid : (curr.canPayMonthly ? (curr.monthlyLiquid || 0) : 0)), 0);

  // Totais Gerais do Histórico (Auditoria Fiscal)
  const totalHistoryBruto = filteredHistory.reduce((acc, curr) => acc + (curr.bruto || curr.amount || 0), 0);
  const totalHistoryInss = filteredHistory.reduce((acc, curr) => acc + (curr.inss || 0), 0);
  const totalHistoryIrrf = filteredHistory.reduce((acc, curr) => acc + (curr.irrf || 0), 0);
  const totalHistoryLiquido = filteredHistory.reduce((acc, curr) => acc + (curr.liquido !== undefined ? curr.liquido : (curr.amount || 0)), 0);

  // Totais Gerais da Pasta de Pagamentos Mensais
  const totalArchiveBruto = filteredArchives.reduce((acc, curr) => acc + (curr.totalBruto || curr.mensalBruto || 0), 0);
  const totalArchiveInss = filteredArchives.reduce((acc, curr) => acc + (curr.inss || 0), 0);
  const totalArchiveIrrf = filteredArchives.reduce((acc, curr) => acc + (curr.irrf || 0), 0);
  const totalArchiveLiquido = filteredArchives.reduce((acc, curr) => acc + (curr.liquido || 0), 0);

  // Exportar CSV de Pendentes, Histórico e Pasta Mensal
  const handleExportCSV = () => {
    const csvContent: string[] = [];
    const reportTitle = viewTab === 'history' 
      ? 'Relatorio de Historico de Pagamentos Liquidados'
      : viewTab === 'monthly_folder'
        ? `Pasta de Pagamentos Mensais Arquivados - Mes ${selectedArchiveMonth}`
        : viewTab === 'reseller'
          ? 'Relatorio de Repasses de Revendedores Regionais Pendentes'
          : 'Relatorio de Comissoes de Rede MMN Pendentes';
    
    csvContent.push(`${reportTitle} - Gerado em ${new Date().toLocaleString('pt-BR')}`);
    csvContent.push('');

    if (viewTab === 'history') {
      csvContent.push('Data;Beneficiario;CPF/CNPJ;Tipo;Categoria;Ciclo;Rendimento Bruto;INSS Retido (11%);Imposto de Renda Retido;Valor Liquido;Chave PIX;Status;Comprovante');
      filteredHistory.forEach(h => {
        csvContent.push([
          new Date(h.date).toLocaleDateString('pt-BR'),
          `"${h.userName}"`,
          `"${h.cpf}"`,
          h.isPJ ? 'PJ' : 'PF',
          h.categoryLabel,
          h.cycleLabel,
          `R$ ${(h.bruto || h.amount || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(h.inss || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(h.irrf || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(h.liquido !== undefined ? h.liquido : (h.amount || 0)).toFixed(2).replace('.', ',')}`,
          `"${h.pixKey}"`,
          h.status,
          h.receiptUrl || 'Sem comprovante'
        ].join(';'));
      });
    } else if (viewTab === 'monthly_folder') {
      csvContent.push('Mes Referencia;Periodo;Data Pagamento;Beneficiario;CPF;Tipo;Chave PIX;Total Bruto;INSS Retido;IRRF Retido;Valor Liquido;Status');
      filteredArchives.forEach(a => {
        csvContent.push([
          a.refMonth,
          `"${a.periodLabel}"`,
          `"${a.paymentDateLabel}"`,
          `"${a.userName}"`,
          `"${a.userCpf}"`,
          a.isPJ ? 'PJ' : 'PF',
          `"${a.userPixKey}"`,
          `R$ ${(a.totalBruto || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(a.inss || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(a.irrf || 0).toFixed(2).replace('.', ',')}`,
          `R$ ${(a.liquido || 0).toFixed(2).replace('.', ',')}`,
          a.status || 'PAID'
        ].join(';'));
      });
    } else {
      csvContent.push('Nivel;Pedido;Nome;Email;Tipo;Chave PIX;Status NF;Mensal Liquido;Anual Liquido;Total Liquido');
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
  const currentList = viewTab === 'history' 
    ? filteredHistory 
    : viewTab === 'monthly_folder'
      ? filteredArchives
      : filteredBalances;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = currentList.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(currentList.length / itemsPerPage);

  return (
    <AdminLayout 
      title="Gestão de Pagamentos" 
      subtitle="Central de pagamentos de comissões, repasses e auditoria fiscal com QR Code PIX"
    >
      <div className="p-6 md:p-10 lg:p-12 space-y-8">
        
        {/* Toggle das 4 Abas Principais */}
        <div className="flex flex-wrap bg-[#0a0e17] p-2 rounded-[2rem] border border-white/5 shadow-2xl w-full max-w-5xl gap-2">
          <button
            onClick={() => setViewTab('network')}
            className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt size={16} />
            Histórico (Auditoria)
          </button>

          <button
            onClick={() => setViewTab('monthly_folder')}
            className={`flex-1 min-w-[200px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'monthly_folder'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderArchive size={16} />
            Pasta Pagamentos Mensais
          </button>
        </div>

        {/* Bloco de Métricas (Aparece para Afiliados e Revendedores) */}
        {(viewTab === 'network' || viewTab === 'reseller') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
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
            {(viewTab === 'network' || viewTab === 'reseller') && (
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

            {/* Subfiltro de Mês para Pasta de Pagamentos Mensais */}
            {viewTab === 'monthly_folder' && (
              <div className="flex items-center gap-2 bg-[#0a0e17] px-3 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Mês de Referência:</span>
                <input
                  type="month"
                  value={selectedArchiveMonth}
                  onChange={(e) => {
                    setSelectedArchiveMonth(e.target.value);
                    loadArchives(e.target.value);
                  }}
                  className="bg-slate-900 text-white border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}
          </div>

          {/* Botões de Ação: Programação Pix Dia 10, Exportar CSV e Imprimir */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {(viewTab === 'network' || viewTab === 'reseller') && (
              <>
                <button
                  onClick={handleExportScheduledPixCSV}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                  title="Exportar CSV com chave PIX e valor líquido para programar pagamento do dia 10"
                >
                  <FileSpreadsheet size={15} />
                  Programação PIX Dia 10
                </button>
                <button
                  onClick={handleExportConsolidatedCSV}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                  title="Exportar CSV Consolidado (Rede MMN + Revendedor) para programação bancária do dia 10"
                >
                  <FileSpreadsheet size={15} />
                  Resumo Consolidado (CSV)
                </button>
              </>
            )}

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
        {(viewTab === 'network' || viewTab === 'reseller') && (
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

                      {/* Demonstrativo Líquido Oficial & Resumo Consolidado */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenStatementModal(w)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          title="Visualizar demonstrativo idêntico à planilha oficial com deduções fiscais"
                        >
                          <FileSpreadsheet size={13} />
                          Ver Informativo Líquido
                        </button>
                        <button
                          onClick={() => handleOpenConsolidatedModal(w)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                          title="Abrir modal com o cartão consolidado de MMN e Revendedor (Financeiro Resumo)"
                        >
                          <BarChart3 size={13} />
                          Ver Financeiro Resumo
                        </button>
                      </div>
                    </div>

                    {/* Blocos de Valores por Ciclo */}
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-white/5">
                      
                      {/* 1. Mensal (Exige NF) */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center min-w-[130px]">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mb-1">
                          Mensal Líquido
                        </span>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.monthlyLiquid || 0).toFixed(2).replace('.', ',')}
                        </span>
                        {!w.isPJ && (w.monthlyPending || 0) > 0 && (
                          <span className="text-[8px] text-slate-400 block mt-0.5" title={`Bruto: R$ ${w.monthlyPending.toFixed(2)} | INSS: -R$ ${w.monthlyInss.toFixed(2)} | IRRF: -R$ ${w.monthlyIrrf.toFixed(2)}`}>
                            Bruto: R$ {(w.monthlyPending || 0).toFixed(2).replace('.', ',')}
                          </span>
                        )}
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
                            Anual (Bruto)
                          </span>
                          {!isDecemberAnnualWindow && (
                            <span title="Bloqueado até 10 de Dezembro">
                              <Lock size={10} className="text-amber-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.annualPending || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          disabled={!w.isEligible || (w.annualPending || 0) <= 0 || !isDecemberAnnualWindow}
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

                      {/* 4. Total Consolidado (Liberado Hoje: Mensal apurado no mês com NF) */}
                      {(() => {
                        const liquidPayableToday = w.liberadoLiquid !== undefined 
                          ? w.liberadoLiquid 
                          : (w.canPayMonthly ? (w.monthlyLiquid || 0) : 0);
                        const grossPayableToday = w.liberadoPending !== undefined
                          ? w.liberadoPending
                          : (w.canPayMonthly ? (w.monthlyPending || 0) : 0);

                        return (
                          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 p-4 rounded-2xl border border-indigo-500/30 text-center min-w-[150px]">
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider block mb-1">
                              Liberado Hoje
                            </span>
                            <span className="text-xl font-black text-amber-400 font-mono block">
                              R$ {liquidPayableToday.toFixed(2).replace('.', ',')}
                            </span>
                            {!w.isPJ && grossPayableToday > 0 && (
                              <div className="text-[8px] text-slate-400 mt-1 space-y-0.5">
                                <span className="block font-medium">Bruto: R$ {grossPayableToday.toFixed(2).replace('.', ',')}</span>
                                <span className="block text-amber-300/80">INSS: -R$ {(w.liberadoInss || 0).toFixed(2).replace('.', ',')}</span>
                                {(w.liberadoIrrf || 0) > 0 && (
                                  <span className="block text-rose-300/80">IRRF: -R$ {(w.liberadoIrrf || 0).toFixed(2).replace('.', ',')}</span>
                                )}
                              </div>
                            )}
                            {w.isPJ && grossPayableToday > 0 && (
                              <span className="text-[8px] text-blue-300 font-bold block mt-1">
                                PJ Isento
                              </span>
                            )}
                            {!isDecemberAnnualWindow && (w.annualPending || 0) > 0 && (
                              <span className="text-[8px] text-slate-400 block mt-1 font-medium">
                                + R$ {(w.annualPending || 0).toFixed(2).replace('.', ',')} em 10/Dez
                              </span>
                            )}
                            <button
                              disabled={!w.isEligible || liquidPayableToday <= 0}
                              onClick={() => handleOpenPaymentModal(w, 'total')}
                              className="mt-2 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                            >
                              Pagar Liberados
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
          <div className="space-y-6">
            {/* Cards de Resumo Fiscal da Auditoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl">
                  Σ
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendimento Bruto</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    R$ {totalHistoryBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Receipt size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">INSS Retido (11%)</p>
                  <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    - R$ {totalHistoryInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Imposto de Renda Retido</p>
                  <h3 className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                    - R$ {totalHistoryIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Líquido Pago</p>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    R$ {totalHistoryLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Auditoria de Pagamentos Liquidados
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Registros oficiais de baixas realizadas via PIX com comprovantes, retenções de INSS e Imposto de Renda.
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
                        <th className="py-4 px-3">Data / Hora</th>
                        <th className="py-4 px-3">Beneficiário</th>
                        <th className="py-4 px-3 text-center">Tipo</th>
                        <th className="py-4 px-3">Categoria</th>
                        <th className="py-4 px-3">Ciclo</th>
                        <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                        <th className="py-4 px-3 text-right">INSS (11%)</th>
                        <th className="py-4 px-3 text-right">Imposto de Renda Retido</th>
                        <th className="py-4 px-3 text-right">Valor Líquido</th>
                        <th className="py-4 px-3">Chave PIX</th>
                        <th className="py-4 px-3 text-center">Comprovante</th>
                        <th className="py-4 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedList.map((h: any) => (
                        <tr key={h.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 text-slate-400 font-mono whitespace-nowrap">
                            {new Date(h.date).toLocaleDateString('pt-BR')} às {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-white uppercase">{h.userName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">CPF: {h.cpf}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            {h.isPJ ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                PJ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                PF
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              h.categoryLabel === 'Revendedor Regional' 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {h.categoryLabel}
                            </span>
                          </td>
                          <td className="py-4 px-3 font-bold text-slate-300 whitespace-nowrap">
                            {h.cycleLabel}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                            R$ {(h.bruto || h.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                            {(h.inss || 0) > 0 ? `- R$ ${(h.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                            {(h.irrf || 0) > 0 ? `- R$ ${(h.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                            R$ {(h.liquido !== undefined ? h.liquido : (h.amount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {h.pixKey}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
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
                          <td className="py-4 px-3 text-center whitespace-nowrap">
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
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: PASTA DE PAGAMENTOS MENSAIS ARQUIVADOS */}
        {viewTab === 'monthly_folder' && (
          <div className="space-y-6">
            {/* Cards de Métricas do Mês Selecionado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl">
                  Σ
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendimento Bruto</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    R$ {totalArchiveBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Receipt size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">INSS Retido</p>
                  <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    - R$ {totalArchiveInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">IRRF Retido</p>
                  <h3 className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                    - R$ {totalArchiveIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Líquido Liquidado</p>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    R$ {totalArchiveLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <FolderArchive size={20} className="text-amber-400" />
                    Pasta de Pagamentos Mensais: {selectedArchiveMonth}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Histórico definitivo dos pagamentos consolidados do mês com comprovantes e demonstrativos fiscais.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    Total Arquivados: {filteredArchives.length}
                  </span>
                </div>
              </div>

              {loadingArchives ? (
                <div className="py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando pasta de pagamentos...</p>
                </div>
              ) : filteredArchives.length === 0 ? (
                <div className="py-20 text-center">
                  <FolderArchive size={48} className="text-slate-600 mx-auto mb-4 opacity-40" />
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhum pagamento arquivado neste mês</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Os pagamentos finalizados pela administração para o mês {selectedArchiveMonth} serão arquivados aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="py-4 px-3">Período / Previsão</th>
                        <th className="py-4 px-3">Beneficiário</th>
                        <th className="py-4 px-3 text-center">Tipo</th>
                        <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                        <th className="py-4 px-3 text-right">INSS (11%)</th>
                        <th className="py-4 px-3 text-right">IRRF Retido</th>
                        <th className="py-4 px-3 text-right">Valor Líquido</th>
                        <th className="py-4 px-3">Chave PIX</th>
                        <th className="py-4 px-3 text-center">Comprovante</th>
                        <th className="py-4 px-3 text-center">Demonstrativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedList.map((a: any) => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-300 font-mono text-[11px]">{a.periodLabel}</span>
                              <span className="text-[10px] text-amber-400 font-mono">Pgto: {a.paymentDateLabel}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-white uppercase">{a.userName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">CPF: {a.userCpf}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            {a.isPJ ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                PJ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                PF
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                            R$ {(a.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                            {(a.inss || 0) > 0 ? `- R$ ${(a.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                            {(a.irrf || 0) > 0 ? `- R$ ${(a.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                            R$ {(a.liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {a.userPixKey}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            {a.receiptUrl ? (
                              <a 
                                href={a.receiptUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-black text-[9px] uppercase tracking-wider transition-colors"
                              >
                                <FileText size={12} /> Recibo PIX
                              </a>
                            ) : (
                              <span className="text-[9px] text-slate-600 font-bold uppercase">---</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleOpenArchivedStatementModal(a)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet size={12} /> Ver Informativo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE DEMONSTRATIVO OFICIAL: VALOR LÍQUIDO IDÊNTICO À PLANILHA */}
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0f1523] border border-amber-500/30 w-full max-w-4xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative space-y-6 my-8">
              <button
                onClick={() => {
                  setIsStatementModalOpen(false);
                  setStatementData(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {loadingStatement || !statementData ? (
                <div className="py-24 text-center">
                  <Loader2 size={40} className="animate-spin text-amber-400 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando demonstrativo oficial...</p>
                </div>
              ) : (
                <div className="space-y-6 print:p-0">
                  {/* Cabeçalho do Demonstrativo */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        Informativo Oficial de Pagamento
                      </span>
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-2">
                        REPASSE MENSAL DE REDE MMN - AFILIADO
                      </h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {statementData.periodLabel} • DATA DO PAGAMENTO: {statementData.paymentDateLabel}
                      </p>
                    </div>

                    {/* Box Beneficiário */}
                    <div className="bg-[#0a0e17] border border-white/10 rounded-2xl p-4 text-xs">
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Beneficiário:</div>
                      <div className="font-black text-white text-sm uppercase">{statementData.user?.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX:</span>
                        <span className="font-mono font-black text-amber-400">{statementData.user?.pixKey}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        {statementData.user?.isPJ ? 'Pessoa Jurídica (Isento de INSS e IRRF)' : 'Pessoa Física (Retenção Tributária Oficial)'}
                      </div>
                    </div>
                  </div>

                  {/* Grid de 4 Cards Principais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card 1: Mensal */}
                    <div className="bg-[#0a0e17] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Cashback Mensal
                        </span>
                        <Wallet size={16} className="text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-mono text-white">
                          R$ {(statementData.mensalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-medium uppercase">Rede MMN (G0 ao G2)</span>
                      </div>
                    </div>

                    {/* Card 2: Anual */}
                    <div className="bg-[#0a0e17] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                          Cashback Anual
                        </span>
                        <Calendar size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-mono text-blue-400">
                          {statementData.isAnnualPaymentCycle && (statementData.anualBruto || 0) > 0
                            ? `R$ ${(statementData.anualBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-medium uppercase">
                          {statementData.isAnnualPaymentCycle ? 'Ciclo 10 de Dezembro' : 'Acumulando p/ 10.12'}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Total Bruto */}
                    <div className="bg-[#0a0e17] p-5 rounded-2xl border border-amber-500/20 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                          Total Bruto
                        </span>
                        <FileText size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-mono text-white">
                          R$ {(statementData.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                        <span className="text-[9px] text-amber-400/80 font-medium uppercase">Base de Remuneração</span>
                      </div>
                    </div>

                    {/* Card 4: Líquido */}
                    <div className="bg-gradient-to-br from-emerald-950/80 to-[#0a0e17] p-5 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                          Líquido a Receber
                        </span>
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-mono text-emerald-400">
                          R$ {(statementData.liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                        <span className="text-[9px] text-emerald-300 font-medium uppercase">Transferência PIX</span>
                      </div>
                    </div>

                  </div>

                  {/* Alerta de Nota Fiscal */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                      <span>EMITIR NOTA FISCAL NO TOTAL BRUTO ATÉ 05/{statementData.refMonth ? statementData.refMonth.split('-')[1] : '00'}/{statementData.refMonth ? statementData.refMonth.split('-')[0] : '0000'}</span>
                    </div>
                    <span className="font-mono text-white">
                      R$ {(statementData.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Card com Detalhamento de Apuração Tributária */}
                  <div className="bg-[#0a0e17] rounded-2xl border border-white/5 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-300 font-bold uppercase">Cashback mensal da Rede de MMN (G0 AO G2)</span>
                      <span className="font-mono font-black text-white">
                        R$ {(statementData.mensalMmnBruto !== undefined ? statementData.mensalMmnBruto : (statementData.mensalBruto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-300 font-bold uppercase">Cashback mensal do Revendedor</span>
                      <span className="font-mono font-black text-white">
                        R$ {(statementData.mensalRevendedorBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-300 font-bold uppercase">Cashback anual AFILIADO {statementData.annualPeriodLabel ? `(${statementData.annualPeriodLabel})` : '(10 de Dezembro)'}</span>
                      <span className="font-mono font-black text-rose-400">
                        {statementData.isAnnualPaymentCycle && ((statementData.anualMmnBruto !== undefined ? statementData.anualMmnBruto : statementData.anualBruto) || 0) > 0
                          ? `R$ ${((statementData.anualMmnBruto !== undefined ? statementData.anualMmnBruto : statementData.anualBruto) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-300 font-bold uppercase">Cashback anual REVENDEDOR {statementData.annualPeriodLabel ? `(${statementData.annualPeriodLabel})` : '(10 de Dezembro)'}</span>
                      <span className="font-mono font-black text-rose-400">
                        {statementData.isAnnualPaymentCycle && (statementData.anualRevendedorBruto || 0) > 0
                          ? `R$ ${(statementData.anualRevendedorBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                      <span className="text-white font-black uppercase tracking-wider">TOTAL BRUTO</span>
                      <span className="font-mono font-black text-white text-sm">
                        R$ {(statementData.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <span className="text-slate-300 font-bold uppercase block">INSS (Teto de R$ 8.475,55 * 11% = R$ 932,31)</span>
                        <span className="text-[9px] text-slate-500">{statementData.user?.isPJ ? 'Isento (PJ)' : 'Teto INSS aplicado'}</span>
                      </div>
                      <span className={`font-mono font-black ${statementData.user?.isPJ ? 'text-slate-400' : 'text-rose-400'}`}>
                        {(statementData.inss || 0) > 0 ? `- R$ ${(statementData.inss || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-300 font-bold uppercase">BASE DE CÁLCULO DO IRPF (BRUTO - INSS)</span>
                      <span className="font-mono font-black text-slate-300">
                        R$ {(statementData.baseIRPF || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div>
                        <span className="text-emerald-300 font-bold uppercase block">IRRF - CONFORME TABELA DO CONTADOR</span>
                        <span className="text-[9px] text-emerald-400/70">Tabela progressiva da Receita Federal</span>
                      </div>
                      <span className={`font-mono font-black ${(statementData.irrf || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(statementData.irrf || 0) > 0 ? `- R$ ${(statementData.irrf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Isento'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                      <div>
                        <span className="text-sm font-black uppercase tracking-wider block">LÍQUIDO A RECEBER</span>
                        <span className="text-[10px] text-emerald-100">Transferência PIX Dia {statementData.paymentDateLabel}</span>
                      </div>
                      <span className="font-mono font-black text-xl text-white">
                        R$ {(statementData.liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Ações do Modal */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Printer size={15} /> Imprimir / Salvar PDF
                      </button>
                      {statementData.receiptUrl && (
                        <a
                          href={statementData.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                          <FileText size={15} /> Ver Comprovante PIX
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setIsStatementModalOpen(false);
                        setStatementData(null);
                      }}
                      className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: RESUMO CONSOLIDADO (MMN + REVENDEDOR) */}
        {isConsolidatedModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative text-midnight">
              
              {/* Botão Fechar no Topo */}
              <button
                onClick={() => {
                  setIsConsolidatedModalOpen(false);
                  setConsolidatedData(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-midnight transition-all cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>

              {loadingConsolidated ? (
                <div className="py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-primary-blue mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando resumo financeiro...</p>
                </div>
              ) : consolidatedData ? (
                <div className="space-y-6">
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100 pr-10">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full">
                        Resumo do Pagamento
                      </span>
                      <h3 className="text-lg md:text-xl font-black text-midnight uppercase tracking-tight mt-2">
                        REPASSE MENSAL DE REDE MMN - AFILIADO/REVENDEDOR
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        PERÍODO DE {consolidatedData.periodoStr} • PREVISÃO DE PAGAMENTO DIA {consolidatedData.previsaoPagamentoStr}
                      </p>
                    </div>

                    {/* Box Beneficiário */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs shrink-0 min-w-[240px]">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Beneficiário:</div>
                      <div className="font-black text-midnight text-sm uppercase">{consolidatedData.beneficiaryName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX:</span>
                        <span className="font-mono font-black text-slate-800">{consolidatedData.pixKey}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1">
                        {consolidatedData.isPJ ? 'Pessoa Jurídica (Isento de INSS e IRRF)' : 'Pessoa Física (Retenção Tributária Oficial)'}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Nota Fiscal (Amarelo) */}
                  <div className="bg-amber-100 border border-amber-300/80 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={20} className="text-amber-700 shrink-0" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                        EMITIR NOTA FISCAL NO TOTAL BRUTO ATÉ {consolidatedData.limiteNotaFiscalStr}
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm sm:text-base text-amber-900 shrink-0">
                      {Number(consolidatedData.totalBruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Linhas Discriminatórias */}
                  <div className="space-y-2 text-xs md:text-sm">
                    {/* 1. Cashback Mensal MMN */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">CASHBACK MENSAL DA REDE DE MMN (G0 AO G2)</span>
                        <span className="text-[10px] text-slate-400">Comissões de rede ativas apuradas no período</span>
                      </div>
                      <span className="font-mono font-black text-midnight">
                        {Number(consolidatedData.brutoMensalMmn || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 2. Cashback Mensal Revendedor */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">CASHBACK MENSAL DO REVENDEDOR</span>
                        <span className="text-[10px] text-slate-400">Comissões de vendas diretas e revenda regional</span>
                      </div>
                      <span className="font-mono font-black text-midnight">
                        {Number(consolidatedData.brutoMensalRevendedor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 3. Cashback Anual Afiliado */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">
                          CASHBACK ANUAL AFILIADO PERIODO {consolidatedData.annualPeriodLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {consolidatedData.isDecemberAnnualPayout 
                            ? 'Acumulado anual liberado no ciclo de 10 de Dezembro'
                            : 'Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-red-600">
                        {consolidatedData.brutoAnualMmn > 0 
                          ? Number(consolidatedData.brutoAnualMmn).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </span>
                    </div>

                    {/* 4. Cashback Anual Revendedor */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">
                          CASHBACK ANUAL REVENDEDOR PERIODO {consolidatedData.annualPeriodLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {consolidatedData.isDecemberAnnualPayout 
                            ? 'Acumulado anual de revenda liberado no ciclo de 10 de Dezembro'
                            : 'Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-red-600">
                        {consolidatedData.brutoAnualRevendedor > 0 
                          ? Number(consolidatedData.brutoAnualRevendedor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </span>
                    </div>

                    {/* 5. TOTAL BRUTO */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                      <span className="font-black text-midnight uppercase tracking-wider">
                        TOTAL BRUTO
                      </span>
                      <span className="font-mono font-black text-midnight text-base">
                        {Number(consolidatedData.totalBruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 6. INSS */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">
                          INSS (TETO DE R$ 8.475,55 * 11% = R$ 932,31)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {consolidatedData.isPJ ? 'Pessoa Jurídica isenta de retenção previdenciária' : 'Retenção obrigatória Pessoa Física (INSS)'}
                        </span>
                      </div>
                      <span className={`font-mono font-black ${consolidatedData.isPJ ? 'text-slate-500' : 'text-red-600'}`}>
                        {consolidatedData.isPJ 
                          ? 'Isento (PJ)' 
                          : Number(consolidatedData.inss || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 7. Base de Cálculo IRPF */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 uppercase block">
                          BASE DE CALCULO DO IRPF (BRUTO-INSS)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Base de apuração para aplicação da tabela progressiva
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-700">
                        {consolidatedData.isPJ 
                          ? 'Isento (PJ)' 
                          : Number(consolidatedData.baseIrrf || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 8. IRRF */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div>
                        <span className="font-bold text-emerald-950 uppercase block">
                          IRRF - CONFORME TABELA DO CONTADOR
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {consolidatedData.isPJ ? 'Isento para Pessoa Jurídica' : 'Retenção na Fonte conforme faixa de rendimentos da RFB'}
                        </span>
                      </div>
                      <span className={`font-mono font-black ${consolidatedData.isPJ || consolidatedData.irrf === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {consolidatedData.isPJ || consolidatedData.irrf === 0 
                          ? 'Isento' 
                          : Number(consolidatedData.irrf || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* 9. LÍQUIDO A RECEBER */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600 text-white shadow-lg mt-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Wallet size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider block">
                            LÍQUIDO A RECEBER
                          </span>
                          <span className="text-[10px] text-emerald-100 font-bold">
                            Disponível para saque e transferência PIX no dia {consolidatedData.previsaoPagamentoStr.split('.')[0]}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xl lg:text-2xl">
                        {Number(consolidatedData.liquido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                  </div>

                  {/* Ações do Modal */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Printer size={15} /> Imprimir / PDF
                    </button>
                    <button
                      onClick={() => {
                        setIsConsolidatedModalOpen(false);
                        setConsolidatedData(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : null}

            </div>
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
