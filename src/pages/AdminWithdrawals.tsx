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
  QrCode,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { 
  exportMonthlyPixExcel, 
  exportAnnualCashbackExcel, 
  exportBalancesExcel, 
  exportAdvancesExcel, 
  exportHistoryExcel, 
  exportMonthlyFolderExcel 
} from '../lib/excelExport';
import { toast } from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [payableBalances, setPayableBalances] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<'network' | 'reseller' | 'advances' | 'monthly_pix' | 'annual_cashback' | 'history' | 'monthly_folder'>('network');
  const [cycleFilter, setCycleFilter] = useState<'all' | 'monthly' | 'annual'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Advances State
  const [advanceRequestsList, setAdvanceRequestsList] = useState<any[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);

  // Relatório 1: Folha Mensal Dia 10 State
  const [monthlyPixList, setMonthlyPixList] = useState<any[]>([]);
  const [loadingMonthlyPix, setLoadingMonthlyPix] = useState(false);
  const [selectedMonthlyPixMonth, setSelectedMonthlyPixMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Relatório 2: Cashback Anual State
  const [annualCashbackList, setAnnualCashbackList] = useState<any[]>([]);
  const [loadingAnnualCashback, setLoadingAnnualCashback] = useState(false);
  const [selectedAnnualCycleYear, setSelectedAnnualCycleYear] = useState<number>(2025);
  const [annualMonthFilter, setAnnualMonthFilter] = useState<string>('all');

  // Tranca inteligente de data: Pagamento Anual é liberado exclusivamente em 10 de Dezembro
  const isDecemberAnnualWindow = useMemo(() => {
    const now = new Date();
    // 11 é Dezembro (0-indexado)
    return now.getMonth() === 11 && now.getDate() >= 10;
  }, []);

  // Tranca inteligente de data: Pagamento Mensal é liberado a partir do dia 10 de cada mês
  const isMonthlyPayoutWindow = useMemo(() => {
    const now = new Date();
    return now.getDate() >= 10;
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

  const loadAdvances = async () => {
    try {
      setLoadingAdvances(true);
      const data = await businessRules.getAffiliateAdvanceRequests();
      setAdvanceRequestsList(data);
    } catch (e) {
      console.error('Erro ao carregar adiantamentos:', e);
      toast.error('Erro ao carregar solicitações de adiantamento.');
    } finally {
      setLoadingAdvances(false);
    }
  };

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

  const loadMonthlyPix = async (targetMonth?: string) => {
    try {
      setLoadingMonthlyPix(true);
      const month = targetMonth || selectedMonthlyPixMonth;
      const data = await businessRules.getMonthlyPayoutReport(month);
      setMonthlyPixList(data);
    } catch (e) {
      console.error('Erro ao carregar folha mensal PIX:', e);
      toast.error('Erro ao carregar folha de pagamento do dia 10.');
    } finally {
      setLoadingMonthlyPix(false);
    }
  };

  const loadAnnualCashback = async (cycleYear?: number) => {
    try {
      setLoadingAnnualCashback(true);
      const yr = cycleYear !== undefined ? cycleYear : selectedAnnualCycleYear;
      const data = await businessRules.getAnnualCashbackReport(yr);
      setAnnualCashbackList(data);
    } catch (e) {
      console.error('Erro ao carregar relatório anual:', e);
      toast.error('Erro ao carregar relatório de cashback anual.');
    } finally {
      setLoadingAnnualCashback(false);
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
        mensalBruto: (statement.brutoMensalMmn || 0) + (statement.brutoMensalRevendedor || 0),
        anualBruto: (statement.brutoAnualMmn || 0) + (statement.brutoAnualRevendedor || 0),
        annualPeriodLabel: statement.annualPeriodLabel,
        isAnnualPaymentCycle: statement.isDecemberAnnualPayout,
        totalBruto: statement.totalBruto,
        inss: statement.inss,
        baseIRPF: statement.baseIrrf,
        irrf: statement.irrf,
        adiantamento: statement.adiantamento,
        adiantamentoDate: statement.adiantamentoDate,
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

  const handleOpenArchivedStatementModal = async (archivedRecord: any) => {
    try {
      setLoadingStatement(true);
      setIsStatementModalOpen(true);
      const uid = archivedRecord.userId || archivedRecord.profileId || archivedRecord.profile_id;
      const refM = archivedRecord.refMonth || selectedArchiveMonth;
      const [yStr, mStr] = (refM || '').split('-');
      const yNum = parseInt(yStr, 10) || new Date().getFullYear();
      const mNum = parseInt(mStr, 10) || (new Date().getMonth() + 1);

      const statement = await businessRules.getConsolidatedFinancialStatement(uid, yNum, mNum);
      if (statement && (statement.beneficiaryName || statement.totalBruto > 0 || statement.liquido > 0)) {
        setStatementData({
          ...statement,
          refMonth: statement.refMonth || refM,
          periodLabel: `PERÍODO DE ${statement.periodoStr || archivedRecord.periodLabel || ''}`,
          paymentDateLabel: statement.previsaoPagamentoStr || archivedRecord.paymentDateLabel || '',
          user: {
            id: statement.userId || uid,
            name: statement.beneficiaryName || archivedRecord.userName || 'Afiliado Autônomo',
            cpf: statement.cpfCnpj || archivedRecord.userCpf || '',
            pixKey: statement.pixKey || archivedRecord.userPixKey || '',
            isPJ: statement.isPJ ?? archivedRecord.isPJ ?? false
          },
          mensalMmnBruto: statement.brutoMensalMmn || 0,
          mensalRevendedorBruto: statement.brutoMensalRevendedor || 0,
          anualMmnBruto: statement.brutoAnualMmn || 0,
          anualRevendedorBruto: statement.brutoAnualRevendedor || 0,
          mensalBruto: (statement.brutoMensalMmn || 0) + (statement.brutoMensalRevendedor || 0) || Math.abs(archivedRecord.mensalBruto || archivedRecord.totalBruto || 0),
          anualBruto: (statement.brutoAnualMmn || 0) + (statement.brutoAnualRevendedor || 0),
          totalBruto: statement.totalBruto || Math.abs(archivedRecord.totalBruto || 0),
          inss: statement.inss || archivedRecord.inss || 0,
          baseIRPF: statement.baseIrrf || Math.max(0, (statement.totalBruto || 0) - (statement.inss || 0)),
          irrf: statement.irrf || archivedRecord.irrf || 0,
          liquido: statement.liquido || Math.abs(archivedRecord.liquido || 0),
          adiantamento: Math.abs(statement.adiantamento || archivedRecord.adiantamento || 0),
          receiptUrl: archivedRecord.receiptUrl || statement.receiptUrl || null,
          status: 'Pago'
        });
      } else {
        // Fallback usando o próprio registro arquivado com valores absolutos e formatados
        const absBruto = Math.abs(archivedRecord.totalBruto || archivedRecord.mensalBruto || archivedRecord.liquido || 0);
        const absLiq = Math.abs(archivedRecord.liquido !== undefined ? archivedRecord.liquido : absBruto);
        setStatementData({
          refMonth: refM,
          periodLabel: archivedRecord.periodLabel || `PERÍODO DE 01.${mStr} a 30.${mStr}.${yStr}`,
          paymentDateLabel: archivedRecord.paymentDateLabel || `10.${String(mNum === 12 ? 1 : mNum + 1).padStart(2, '0')}.${mNum === 12 ? yNum + 1 : yNum}`,
          user: {
            id: uid,
            name: archivedRecord.userName || archivedRecord.affiliateName || 'Afiliado Autônomo',
            cpf: archivedRecord.userCpf || archivedRecord.cpfCnpj || '',
            pixKey: archivedRecord.userPixKey || archivedRecord.pixKey || '',
            isPJ: archivedRecord.isPJ ?? false
          },
          mensalBruto: absBruto,
          totalBruto: absBruto,
          inss: Math.abs(archivedRecord.inss || 0),
          baseIRPF: Math.max(0, absBruto - Math.abs(archivedRecord.inss || 0)),
          irrf: Math.abs(archivedRecord.irrf || 0),
          liquido: absLiq,
          receiptUrl: archivedRecord.receiptUrl || null,
          status: 'Pago'
        });
      }
    } catch (e) {
      console.error("Erro ao carregar demonstrativo arquivado:", e);
      const absBruto = Math.abs(archivedRecord.totalBruto || archivedRecord.liquido || 0);
      setStatementData({
        refMonth: archivedRecord.refMonth || selectedArchiveMonth,
        periodLabel: archivedRecord.periodLabel || 'Demonstrativo Mensal',
        paymentDateLabel: archivedRecord.paymentDateLabel || '10/00',
        user: {
          id: archivedRecord.userId,
          name: archivedRecord.userName || archivedRecord.affiliateName || 'Afiliado Autônomo',
          cpf: archivedRecord.userCpf || '',
          pixKey: archivedRecord.userPixKey || '',
          isPJ: archivedRecord.isPJ ?? false
        },
        mensalBruto: absBruto,
        totalBruto: absBruto,
        inss: 0,
        baseIRPF: absBruto,
        irrf: 0,
        liquido: Math.abs(archivedRecord.liquido || absBruto),
        receiptUrl: archivedRecord.receiptUrl || null,
        status: 'Pago'
      });
    } finally {
      setLoadingStatement(false);
    }
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
    } else if (viewTab === 'advances') {
      loadAdvances();
    } else if (viewTab === 'monthly_pix') {
      loadMonthlyPix(selectedMonthlyPixMonth);
    } else if (viewTab === 'annual_cashback') {
      loadAnnualCashback(selectedAnnualCycleYear);
    } else {
      loadBalances(viewTab);
    }
    setCurrentPage(1);
  }, [viewTab, selectedArchiveMonth, selectedMonthlyPixMonth, selectedAnnualCycleYear]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleOpenAdvancePaymentModal = (adv: any) => {
    if (!adv) return;
    const numAmount = Number(adv.amount || 0);
    const record = {
      payeeId: adv.profile_id,
      payeeName: adv.user_name || 'Afiliado',
      payeeCpf: adv.cpf || '',
      payeePixKey: adv.pix_key || adv.cpf || '',
      payeeWhatsapp: adv.whatsapp || '',
      orderId: `ADV-${adv.id ? String(adv.id).substring(0, 6) : '001'}`,
      repasse: numAmount,
      bruto: numAmount,
      inss: 0,
      irrf: 0,
      is_pj: false,
      payoutType: 'mensal',
      viewCategory: 'advances',
      descLabel: 'Adiantamento Mensal de Rendimentos',
      advanceId: adv.id
    };
    setSelectedForPayment([record]);
    setIsPaymentModalOpen(true);
  };

  const handleRejectAdvance = async (advId: string) => {
    const reason = window.prompt('Informe o motivo da recusa do adiantamento:');
    if (reason === null) return;
    try {
      await businessRules.rejectAdvanceRequest(advId, reason);
      toast.success('Solicitação de adiantamento recusada.');
      loadAdvances();
    } catch (e) {
      toast.error('Erro ao recusar adiantamento.');
    }
  };

  // Abrir PaymentModal para pagamento individual de um ciclo ou total
  const handleOpenPaymentModal = (userItem: any, payoutType: 'mensal' | 'anual' | 'total') => {
    if (!userItem.isEligible) {
      toast.error('Usuário inadimplente: pagamentos bloqueados até a regularização do plano.');
      return;
    }

    if (payoutType === 'mensal' && !isMonthlyPayoutWindow) {
      toast.error('Pagamento Mensal bloqueado: liberado a partir do dia 10 de cada mês!');
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
      if ((userItem.monthlyLiquid || 0) <= 0 || (userItem.monthlyPending || 0) <= 0) {
        toast.error('Este repasse mensal já foi quitado/adiantado e não possui saldo pendente.');
        return;
      }
      if (userItem.hasPendingAdvance) {
        toast.error('Este usuário possui uma solicitação de adiantamento pendente. Processe-a na aba Adiantamentos.');
        return;
      }
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

  // Abrir PaymentModal para pagamento individual de item do Relatório de Cashback Anual
  const handleOpenAnnualPaymentModal = (annualItem: any) => {
    const amountToPay = Number(annualItem.liquidoReceber || annualItem.totalBruto || 0);
    if (amountToPay <= 0) {
      toast.error('Valor líquido de pagamento zerado.');
      return;
    }

    const record = {
      payeeId: annualItem.fullId,
      payeeName: annualItem.name,
      payeeCpf: annualItem.chavePix?.includes('@') ? '' : annualItem.chavePix,
      payeePixKey: annualItem.chavePix,
      payeeWhatsapp: '',
      orderId: `ANUAL-${annualItem.refMonth}-${annualItem.id}`,
      repasse: amountToPay,
      bruto: Number(annualItem.totalBruto || 0),
      inss: 0,
      irrf: Number(annualItem.descontoIrpf || 0),
      is_pj: annualItem.isPJ,
      payoutType: 'anual',
      viewCategory: 'network',
      descLabel: `Cashback Anual (${annualItem.mesReferencia})`,
      splitDetails: {
        annual: {
          bruto: Number(annualItem.totalBruto || 0),
          inss: 0,
          irrf: Number(annualItem.descontoIrpf || 0),
          liquido: amountToPay
        }
      }
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

      if (record.advanceId) {
        await businessRules.processAdvancePayout(record.advanceId, receiptUrl);
        toast.success(`Adiantamento de R$ ${record.repasse.toFixed(2).replace('.', ',')} liquidado com sucesso!`);
        setIsPaymentModalOpen(false);
        await loadAdvances();
        await loadBalances(viewTab);
        return;
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
      } else if (viewTab === 'monthly_pix') {
        await loadMonthlyPix(selectedMonthlyPixMonth);
      } else if (viewTab === 'annual_cashback') {
        await loadAnnualCashback(selectedAnnualCycleYear);
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

  // Filtragem de Relatório 1: Folha Mensal Dia 10
  const filteredMonthlyPix = useMemo(() => {
    return monthlyPixList.filter(item => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        item.userName?.toLowerCase().includes(q) ||
        item.cpfCnpj?.toLowerCase().includes(q) ||
        item.pixKey?.toLowerCase().includes(q) ||
        item.bankDetails?.toLowerCase().includes(q)
      );
    });
  }, [monthlyPixList, searchTerm]);

  // Filtragem de Relatório 2: Cashback Anual
  const filteredAnnualCashback = useMemo(() => {
    return annualCashbackList.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        item.name?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q) ||
        item.chavePix?.toLowerCase().includes(q);

      const matchesMonth = 
        annualMonthFilter === 'all' ||
        item.refMonth === annualMonthFilter ||
        item.mesReferencia?.toLowerCase().includes(annualMonthFilter.toLowerCase());

      return matchesSearch && matchesMonth;
    });
  }, [annualCashbackList, searchTerm, annualMonthFilter]);

  // Lista de meses únicos para o filtro do relatório anual
  const availableAnnualMonths = useMemo(() => {
    const map = new Map<string, string>();
    annualCashbackList.forEach(item => {
      if (item.refMonth && item.mesReferencia) {
        map.set(item.refMonth, item.mesReferencia);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [annualCashbackList]);

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

  // Totais de Relatório 1: Folha Mensal Dia 10
  const totalMonthlyPixCashback = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.cashbackMensal || 0), 0);
  const totalMonthlyPixAnualAcum = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.cashbackAnualAcumulado || 0), 0);
  const totalMonthlyPixBruto = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.totalBruto || 0), 0);
  const totalMonthlyPixInss = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.inss || 0), 0);
  const totalMonthlyPixIrrf = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.irrf || 0), 0);
  const totalMonthlyPixAdiantamentos = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.adiantamentos || 0), 0);
  const totalMonthlyPixLiquido = filteredMonthlyPix.reduce((acc, curr) => acc + (curr.liquidoPix || 0), 0);

  // Totais de Relatório 2: Cashback Anual
  const totalAnnualCashAfiliado = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.cashAfiliado || 0), 0);
  const totalAnnualCashRevendedor = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.cashRevendedor || 0), 0);
  const totalAnnualBruto = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.totalBruto || 0), 0);
  const totalAnnualBaseIrpf = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.baseIrpf || 0), 0);
  const totalAnnualDescontoIrpf = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.descontoIrpf || 0), 0);
  const totalAnnualLiquidoReceber = filteredAnnualCashback.reduce((acc, curr) => acc + (curr.liquidoReceber || 0), 0);

  // Exportar Excel Formatado (.xlsx) com Design Profissional
  const handleExportExcel = async () => {
    try {
      if (viewTab === 'monthly_pix') {
        if (filteredMonthlyPix.length === 0) {
          toast.error('Nenhum registro encontrado para exportar.');
          return;
        }
        await exportMonthlyPixExcel(filteredMonthlyPix, selectedMonthlyPixMonth);
        toast.success('Planilha Excel Oficial de Pagamento PIX gerada com sucesso!');
        return;
      }

      if (viewTab === 'annual_cashback') {
        if (filteredAnnualCashback.length === 0) {
          toast.error('Nenhum registro encontrado para exportar.');
          return;
        }
        const label = selectedAnnualCycleYear === 2025 ? '01.11.25 A 30.11.26' : `01.11.${selectedAnnualCycleYear} A 30.11.${selectedAnnualCycleYear + 1}`;
        await exportAnnualCashbackExcel(filteredAnnualCashback, label);
        toast.success('Planilha Excel Oficial de Cashback Anual gerada com sucesso!');
        return;
      }

      if (viewTab === 'network' || viewTab === 'reseller') {
        if (filteredBalances.length === 0) {
          toast.error('Nenhum saldo pendente para exportar.');
          return;
        }
        await exportBalancesExcel(filteredBalances, viewTab);
        toast.success(`Planilha Excel de ${viewTab === 'reseller' ? 'Revendedores' : 'Afiliados'} gerada com sucesso!`);
        return;
      }

      if (viewTab === 'advances') {
        if (advanceRequestsList.length === 0) {
          toast.error('Nenhuma solicitação de adiantamento para exportar.');
          return;
        }
        await exportAdvancesExcel(advanceRequestsList);
        toast.success('Planilha Excel de Adiantamentos gerada com sucesso!');
        return;
      }

      if (viewTab === 'history') {
        if (filteredHistory.length === 0) {
          toast.error('Nenhum histórico para exportar.');
          return;
        }
        await exportHistoryExcel(filteredHistory);
        toast.success('Planilha Excel de Auditoria Fiscal gerada com sucesso!');
        return;
      }

      if (viewTab === 'monthly_folder') {
        if (filteredArchives.length === 0) {
          toast.error('Nenhum pagamento arquivado para exportar neste mês.');
          return;
        }
        await exportMonthlyFolderExcel(filteredArchives, selectedArchiveMonth);
        toast.success('Pasta de Pagamentos Mensais (Excel) gerada com sucesso!');
        return;
      }
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      toast.error('Erro ao gerar planilha Excel formatada.');
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (viewTab === 'monthly_pix') {
      if (filteredMonthlyPix.length === 0) {
        toast.error('Nenhum registro encontrado para exportar.');
        return;
      }
      businessRules.exportMonthlyPayoutReportCSV(filteredMonthlyPix, selectedMonthlyPixMonth);
      toast.success('Relatório Oficial de Pagamento PIX Dia 10 exportado com sucesso!');
      return;
    }

    if (viewTab === 'annual_cashback') {
      if (filteredAnnualCashback.length === 0) {
        toast.error('Nenhum registro encontrado para exportar.');
        return;
      }
      const label = selectedAnnualCycleYear === 2025 ? '01.11.25 A 30.11.26' : `01.11.${selectedAnnualCycleYear} A 30.11.${selectedAnnualCycleYear + 1}`;
      businessRules.exportAnnualCashbackReportCSV(filteredAnnualCashback, label);
      toast.success('Relatório Oficial de Cashback Anual exportado com sucesso!');
      return;
    }

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
      csvContent.push('Data;Beneficiario;CPF/CNPJ;Tipo;Categoria;Ciclo;Rendimento Bruto;INSS Retido (0%);Imposto de Renda Retido;Valor Liquido;Chave PIX;Status;Comprovante');
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

  const getReportTitleForPrint = () => {
    switch (viewTab) {
      case 'monthly_pix': return `Folha Oficial de Pagamentos PIX — Dia 10 (Competência ${selectedMonthlyPixMonth})`;
      case 'annual_cashback': return `Relatório de Cashback Anual a Pagar (Ciclo ${selectedAnnualCycleYear === 2025 ? '01/11/2025 a 30/11/2026' : `${selectedAnnualCycleYear} a ${selectedAnnualCycleYear + 1}`})`;
      case 'network': return 'Relatório de Comissões de Rede MMN';
      case 'reseller': return 'Relatório de Repasses de Revendedores Regionais';
      case 'advances': return 'Solicitações de Adiantamento Mensal de Rendimentos';
      case 'history': return 'Histórico Oficial de Pagamentos Liquidados (Auditoria Fiscal)';
      case 'monthly_folder': return `Pasta de Pagamentos Mensais Arquivados — Mês ${selectedArchiveMonth}`;
      default: return 'Relatório Financeiro de Pagamentos';
    }
  };

  const getReportPeriodForPrint = () => {
    switch (viewTab) {
      case 'monthly_pix': return `Competência ${selectedMonthlyPixMonth}`;
      case 'annual_cashback': return selectedAnnualCycleYear === 2025 ? '01/11/2025 a 30/11/2026' : `01/11/${selectedAnnualCycleYear} a 30/11/${selectedAnnualCycleYear + 1}`;
      case 'monthly_folder': return selectedArchiveMonth;
      default: return new Date().toLocaleDateString('pt-BR');
    }
  };

  // Paginação
  const currentList = viewTab === 'history' 
    ? filteredHistory 
    : viewTab === 'monthly_folder'
      ? filteredArchives
      : viewTab === 'monthly_pix'
        ? filteredMonthlyPix
        : viewTab === 'annual_cashback'
          ? filteredAnnualCashback
          : filteredBalances;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = currentList.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(currentList.length / itemsPerPage);

  return (
    <AdminLayout 
      title="Gestão de Pagamentos" 
      subtitle="Central de pagamentos de comissões, repasses e relatórios oficiais PIX e Cashback Anual"
    >
      {/* Estilos Globais de Impressão Exclusivos para a Página */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 8mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-table {
            display: table !important;
            width: 100% !important;
          }
          .print-paginated-hide {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 8.5pt !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            color: #0f172a !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: 800 !important;
            color: #0f172a !important;
          }
          tfoot tr {
            background-color: #e2e8f0 !important;
            font-weight: 900 !important;
          }
        }
      `}</style>

      <div className="p-6 md:p-10 lg:p-12 space-y-8 print:p-0 print:space-y-4">
        
        {/* TIMBRE OFICIAL DE IMPRESSÃO (Visível exclusivamente ao Imprimir / Salvar PDF) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black uppercase tracking-tight text-slate-950">
                  SERVIÇOS URBANOS TECNOLOGIA E ECONOMIA LTDA
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  CNPJ: 54.795.377/0001-00
                </span>
              </div>
              <p className="text-xs font-black uppercase text-indigo-900 mt-1">
                {getReportTitleForPrint()}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Central de Controle Financeiro • Sistema Integrado de Repasses e Auditoria Fiscal
              </p>
            </div>
            <div className="text-right text-[10px] space-y-0.5">
              <p className="font-bold text-slate-900">Período: <span className="font-mono">{getReportPeriodForPrint()}</span></p>
              <p className="text-slate-600">Emissão: <span className="font-mono">{new Date().toLocaleString('pt-BR')}</span></p>
              <p className="text-emerald-700 font-bold uppercase">Status: Relatório Oficial Consolidado</p>
            </div>
          </div>
        </div>

        {/* Toggle das Abas Principais (Oculto na Impressão) */}
        <div className="flex flex-wrap bg-[#0a0e17] p-2 rounded-[2rem] border border-white/5 shadow-2xl w-full gap-2 no-print">
          <button
            onClick={() => setViewTab('network')}
            className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'network'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Afiliados (MMN)
          </button>
          
          <button
            onClick={() => setViewTab('reseller')}
            className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'reseller'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={16} />
            Revendedores
          </button>

          <button
            onClick={() => setViewTab('advances')}
            className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'advances'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={16} />
            Adiantamentos ({advanceRequestsList.filter(a => a.status === 'pending').length})
          </button>

          {/* NOVO: Relatório 1 - Pagamentos do Dia 10 (Folha PIX) */}
          <button
            onClick={() => setViewTab('monthly_pix')}
            className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'monthly_pix'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={16} />
            Pagamentos Dia 10 (PIX)
          </button>

          {/* NOVO: Relatório 2 - Cashback Anual (10/Dez) */}
          <button
            onClick={() => setViewTab('annual_cashback')}
            className={`flex-1 min-w-[170px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'annual_cashback'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={16} />
            Cashback Anual (10/Dez)
          </button>

          <button
            onClick={() => setViewTab('history')}
            className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'history'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt size={16} />
            Histórico (Auditoria)
          </button>

          <button
            onClick={() => setViewTab('monthly_folder')}
            className={`flex-1 min-w-[170px] py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewTab === 'monthly_folder'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderArchive size={16} />
            Pasta Pagamentos
          </button>
        </div>

        {/* Bloco de Métricas (Aparece para Afiliados e Revendedores) */}
        {(viewTab === 'network' || viewTab === 'reseller') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 no-print">
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

        {/* Barra de Filtros, Busca e Ações de Exportação (Oculta na Impressão) */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between no-print">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Campo de Busca */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder={
                  viewTab === 'annual_cashback'
                    ? "Buscar por Nome, ID ou Chave PIX..."
                    : "Buscar por nome, CPF, e-mail ou chave PIX..."
                }
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

            {/* Subfiltro de Mês para Pagamentos Dia 10 (PIX) */}
            {viewTab === 'monthly_pix' && (
              <div className="flex items-center gap-2 bg-[#0a0e17] px-3 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Competência:</span>
                <input
                  type="month"
                  value={selectedMonthlyPixMonth}
                  onChange={(e) => {
                    setSelectedMonthlyPixMonth(e.target.value);
                    loadMonthlyPix(e.target.value);
                  }}
                  className="bg-slate-900 text-white border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            )}

            {/* Subfiltros para Cashback Anual (Ciclo e Mês de Referência) */}
            {viewTab === 'annual_cashback' && (
              <div className="flex flex-wrap items-center gap-2 bg-[#0a0e17] px-3 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Ciclo Anual:</span>
                <select
                  value={selectedAnnualCycleYear}
                  onChange={(e) => {
                    const yr = parseInt(e.target.value, 10);
                    setSelectedAnnualCycleYear(yr);
                    loadAnnualCashback(yr);
                  }}
                  className="bg-slate-900 text-white border border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value={2025}>01/11/2025 a 30/11/2026 (Ciclo Atual)</option>
                  <option value={2024}>01/11/2024 a 30/11/2025</option>
                  <option value={2026}>01/11/2026 a 30/11/2027</option>
                </select>

                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-2">Mês:</span>
                <select
                  value={annualMonthFilter}
                  onChange={(e) => setAnnualMonthFilter(e.target.value)}
                  className="bg-slate-900 text-white border border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value="all">Todos os Meses</option>
                  {availableAnnualMonths.map(([ym, label]) => (
                    <option key={ym} value={ym}>{label} ({ym})</option>
                  ))}
                </select>
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

          {/* Botões de Ação: Exportar Excel (.xlsx), CSV e Imprimir */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleExportExcel}
              className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              title="Exportar Planilha Excel (.xlsx) com Design Profissional, Cores e Formatação de Moeda"
            >
              <FileSpreadsheet size={16} />
              Exportar Excel (.xlsx)
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-3 bg-[#0a0e17] hover:bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar dados brutos em CSV"
            >
              <Download size={14} />
              CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              title="Imprimir Relatório Oficial Formatado"
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
              <>
                {/* Visualização em Cards para Tela */}
                <div className="space-y-4 no-print">
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
                          {w.isPJ ? 'PJ (Nota Fiscal)' : 'PF (Recibo RPA - 0%)'}
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

                      {/* Status do Comprovante Fiscal: NF (PJ) vs RPA (PF) */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {w.isPJ ? 'Nota Fiscal (PJ):' : 'Comprovação Fiscal (PF):'}
                        </span>
                        {w.isPJ ? (
                          w.hasInvoice ? (
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
                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              <ShieldCheck size={11} /> Intermediação de Negócios (PJ)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={11} /> Recibo RPA Automático (Intermediação - 0% INSS)
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
                      
                      {/* 1. Mensal (Liberado a partir do dia 10 de cada mês) */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center min-w-[130px]">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">
                            Mensal Líquido
                          </span>
                          {!isMonthlyPayoutWindow && (
                            <span title="Bloqueado: Liberado a partir do dia 10 de cada mês">
                              <Lock size={10} className="text-amber-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-black text-white font-mono block">
                          R$ {(w.monthlyLiquid || 0).toFixed(2).replace('.', ',')}
                        </span>
                        {!w.isPJ && (w.monthlyPending || 0) > 0 && (
                          <span className="text-[8px] text-slate-400 block mt-0.5" title={`Bruto: R$ ${w.monthlyPending.toFixed(2)} | INSS: -R$ ${w.monthlyInss.toFixed(2)} | IRRF: -R$ ${w.monthlyIrrf.toFixed(2)}`}>
                            Bruto: R$ {(w.monthlyPending || 0).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <button
                          disabled={!w.isEligible || (w.monthlyLiquid || 0) <= 0 || !isMonthlyPayoutWindow || w.hasPendingAdvance}
                          onClick={() => handleOpenPaymentModal(w, 'mensal')}
                          title={
                            !isMonthlyPayoutWindow
                              ? 'Bloqueado: Liberado a partir do dia 10 de cada mês (antes disso apenas via Adiantamento)'
                              : w.hasPendingAdvance
                                ? 'Há uma solicitação de adiantamento pendente na aba Adiantamentos'
                                : (w.monthlyLiquid || 0) <= 0
                                  ? 'Saldo mensal quitado / adiantado'
                                  : 'Pagar Repasse Mensal'
                          }
                          className={`mt-2 w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            !isMonthlyPayoutWindow
                              ? 'bg-slate-800/90 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-75'
                              : (w.monthlyLiquid || 0) <= 0
                                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed opacity-50'
                                : w.hasPendingAdvance
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:pointer-events-none shadow-sm'
                          }`}
                        >
                          {!isMonthlyPayoutWindow ? (
                            <>
                              <Lock size={10} /> Libera Dia 10
                            </>
                          ) : (w.monthlyLiquid || 0) <= 0 ? (
                            'Quitado'
                          ) : w.hasPendingAdvance ? (
                            'Adiant. Pendente'
                          ) : (
                            'Pagar Mensal'
                          )}
                        </button>
                      </div>

                      {/* 2. Anual (Liberado exclusivamente em 10 de Dezembro) */}
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

                      {/* 3. Total Consolidado (Liberado Hoje: Mensal a partir do dia 10 e Anual em 10/Dez) */}
                      {(() => {
                        const monthlyPartLiquid = isMonthlyPayoutWindow ? (w.monthlyLiquid || 0) : 0;
                        const monthlyPartGross = isMonthlyPayoutWindow ? (w.monthlyPending || 0) : 0;
                        const monthlyPartInss = isMonthlyPayoutWindow ? (w.monthlyInss || 0) : 0;
                        const monthlyPartIrrf = isMonthlyPayoutWindow ? (w.monthlyIrrf || 0) : 0;

                        const annualPartLiquid = isDecemberAnnualWindow ? (w.annualLiquid || 0) : 0;
                        const annualPartGross = isDecemberAnnualWindow ? (w.annualPending || 0) : 0;

                        const liquidPayableToday = w.canPayMonthly ? (monthlyPartLiquid + annualPartLiquid) : 0;
                        const grossPayableToday = w.canPayMonthly ? (monthlyPartGross + annualPartGross) : 0;
                        const inssPayableToday = w.canPayMonthly ? monthlyPartInss : 0;
                        const irrfPayableToday = w.canPayMonthly ? monthlyPartIrrf : 0;

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
                                <span className="block text-amber-300/80">INSS: -R$ {inssPayableToday.toFixed(2).replace('.', ',')}</span>
                                {irrfPayableToday > 0 && (
                                  <span className="block text-rose-300/80">IRRF: -R$ {irrfPayableToday.toFixed(2).replace('.', ',')}</span>
                                )}
                              </div>
                            )}
                            {w.isPJ && grossPayableToday > 0 && (
                              <span className="text-[8px] text-blue-300 font-bold block mt-1">
                                PJ Isento
                              </span>
                            )}
                            {!isMonthlyPayoutWindow && (w.monthlyLiquid || 0) > 0 && (
                              <span className="text-[8px] text-emerald-400/90 block mt-1 font-medium">
                                + R$ {(w.monthlyLiquid || 0).toFixed(2).replace('.', ',')} libera dia 10
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
                              className={`mt-2 w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                liquidPayableToday <= 0
                                  ? 'bg-slate-800/90 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-75'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                              }`}
                            >
                              {liquidPayableToday <= 0 && !isMonthlyPayoutWindow ? (
                                <>
                                  <Lock size={10} /> Libera Dia 10
                                </>
                              ) : (
                                'Pagar Liberados'
                              )}
                            </button>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                ))}
              </div>

                {/* Tabela de Impressão Oficial para Afiliados e Revendedores */}
                <div className="hidden print:block">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                        <th className="py-2 px-2 text-center">Nível</th>
                        <th className="py-2 px-2">Nome do Beneficiário</th>
                        <th className="py-2 px-2">CPF/CNPJ</th>
                        <th className="py-2 px-2 text-center">Tipo</th>
                        <th className="py-2 px-2">Chave PIX</th>
                        <th className="py-2 px-2">Banco</th>
                        <th className="py-2 px-2 text-right">Mensal Líquido</th>
                        <th className="py-2 px-2 text-right">Anual Provisão</th>
                        <th className="py-2 px-2 text-right">Total a Pagar</th>
                        <th className="py-2 px-2 text-center">Situação Fiscal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBalances.map((w: any) => (
                        <tr key={w.profileId}>
                          <td className="py-1.5 px-2 text-center font-bold">{w.level}</td>
                          <td className="py-1.5 px-2 font-bold uppercase">{w.userName}</td>
                          <td className="py-1.5 px-2 font-mono">{w.cpf}</td>
                          <td className="py-1.5 px-2 text-center">{w.isPJ ? 'PJ' : 'PF'}</td>
                          <td className="py-1.5 px-2 font-mono">{w.pixKey}</td>
                          <td className="py-1.5 px-2 text-[10px]">{w.bankDetails}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">R$ {(w.monthlyLiquid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-1.5 px-2 text-right font-mono">R$ {(w.annualPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900">R$ {(w.totalLiquid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-1.5 px-2 text-center text-[9px]">{w.isPJ ? (w.hasInvoice ? 'NF Conferida' : 'PJ - Aguardando NF') : 'RPA (0% INSS)'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 font-black text-xs">
                        <td colSpan={6} className="py-2 px-2 uppercase">TOTAL GERAL ({filteredBalances.length} BENEFICIÁRIOS)</td>
                        <td className="py-2 px-2 text-right font-mono">R$ {totalMonthlyPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-right font-mono">R$ {totalAnnualPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-right font-mono font-black">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: HISTÓRICO DE PAGAMENTOS (AUDITORIA COMPLETA) */}
        {viewTab === 'history' && (
          <div className="space-y-6">
            {/* Cards de Resumo Fiscal da Auditoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
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
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">INSS Retido (0%)</p>
                  <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    R$ {totalHistoryInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6 print:bg-transparent print:border-none print:p-0 print:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
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
                <>
                  {/* Tabela de Tela (Paginada) */}
                  <div className="overflow-x-auto no-print">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-3">Data / Hora</th>
                          <th className="py-4 px-3">Beneficiário</th>
                          <th className="py-4 px-3 text-center">Tipo</th>
                          <th className="py-4 px-3">Categoria</th>
                          <th className="py-4 px-3">Ciclo</th>
                          <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                          <th className="py-4 px-3 text-right">INSS (0%)</th>
                          <th className="py-4 px-3 text-right">Imposto Retido</th>
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

                  {/* Tabela de Impressão Oficial Completa (Todos os Registros) */}
                  <div className="hidden print:block">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                          <th className="py-2 px-2">Data / Hora</th>
                          <th className="py-2 px-2">Beneficiário</th>
                          <th className="py-2 px-2 text-center">Tipo</th>
                          <th className="py-2 px-2">Categoria</th>
                          <th className="py-2 px-2">Ciclo</th>
                          <th className="py-2 px-2 text-right">Rendimento Bruto</th>
                          <th className="py-2 px-2 text-right">INSS (0%)</th>
                          <th className="py-2 px-2 text-right">Imposto Retido</th>
                          <th className="py-2 px-2 text-right">Valor Líquido</th>
                          <th className="py-2 px-2">Chave PIX</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((h: any) => (
                          <tr key={h.id}>
                            <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                              {new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="font-bold uppercase text-slate-900">{h.userName}</div>
                              <div className="text-[8.5px] font-mono text-slate-600">CPF: {h.cpf}</div>
                            </td>
                            <td className="py-1.5 px-2 text-center font-bold">{h.isPJ ? 'PJ' : 'PF'}</td>
                            <td className="py-1.5 px-2">{h.categoryLabel}</td>
                            <td className="py-1.5 px-2 font-bold">{h.cycleLabel}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              R$ {(h.bruto || h.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {(h.inss || 0) > 0 ? `- R$ ${(h.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {(h.irrf || 0) > 0 ? `- R$ ${(h.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900">
                              R$ {(h.liquido !== undefined ? h.liquido : (h.amount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[9px]">{h.pixKey}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-emerald-800 uppercase text-[8.5px]">Liquidado</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-xs">
                          <td colSpan={5} className="py-2 px-2 uppercase">TOTAL GERAL ({filteredHistory.length} LANÇAMENTOS)</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalHistoryBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalHistoryInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">- R$ {totalHistoryIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono font-black">R$ {totalHistoryLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: PASTA DE PAGAMENTOS MENSAIS ARQUIVADOS */}
        {viewTab === 'monthly_folder' && (
          <div className="space-y-6">
            {/* Cards de Métricas do Mês Selecionado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
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

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6 print:bg-transparent print:border-none print:p-0 print:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
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
                <>
                  {/* Tabela de Tela (Paginada) */}
                  <div className="overflow-x-auto no-print">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-3">Período / Previsão</th>
                          <th className="py-4 px-3">Beneficiário</th>
                          <th className="py-4 px-3 text-center">Tipo</th>
                          <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                          <th className="py-4 px-3 text-right">INSS (0%)</th>
                          <th className="py-4 px-3 text-right">IRRF Retido</th>
                          <th className="py-4 px-3 text-right">Valor Líquido</th>
                          <th className="py-4 px-3">Chave PIX</th>
                          <th className="py-4 px-3 text-center">Comprovante</th>
                          <th className="py-4 px-3 text-center">Demonstrativo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedList.map((a: any) => {
                          const userName = a.userName || a.affiliateName || a.beneficiaryName || 'Afiliado Autônomo';
                          const userCpf = a.userCpf || a.cpfCnpj || a.cpf || '---';
                          const userPixKey = a.userPixKey || a.pixKey || '---';
                          const bruto = Math.abs(Number(a.totalBruto || a.mensalBruto || a.liquido || 0));
                          const inss = Math.abs(Number(a.inss || 0));
                          const irrf = Math.abs(Number(a.irrf || 0));
                          const liquido = Math.abs(Number(a.liquido !== undefined ? a.liquido : bruto));
                          const periodLabel = a.periodLabel || a.periodoStr || `01.${selectedArchiveMonth.split('-')[1]} a 30.${selectedArchiveMonth.split('-')[1]}.${selectedArchiveMonth.split('-')[0]}`;
                          const mNum = Number(selectedArchiveMonth.split('-')[1]) || 1;
                          const yNum = Number(selectedArchiveMonth.split('-')[0]) || new Date().getFullYear();
                          const paymentDateLabel = a.paymentDateLabel || a.previsaoPagamentoStr || `10.${String(mNum === 12 ? 1 : mNum + 1).padStart(2, '0')}.${mNum === 12 ? yNum + 1 : yNum}`;

                          return (
                            <tr key={a.id || a.userId} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 px-3 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-300 font-mono text-[11px]">{periodLabel}</span>
                                  <span className="text-[10px] text-amber-400 font-mono">Pgto: {paymentDateLabel}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white uppercase">{userName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">CPF: {userCpf}</span>
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
                                R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                                {inss > 0 ? `- R$ ${inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                              </td>
                              <td className="py-4 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                                {irrf > 0 ? `- R$ ${irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                              </td>
                              <td className="py-4 px-3 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                                R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                                {userPixKey}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tabela de Impressão Oficial Completa (Todos os Arquivados) */}
                  <div className="hidden print:block">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                          <th className="py-2 px-2">Período</th>
                          <th className="py-2 px-2">Data Pagamento</th>
                          <th className="py-2 px-2">Beneficiário</th>
                          <th className="py-2 px-2 text-center">Tipo</th>
                          <th className="py-2 px-2">Chave PIX</th>
                          <th className="py-2 px-2 text-right">Total Bruto</th>
                          <th className="py-2 px-2 text-right">INSS Retido</th>
                          <th className="py-2 px-2 text-right">IRRF Retido</th>
                          <th className="py-2 px-2 text-right">Valor Líquido</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArchives.map((a: any) => (
                          <tr key={a.id}>
                            <td className="py-1.5 px-2 font-mono">{a.periodLabel}</td>
                            <td className="py-1.5 px-2 font-mono">{a.paymentDateLabel}</td>
                            <td className="py-1.5 px-2">
                              <div className="font-bold uppercase text-slate-900">{a.userName}</div>
                              <div className="text-[8.5px] font-mono text-slate-600">CPF: {a.userCpf}</div>
                            </td>
                            <td className="py-1.5 px-2 text-center font-bold">{a.isPJ ? 'PJ' : 'PF'}</td>
                            <td className="py-1.5 px-2 font-mono text-[9px]">{a.userPixKey}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              R$ {(a.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {(a.inss || 0) > 0 ? `- R$ ${(a.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {(a.irrf || 0) > 0 ? `- R$ ${(a.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900">
                              R$ {(a.liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-center font-bold text-emerald-800 uppercase text-[8.5px]">Liquidado</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-xs">
                          <td colSpan={5} className="py-2 px-2 uppercase">TOTAL GERAL ({filteredArchives.length} REGISTROS)</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalArchiveBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">- R$ {totalArchiveInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">- R$ {totalArchiveIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono font-black">R$ {totalArchiveLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADIANTAMENTOS MENSAIS SOLICITADOS */}
        {viewTab === 'advances' && (
          <div className="space-y-6">
            <div className="bg-[#0a0e17] p-6 md:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 print:bg-transparent print:border-none print:p-0 print:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <DollarSign className="text-amber-400" size={20} />
                    Solicitações de Adiantamento Mensal
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Afiliados Pessoa Física que solicitaram antecipação dos rendimentos apurados no mês.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    Total Solicitações: {advanceRequestsList.length}
                  </span>
                </div>
              </div>

              {loadingAdvances ? (
                <div className="py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando solicitações de adiantamento...</p>
                </div>
              ) : advanceRequestsList.length === 0 ? (
                <div className="py-20 text-center">
                  <DollarSign size={48} className="text-slate-600 mx-auto mb-4 opacity-40" />
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhuma solicitação de adiantamento encontrada</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Quando um afiliado solicitar antecipação na aba Recibo RPA, o pedido aparecerá aqui para aprovação e pagamento via PIX.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabela de Tela com Botões de Ação */}
                  <div className="overflow-x-auto no-print">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-3">Data Solicitação</th>
                          <th className="py-4 px-3">Afiliado / Beneficiário</th>
                          <th className="py-4 px-3">Competência</th>
                          <th className="py-4 px-3 text-right">Valor Solicitado</th>
                          <th className="py-4 px-3">Chave PIX</th>
                          <th className="py-4 px-3 text-center">Status</th>
                          <th className="py-4 px-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {advanceRequestsList.map((adv: any) => (
                          <tr key={adv.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3 whitespace-nowrap text-slate-400 font-mono">
                              {new Date(adv.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-white uppercase">{adv.user_name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">CPF: {adv.cpf}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap font-mono text-slate-300">
                              {adv.ref_month}
                            </td>
                            <td className="py-4 px-3 text-right font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                              R$ {(adv.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 font-mono text-emerald-400 text-[11px] whitespace-nowrap">
                              {adv.pix_key} ({adv.pix_type})
                            </td>
                            <td className="py-4 px-3 text-center whitespace-nowrap">
                              {adv.status === 'paid' ? (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  Pago ({adv.paid_at})
                                </span>
                              ) : adv.status === 'rejected' ? (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                  Recusado
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
                                  Pendente Análise
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-center whitespace-nowrap">
                              {adv.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenAdvancePaymentModal(adv)}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                  >
                                    <Check size={12} /> Pagar PIX
                                  </button>
                                  <button
                                    onClick={() => handleRejectAdvance(adv.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-[10px] uppercase transition-all cursor-pointer"
                                    title="Recusar Adiantamento"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : adv.receipt_url ? (
                                <a
                                  href={adv.receipt_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-black text-[9px] uppercase tracking-wider transition-colors"
                                >
                                  <FileText size={12} /> Comprovante PIX
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-bold">---</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tabela de Impressão Oficial Completa */}
                  <div className="hidden print:block">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                          <th className="py-2 px-2">Data Solicitação</th>
                          <th className="py-2 px-2">Beneficiário</th>
                          <th className="py-2 px-2">CPF</th>
                          <th className="py-2 px-2 text-center">Competência</th>
                          <th className="py-2 px-2 text-right">Valor Solicitado</th>
                          <th className="py-2 px-2">Chave PIX</th>
                          <th className="py-2 px-2 text-center">Status</th>
                          <th className="py-2 px-2 text-center">Data Baixa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advanceRequestsList.map((adv: any) => (
                          <tr key={adv.id}>
                            <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                              {new Date(adv.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-1.5 px-2 font-bold uppercase text-slate-900">{adv.user_name}</td>
                            <td className="py-1.5 px-2 font-mono text-[9px]">{adv.cpf}</td>
                            <td className="py-1.5 px-2 text-center font-mono">{adv.ref_month}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                              R$ {(adv.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[9px]">{adv.pix_key}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-[8.5px] uppercase">
                              {adv.status === 'paid' ? 'Pago' : adv.status === 'rejected' ? 'Recusado' : 'Pendente'}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono text-[9px]">{adv.paid_at || '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-xs">
                          <td colSpan={4} className="py-2 px-2 uppercase">TOTAL SOLICITADO ({advanceRequestsList.length} PEDIDOS)</td>
                          <td className="py-2 px-2 text-right font-mono font-black">
                            R$ {advanceRequestsList.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RELATÓRIO 1 OFICIAL - FOLHA DE PAGAMENTOS DIA 10 (PIX) */}
        {viewTab === 'monthly_pix' && (
          <div className="space-y-6">
            {/* Cards de Métricas da Folha Mensal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cashback Mensal Total</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    R$ {totalMonthlyPixCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Retenção IRRF</p>
                  <h3 className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                    - R$ {totalMonthlyPixIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">(-) Adiantamentos Pagos</p>
                  <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    - R$ {totalMonthlyPixAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">(=) Líquido a Pagar PIX</p>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    R$ {totalMonthlyPixLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6 print:bg-transparent print:border-none print:p-0 print:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="text-emerald-400" size={20} />
                    Folha Oficial de Pagamentos PIX - Dia 10 (Competência {selectedMonthlyPixMonth})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Relatório oficial para emissão de PIX em lote com deduções fiscais e abatimento integral de adiantamentos já quitados.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    Total Beneficiários: {filteredMonthlyPix.length}
                  </span>
                </div>
              </div>

              {loadingMonthlyPix ? (
                <div className="py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando folha de pagamentos...</p>
                </div>
              ) : filteredMonthlyPix.length === 0 ? (
                <div className="py-20 text-center">
                  <FileSpreadsheet size={48} className="text-slate-600 mx-auto mb-4 opacity-40" />
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhum pagamento apurado na competência {selectedMonthlyPixMonth}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Não foram encontradas comissões ou repasses pendentes para o mês selecionado.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabela de Tela (Paginada) */}
                  <div className="overflow-x-auto no-print">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-3">Nome do Afiliado</th>
                          <th className="py-4 px-3">CPF/CNPJ</th>
                          <th className="py-4 px-3">Chave PIX</th>
                          <th className="py-4 px-3">Dados Bancários</th>
                          <th className="py-4 px-3 text-center">Período</th>
                          <th className="py-4 px-3 text-center">Previsão Pgto</th>
                          <th className="py-4 px-3 text-right">Cashback Mensal</th>
                          <th className="py-4 px-3 text-right">Cashback Anual Acum.</th>
                          <th className="py-4 px-3 text-right">Total Bruto</th>
                          <th className="py-4 px-3 text-right">INSS (0%)</th>
                          <th className="py-4 px-3 text-right">IRRF Retido</th>
                          <th className="py-4 px-3 text-right text-amber-400">(-) Adiantamentos</th>
                          <th className="py-4 px-3 text-right text-emerald-400">Líquido a Pagar PIX</th>
                          <th className="py-4 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {paginatedList.map((r: any) => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3 font-sans font-bold text-white uppercase whitespace-nowrap">
                              {r.userName}
                            </td>
                            <td className="py-4 px-3 text-slate-400 whitespace-nowrap">
                              {r.cpfCnpj}
                            </td>
                            <td className="py-4 px-3 text-emerald-300 font-bold whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{r.pixKey}</span>
                                <button
                                  onClick={() => copyToClipboard(r.pixKey, 'Chave PIX')}
                                  className="p-1 hover:text-white transition-colors cursor-pointer"
                                  title="Copiar PIX"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {r.bankDetails}
                            </td>
                            <td className="py-4 px-3 text-center text-slate-300 whitespace-nowrap">
                              {r.period}
                            </td>
                            <td className="py-4 px-3 text-center text-slate-300 whitespace-nowrap">
                              {r.paymentForecast}
                            </td>
                            <td className="py-4 px-3 text-right text-white font-bold whitespace-nowrap">
                              R$ {(r.cashbackMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-blue-400 whitespace-nowrap">
                              R$ {(r.cashbackAnualAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-white font-bold whitespace-nowrap">
                              R$ {(r.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-slate-400 whitespace-nowrap">
                              {(r.inss || 0) > 0 ? `R$ ${(r.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                            </td>
                            <td className="py-4 px-3 text-right text-rose-400 font-bold whitespace-nowrap">
                              {(r.irrf || 0) > 0 ? `R$ ${(r.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                            </td>
                            <td className="py-4 px-3 text-right text-amber-400 font-bold whitespace-nowrap">
                              {(r.adiantamentos || 0) > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span>- R$ {(r.adiantamentos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  {r.adiantamentoDate && (
                                    <span className="text-[9px] text-amber-500/80 font-sans">Pago {r.adiantamentoDate}</span>
                                  )}
                                </div>
                              ) : (
                                'R$ -'
                              )}
                            </td>
                            <td className="py-4 px-3 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                              R$ {(r.liquidoPix || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-center whitespace-nowrap font-sans">
                              {r.status === 'Pago' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                  <CheckCircle2 size={11} /> Pago
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                                  <Clock size={11} /> Pendente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-white/20 font-mono font-black text-xs bg-white/5">
                          <td className="py-4 px-3 font-sans uppercase text-white font-black">
                            TOTAL
                          </td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3 text-right text-white">
                            R$ {totalMonthlyPixCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-blue-400">
                            R$ {totalMonthlyPixAnualAcum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-white">
                            R$ {totalMonthlyPixBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-slate-400">
                            {totalMonthlyPixInss > 0 ? `R$ ${totalMonthlyPixInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                          </td>
                          <td className="py-4 px-3 text-right text-rose-400">
                            {totalMonthlyPixIrrf > 0 ? `R$ ${totalMonthlyPixIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                          </td>
                          <td className="py-4 px-3 text-right text-amber-400">
                            {totalMonthlyPixAdiantamentos > 0 ? `- R$ ${totalMonthlyPixAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                          </td>
                          <td className="py-4 px-3 text-right text-emerald-400 text-sm">
                            R$ {totalMonthlyPixLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tabela de Impressão Oficial Completa (Folha PIX 100% dos Registros) */}
                  <div className="hidden print:block">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                          <th className="py-2 px-1">Afiliado</th>
                          <th className="py-2 px-1">CPF/CNPJ</th>
                          <th className="py-2 px-1">Chave PIX</th>
                          <th className="py-2 px-1">Banco / Agência</th>
                          <th className="py-2 px-1 text-center">Período</th>
                          <th className="py-2 px-1 text-center">Previsão</th>
                          <th className="py-2 px-1 text-right">Cash Mensal</th>
                          <th className="py-2 px-1 text-right">Cash Anual</th>
                          <th className="py-2 px-1 text-right">Total Bruto</th>
                          <th className="py-2 px-1 text-right">INSS (0%)</th>
                          <th className="py-2 px-1 text-right">IRRF Ret.</th>
                          <th className="py-2 px-1 text-right">(-) Adiant.</th>
                          <th className="py-2 px-1 text-right">Líquido PIX</th>
                          <th className="py-2 px-1 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonthlyPix.map((r: any) => (
                          <tr key={r.id}>
                            <td className="py-1.5 px-1 font-bold uppercase text-slate-900">{r.userName}</td>
                            <td className="py-1.5 px-1 font-mono text-[9px]">{r.cpfCnpj}</td>
                            <td className="py-1.5 px-1 font-mono text-[9px]">{r.pixKey}</td>
                            <td className="py-1.5 px-1 text-[8.5px]">{r.bankDetails}</td>
                            <td className="py-1.5 px-1 text-center font-mono">{r.period}</td>
                            <td className="py-1.5 px-1 text-center font-mono">{r.paymentForecast}</td>
                            <td className="py-1.5 px-1 text-right font-mono font-bold">
                              R$ {(r.cashbackMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono">
                              R$ {(r.cashbackAnualAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono font-bold">
                              R$ {(r.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono">
                              {(r.inss || 0) > 0 ? `R$ ${(r.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono">
                              {(r.irrf || 0) > 0 ? `- R$ ${(r.irrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono">
                              {(r.adiantamentos || 0) > 0 ? `- R$ ${(r.adiantamentos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-1 text-right font-mono font-black text-slate-900">
                              R$ {(r.liquidoPix || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-1 text-center font-bold text-[8.5px] uppercase">
                              {r.status || 'Pendente'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-xs">
                          <td colSpan={6} className="py-2 px-1 uppercase">TOTAL GERAL ({filteredMonthlyPix.length} BENEFICIÁRIOS)</td>
                          <td className="py-2 px-1 text-right font-mono">R$ {totalMonthlyPixCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-right font-mono">R$ {totalMonthlyPixAnualAcum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-right font-mono">R$ {totalMonthlyPixBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-right font-mono">R$ 0,00</td>
                          <td className="py-2 px-1 text-right font-mono">- R$ {totalMonthlyPixIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-right font-mono">- R$ {totalMonthlyPixAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-right font-mono font-black">R$ {totalMonthlyPixLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RELATÓRIO 2 OFICIAL - CASHBACK ANUAL A PAGAR (01/11 A 30/11) */}
        {viewTab === 'annual_cashback' && (
          <div className="space-y-6">
            {/* Banner Informativo do Ciclo Anual */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg shadow-blue-950/20 no-print">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">
                    Ciclo Anual Vigente: 01/11/2025 a 30/11/2026
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Relatório consolidado de 12 meses para apuração oficial e esclarecimento de divergências.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider shrink-0">
                <Clock size={12} />
                Pagamento Oficial: 10 de Dezembro
              </div>
            </div>

            {/* Cards de Resumo Anual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Cash Afiliado (MMN)</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    R$ {totalAnnualCashAfiliado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Building2 size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Cash Revendedor</p>
                  <h3 className="text-2xl font-black text-purple-400 font-mono tracking-tight">
                    R$ {totalAnnualCashRevendedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bruto Anual</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    R$ {totalAnnualBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-[#0a0e17] p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="size-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Líquido a Receber</p>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    R$ {totalAnnualLiquidoReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e17] rounded-[2rem] border border-white/5 p-6 lg:p-8 shadow-2xl space-y-6 print:bg-transparent print:border-none print:p-0 print:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" size={20} />
                    CASHBACK ANUAL A PAGAR (Ciclo {selectedAnnualCycleYear === 2025 ? '01/11/2025 a 30/11/2026' : `${selectedAnnualCycleYear} a ${selectedAnnualCycleYear + 1}`})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Apuração de 2% de Rede MMN e 2% de Revendedor Regional acumulados mês a mês para pagamento anual em 10 de Dezembro.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                    Total Lançamentos: {filteredAnnualCashback.length}
                  </span>
                </div>
              </div>

              {loadingAnnualCashback ? (
                <div className="py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando relatório anual...</p>
                </div>
              ) : filteredAnnualCashback.length === 0 ? (
                <div className="py-20 text-center">
                  <ShieldCheck size={48} className="text-slate-600 mx-auto mb-4 opacity-40" />
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Nenhum cashback anual encontrado para os filtros selecionados</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Verifique o ciclo anual ou o filtro por mês/nome.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabela de Tela (Paginada) */}
                  <div className="overflow-x-auto no-print">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-3">ID</th>
                          <th className="py-4 px-3">NOME</th>
                          <th className="py-4 px-3 text-right">CASH AFILIADO</th>
                          <th className="py-4 px-3 text-right">CASH REVENDEDOR</th>
                          <th className="py-4 px-3 text-right">TOTAL BRUTO</th>
                          <th className="py-4 px-3 text-right">BASE IRPF</th>
                          <th className="py-4 px-3 text-right">DESCONTO IRPF</th>
                          <th className="py-4 px-3 text-right text-emerald-400">LÍQUIDO A RECEBER</th>
                          <th className="py-4 px-3 text-center">MÊS DE REFERÊNCIA</th>
                          <th className="py-4 px-3 text-center">PAGAMENTO PIX</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {paginatedList.map((r: any, idx: number) => (
                          <tr key={`${r.fullId}_${r.refMonth}_${idx}`} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3 text-indigo-400 font-bold whitespace-nowrap">
                              {r.id}
                            </td>
                            <td className="py-4 px-3 font-sans font-bold text-white uppercase whitespace-nowrap">
                              {r.name}
                            </td>
                            <td className="py-4 px-3 text-right text-blue-300 font-bold whitespace-nowrap">
                              R$ {(r.cashAfiliado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-purple-300 font-bold whitespace-nowrap">
                              R$ {(r.cashRevendedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-white font-bold whitespace-nowrap">
                              R$ {(r.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-slate-300 whitespace-nowrap">
                              R$ {(r.baseIrpf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-right text-rose-400 whitespace-nowrap">
                              {(r.descontoIrpf || 0) > 0 ? `R$ ${(r.descontoIrpf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                            </td>
                            <td className="py-4 px-3 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                              R$ {(r.liquidoReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-3 text-center text-amber-300 font-bold whitespace-nowrap">
                              {r.mesReferencia}
                            </td>
                            <td className="py-4 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleOpenAnnualPaymentModal(r)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                                title={`Gerar QR Code PIX para ${r.name}`}
                              >
                                <QrCode size={13} className="text-emerald-400" />
                                <span>Gerar QR Code PIX</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-white/20 font-mono font-black text-xs bg-white/5">
                          <td className="py-4 px-3 font-sans uppercase text-white font-black">
                            TOTAL
                          </td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3 text-right text-blue-300">
                            R$ {totalAnnualCashAfiliado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-purple-300">
                            R$ {totalAnnualCashRevendedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-white">
                            R$ {totalAnnualBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-slate-300">
                            R$ {totalAnnualBaseIrpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-right text-rose-400">
                            {totalAnnualDescontoIrpf > 0 ? `R$ ${totalAnnualDescontoIrpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ -'}
                          </td>
                          <td className="py-4 px-3 text-right text-emerald-400 text-sm">
                            R$ {totalAnnualLiquidoReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3"></td>
                          <td className="py-4 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tabela de Impressão Oficial Completa (Todos os Lançamentos Anuais) */}
                  <div className="hidden print:block">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px]">
                          <th className="py-2 px-1 text-center">ID</th>
                          <th className="py-2 px-2">NOME</th>
                          <th className="py-2 px-2 text-right">CASH AFILIADO</th>
                          <th className="py-2 px-2 text-right">CASH REVENDEDOR</th>
                          <th className="py-2 px-2 text-right">TOTAL BRUTO</th>
                          <th className="py-2 px-2 text-right">BASE IRPF</th>
                          <th className="py-2 px-2 text-right">DESCONTO IRPF</th>
                          <th className="py-2 px-2 text-right">LÍQUIDO A RECEBER</th>
                          <th className="py-2 px-2 text-center">MÊS DE REFERÊNCIA</th>
                          <th className="py-2 px-2">CHAVE PIX</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAnnualCashback.map((r: any, idx: number) => (
                          <tr key={`print_${r.fullId}_${r.refMonth}_${idx}`}>
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-slate-800">{r.id}</td>
                            <td className="py-1.5 px-2 font-bold uppercase text-slate-900">{r.name}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              R$ {(r.cashAfiliado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              R$ {(r.cashRevendedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              R$ {(r.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              R$ {(r.baseIrpf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {(r.descontoIrpf || 0) > 0 ? `- R$ ${(r.descontoIrpf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900">
                              R$ {(r.liquidoReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono text-[9px] font-bold">{r.mesReferencia}</td>
                            <td className="py-1.5 px-2 font-mono text-[9px]">{r.chavePix}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-xs">
                          <td colSpan={2} className="py-2 px-2 uppercase">TOTAL GERAL ({filteredAnnualCashback.length} REGISTROS)</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalAnnualCashAfiliado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalAnnualCashRevendedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalAnnualBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">R$ {totalAnnualBaseIrpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono">- R$ {totalAnnualDescontoIrpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right font-mono font-black">R$ {totalAnnualLiquidoReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE DEMONSTRATIVO OFICIAL: VALOR LÍQUIDO IDÊNTICO À PLANILHA */}
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#0f1523] border border-amber-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 shadow-2xl relative space-y-6 my-auto">
              <button
                onClick={() => {
                  setIsStatementModalOpen(false);
                  setStatementData(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
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
                        {(statementData.mensalRevendedorBruto || 0) > 0 
                          ? 'REPASSE MENSAL CONSOLIDADO - REVENDEDOR REGIONAL & MMN' 
                          : 'REPASSE MENSAL DE REDE MMN - AFILIADO'}
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
                        <span className="text-[9px] text-slate-400 font-medium uppercase">
                          {(statementData.mensalRevendedorBruto || 0) > 0 ? 'Rede MMN + Revendedor' : 'Rede MMN (G0 ao G2)'}
                        </span>
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

                  {/* Banner Total a Receber */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                      <span>TOTAL A RECEBER ATÉ 05/{statementData.refMonth ? statementData.refMonth.split('-')[1] : '00'}/{statementData.refMonth ? statementData.refMonth.split('-')[0] : '0000'}</span>
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
                        <span className="text-slate-300 font-bold uppercase block">INSS (11% - CONTRIBUINTE INDIVIDUAL)</span>
                        <span className="text-[9px] text-slate-500">{statementData.user?.isPJ ? 'Isento (PJ)' : 'Retenção na fonte (teto máx. R$ 8.157,41)'}</span>
                      </div>
                      <span className={`font-mono font-black ${statementData.user?.isPJ || (statementData.inss || 0) === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {statementData.user?.isPJ ? 'Isento (PJ)' : (statementData.inss || 0) > 0 ? `- R$ ${(statementData.inss || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
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
                        <span className="text-emerald-300 font-bold uppercase block">IRRF</span>
                        <span className="text-[9px] text-emerald-400/70">Tabela progressiva da Receita Federal (2026 / Lei 15.270)</span>
                      </div>
                      <span className={`font-mono font-black ${(statementData.irrf || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(statementData.irrf || 0) > 0 ? `- R$ ${(statementData.irrf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Isento'}
                      </span>
                    </div>

                    {/* (-) ADIANTAMENTO SE HOUVER */}
                    {(statementData.adiantamento || 0) > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div>
                          <span className="text-amber-300 font-bold uppercase block">(-) ADIANTAMENTO DE RENDIMENTOS</span>
                          {statementData.adiantamentoDate && (
                            <span className="text-[9px] text-amber-400/80">Pago em {statementData.adiantamentoDate}</span>
                          )}
                        </div>
                        <span className="font-mono font-black text-amber-300">
                          - R$ {(statementData.adiantamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

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

                  {/* Banner Total a Receber */}
                  <div className="bg-amber-100 border border-amber-300/80 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={20} className="text-amber-700 shrink-0" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                        TOTAL A RECEBER ATÉ {consolidatedData.limiteNotaFiscalStr}
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
                          INSS (11% - CONTRIBUINTE INDIVIDUAL)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {consolidatedData.isPJ ? 'Pessoa Jurídica isenta de retenção' : 'Retenção na fonte (teto máx. R$ 8.157,41)'}
                        </span>
                      </div>
                      <span className={`font-mono font-black ${consolidatedData.isPJ || Number(consolidatedData.inss || 0) === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {consolidatedData.isPJ 
                          ? 'Isento (PJ)' 
                          : Number(consolidatedData.inss || 0) > 0 
                            ? `- ${Number(consolidatedData.inss || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
                            : 'R$ 0,00'}
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
                          IRRF
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {consolidatedData.isPJ ? 'Isento para Pessoa Jurídica' : 'Retenção na Fonte conforme faixa de rendimentos da RFB (Tabela 2026 / Lei 15.270)'}
                        </span>
                      </div>
                      <span className={`font-mono font-black ${consolidatedData.isPJ || consolidatedData.irrf === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {consolidatedData.isPJ || consolidatedData.irrf === 0 
                          ? 'Isento' 
                          : `- ${Number(consolidatedData.irrf || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                      </span>
                    </div>

                    {/* 8.1 (-) ADIANTAMENTO SE HOUVER */}
                    {(consolidatedData.adiantamento || 0) > 0 && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-950 uppercase block">
                              (-) ADIANTAMENTO DE RENDIMENTOS
                            </span>
                            {consolidatedData.adiantamentoDate && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider">
                                Pago em {consolidatedData.adiantamentoDate}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-700">
                            Valor antecipado no mês corrente e descontado do acerto final no dia {consolidatedData.previsaoPagamentoStr.split('.')[0]}
                          </span>
                        </div>
                        <span className="font-mono font-black text-amber-700">
                          - {Number(consolidatedData.adiantamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )}

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
          <div className="flex items-center justify-between pt-6 border-t border-white/5 no-print">
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

        {/* ASSINATURAS OFICIAIS DE HOMOLOGAÇÃO (Exclusivo na Impressão / PDF) */}
        <div className="hidden print:flex justify-between items-end pt-16 mt-8 text-xs text-slate-800">
          <div className="text-center w-72 border-t border-slate-900 pt-2 font-bold">
            <p className="font-black uppercase text-[10px] text-slate-900">Emissão / Diretoria Financeira</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Serviços Urbanos Tecnologia e Economia LTDA</p>
          </div>
          <div className="text-center w-72 border-t border-slate-900 pt-2 font-bold">
            <p className="font-black uppercase text-[10px] text-slate-900">Auditoria & Conformidade Fiscal</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Homologação de Repasses e Retenções</p>
          </div>
        </div>

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
