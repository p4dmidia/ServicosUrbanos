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
  FileText,
  Building2,
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules, calculateTaxDeductions } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AffiliateWallet() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [mmnConfig, setMmnConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [networkMembers, setNetworkMembers] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mensal' | 'anual'>('all');
  const [mmnLevelFilter, setMmnLevelFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [searchQuery, setSearchQuery] = useState('');
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);
  const [comissoesData, setComissoesData] = useState<any>(null);
  const [regularizing, setRegularizing] = useState(false);

  // Estados da Regra de Transição PF -> PJ (Limite R$ 5.000)
  const [pjRequirement, setPjRequirement] = useState<any>(null);
  const [isPjModalOpen, setIsPjModalOpen] = useState(false);
  const [pjCnpj, setPjCnpj] = useState('');
  const [pjRazaoSocial, setPjRazaoSocial] = useState('');
  const [pjNomeFantasia, setPjNomeFantasia] = useState('');
  const [pjPixKey, setPjPixKey] = useState('');
  const [migratingPj, setMigratingPj] = useState(false);

  const formatCnpj = (val: string) => {
    const num = val.replace(/\D/g, '').slice(0, 14);
    if (num.length <= 2) return num;
    if (num.length <= 5) return `${num.slice(0, 2)}.${num.slice(2)}`;
    if (num.length <= 8) return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5)}`;
    if (num.length <= 12) return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}/${num.slice(8)}`;
    return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}/${num.slice(8, 12)}-${num.slice(12)}`;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Excluir qualquer lançamento de nível REG ou revendedor da aba Financeiro de Rede
      const isReseller = t.level === 'REG' || t.isReseller || t.category === 'reseller';
      if (isReseller) return false;

      const matchesFilter = 
        activeFilter === 'all' || 
        (activeFilter === 'mensal' && !t.cashbackType?.includes('Anual')) ||
        (activeFilter === 'anual' && t.cashbackType?.includes('Anual'));

      const matchesLevel = 
        mmnLevelFilter === 'all' || 
        t.level === mmnLevelFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        t.orderId?.toLowerCase().includes(searchLower) ||
        t.affiliateName?.toLowerCase().includes(searchLower) ||
        t.cashbackType?.toLowerCase().includes(searchLower) ||
        t.date?.toLowerCase().includes(searchLower) ||
        t.status?.toLowerCase().includes(searchLower) ||
        String(t.amount).includes(searchQuery);

      return matchesFilter && matchesLevel && matchesSearch;
    });
  }, [transactions, activeFilter, mmnLevelFilter, searchQuery]);

  const isUserPJ = useMemo(() => {
    if (profile?.person_type === 'PJ') return true;
    if (profile?.cnpj && profile.cnpj.replace(/\D/g, '').length === 14) return true;
    if (profile?.description && profile.description.includes('[PJ]')) return true;
    return false;
  }, [profile]);

  // Cálculo individual de impostos (INSS, IRRF e Líquido - Regra Oficial 2026)
  const calculateItemTaxes = (brutoAmount: number) => {
    const bruto = Math.max(0, Number(brutoAmount) || 0);
    const tax = calculateTaxDeductions(bruto, isUserPJ);
    return {
      bruto: tax.bruto,
      inss: tax.inss,
      baseIrrf: tax.irrfBase,
      irrf: tax.irrf,
      liquido: tax.liquido,
      isPJ: tax.isPJ
    };
  };

  const enrichedTransactions = useMemo(() => {
    return filteredTransactions.map(t => {
      const bruto = Number(t.amount || 0);
      const contractAmount = Number(t.contractAmount || 0);
      const percentage = Number(t.percentage || 0);
      return {
        ...t,
        bruto,
        contractAmount,
        percentage
      };
    });
  }, [filteredTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Lógica oficial de pagamentos semanais: repasses realizados toda terça-feira
  const nextTuesdayFormatted = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 2 = Terça
    let daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    if (daysUntilTuesday === 0) daysUntilTuesday = 7;
    const nextTuesday = new Date(now);
    nextTuesday.setDate(now.getDate() + daysUntilTuesday);
    
    const dd = String(nextTuesday.getDate()).padStart(2, '0');
    const mm = String(nextTuesday.getMonth() + 1).padStart(2, '0');
    const yyyy = nextTuesday.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }, []);

  const weeklyCommissionTotal = useMemo(() => {
    return enrichedTransactions
      .filter(t => !t.cashbackType?.includes('Anual') && t.status !== 'Cancelado' && t.status !== 'Recusado' && Number(t.bruto || t.amount || 0) > 0)
      .reduce((acc, t) => acc + Number(t.bruto || t.amount || 0), 0);
  }, [enrichedTransactions]);

  const annualBonusTotal = useMemo(() => {
    return enrichedTransactions
      .filter(t => t.cashbackType?.includes('Anual') && t.status !== 'Cancelado' && t.status !== 'Recusado' && Number(t.bruto || t.amount || 0) > 0)
      .reduce((acc, t) => acc + Number(t.bruto || t.amount || 0), 0);
  }, [enrichedTransactions]);

  const displayWeeklyCommission = weeklyCommissionTotal > 0 
    ? weeklyCommissionTotal 
    : Number(comissoesData?.semanalPendente || stats?.networkAvailableBalance || 0);

  const displayAnnualBonus = annualBonusTotal > 0 
    ? annualBonusTotal 
    : Number(comissoesData?.anualAcumulado || stats?.annualBonus || 0);

  // Agrupamento hierárquico MMN: Microfranqueados G0, G1 e G2 e seus pedidos de Afiliados Premium (AF)
  const mmnHierarchyGroups = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();

    // 1. G0 - O próprio Microfranqueado autenticado (Vendas Diretas)
    const g0Mf = {
      id: user?.id || 'g0',
      name: profile?.full_name || 'Você (Microfranqueado)',
      levelTag: 'G0',
      category: 'FRANQUEADO',
      date: '0',
      status: '0'
    };
    const g0Orders = enrichedTransactions.filter(t => t.level === '0');

    // 2. G1 - Microfranqueados indicados direto por G0
    const g1Members = networkMembers.filter(m => Number(m.level) === 1);
    const g1Orders = enrichedTransactions.filter(t => t.level === '1');

    const g1Groups: any[] = [];
    if (g1Members.length > 0) {
      g1Members.forEach(m => {
        const orders = g1Members.length === 1 
          ? g1Orders 
          : g1Orders.filter(t => t.sellerId === m.id || t.referredBy === m.id);
        g1Groups.push({
          microfranqueado: {
            id: m.id,
            name: m.name,
            levelTag: 'G1',
            category: 'FRANQUEADO',
            date: '0',
            status: '0'
          },
          orders: orders.length > 0 ? orders : (g1Members.length === 1 ? g1Orders : [])
        });
      });
    } else if (g1Orders.length > 0) {
      g1Groups.push({
        microfranqueado: {
          id: 'g1-default',
          name: 'Microfranqueado Indicado Direto (G1)',
          levelTag: 'G1',
          category: 'FRANQUEADO',
          date: '0',
          status: '0'
        },
        orders: g1Orders
      });
    }

    // 3. G2 - Microfranqueados indicados diretos de seu G1
    const g2Members = networkMembers.filter(m => Number(m.level) === 2);
    const g2Orders = enrichedTransactions.filter(t => t.level === '2');

    const g2Groups: any[] = [];
    if (g2Members.length > 0) {
      g2Members.forEach(m => {
        const orders = g2Members.length === 1 
          ? g2Orders 
          : g2Orders.filter(t => t.sellerId === m.id || t.referredBy === m.id);
        g2Groups.push({
          microfranqueado: {
            id: m.id,
            name: m.name,
            levelTag: 'G2',
            category: 'FRANQUEADO',
            date: '0',
            status: '0'
          },
          orders: orders.length > 0 ? orders : (g2Members.length === 1 ? g2Orders : [])
        });
      });
    } else if (g2Orders.length > 0) {
      g2Groups.push({
        microfranqueado: {
          id: 'g2-default',
          name: 'Microfranqueado Indireto (G2)',
          levelTag: 'G2',
          category: 'FRANQUEADO',
          date: '0',
          status: '0'
        },
        orders: g2Orders
      });
    }

    const allGroups: any[] = [];

    // Filtro por Nível:
    if (mmnLevelFilter === 'all' || mmnLevelFilter === '0') {
      const filteredOrders = g0Orders.filter(t => {
        if (!searchLower) return true;
        return t.orderId?.toLowerCase().includes(searchLower) ||
               t.affiliateName?.toLowerCase().includes(searchLower) ||
               t.cashbackType?.toLowerCase().includes(searchLower) ||
               t.date?.toLowerCase().includes(searchLower);
      });
      allGroups.push({
        key: 'g0',
        levelTag: 'G0',
        microfranqueado: g0Mf,
        orders: filteredOrders
      });
    }

    if (mmnLevelFilter === 'all' || mmnLevelFilter === '1') {
      if (g1Groups.length > 0) {
        g1Groups.forEach((g, idx) => {
          const filteredOrders = g.orders.filter((t: any) => {
            if (!searchLower) return true;
            return t.orderId?.toLowerCase().includes(searchLower) ||
                   t.affiliateName?.toLowerCase().includes(searchLower) ||
                   t.cashbackType?.toLowerCase().includes(searchLower) ||
                   t.date?.toLowerCase().includes(searchLower);
          });
          allGroups.push({
            key: `g1-${idx}`,
            levelTag: 'G1',
            microfranqueado: g.microfranqueado,
            orders: filteredOrders
          });
        });
      } else if (mmnLevelFilter === '1') {
        allGroups.push({
          key: 'g1-empty',
          levelTag: 'G1',
          microfranqueado: {
            id: 'g1-none',
            name: 'Nenhum Microfranqueado G1 Cadastrado',
            levelTag: 'G1',
            category: 'FRANQUEADO',
            date: '0',
            status: '0'
          },
          orders: []
        });
      }
    }

    if (mmnLevelFilter === 'all' || mmnLevelFilter === '2') {
      if (g2Groups.length > 0) {
        g2Groups.forEach((g, idx) => {
          const filteredOrders = g.orders.filter((t: any) => {
            if (!searchLower) return true;
            return t.orderId?.toLowerCase().includes(searchLower) ||
                   t.affiliateName?.toLowerCase().includes(searchLower) ||
                   t.cashbackType?.toLowerCase().includes(searchLower) ||
                   t.date?.toLowerCase().includes(searchLower);
          });
          allGroups.push({
            key: `g2-${idx}`,
            levelTag: 'G2',
            microfranqueado: g.microfranqueado,
            orders: filteredOrders
          });
        });
      } else if (mmnLevelFilter === '2') {
        allGroups.push({
          key: 'g2-empty',
          levelTag: 'G2',
          microfranqueado: {
            id: 'g2-none',
            name: 'Nenhum Microfranqueado G2 Cadastrado',
            levelTag: 'G2',
            category: 'FRANQUEADO',
            date: '0',
            status: '0'
          },
          orders: []
        });
      }
    }

    return allGroups;
  }, [user, profile, networkMembers, enrichedTransactions, mmnLevelFilter, searchQuery]);

  const globalAdvances = useMemo(() => {
    return transactions.filter(t => 
      (t.originalType === 'advance' || t.cashbackType?.includes('Adiantamento') || t.category === 'withdrawal' || t.description?.toLowerCase().includes('adiantamento')) &&
      Number(t.amount || 0) < 0
    );
  }, [transactions]);

  const globalTotalAdiantamentos = useMemo(() => {
    return globalAdvances.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
  }, [globalAdvances]);

  const totalsSummary = useMemo(() => {
    const pendingList = enrichedTransactions.filter(t => t.status === 'Pendente' || (t.status !== 'Pago' && t.status !== 'Cancelado' && t.status !== 'Recusado'));
    const paidList = enrichedTransactions.filter(t => t.status === 'Pago' || t.status === 'completed');

    const calcGroup = (list: any[]) => {
      // Filtrar apenas comissões ativas/reais geradas por contratos (sem saques/resgates negativos e sem cancelamentos/recusas)
      const commissionItems = list.filter(t => 
        Number(t.bruto || t.amount || 0) > 0 && 
        t.status !== 'Cancelado' && 
        t.status !== 'Recusado'
      );

      const uniqueOrders = new Map<string, number>();
      commissionItems.forEach(t => {
        const key = t.orderId && t.orderId !== '---' ? String(t.orderId) : `txn-${t.id}`;
        const amount = Number(t.contractAmount || 0);
        if (amount > 0) {
          const existing = uniqueOrders.get(key) || 0;
          if (amount > existing) {
            uniqueOrders.set(key, amount);
          } else if (!uniqueOrders.has(key)) {
            uniqueOrders.set(key, amount);
          }
        }
      });
      const totalContratos = Array.from(uniqueOrders.values()).reduce((acc, v) => acc + v, 0);
      const totalBruto = commissionItems.reduce((acc, t) => acc + Number(t.bruto || t.amount || 0), 0);
      const totalMensal = commissionItems
        .filter(t => t.cashbackType?.includes('Mensal'))
        .reduce((acc, t) => acc + Number(t.bruto || t.amount || 0), 0);
      const totalAnual = commissionItems
        .filter(t => t.cashbackType?.includes('Anual'))
        .reduce((acc, t) => acc + Number(t.bruto || t.amount || 0), 0);

      const percentualRepasse = totalContratos > 0 ? (totalBruto / totalContratos) * 100 : 0;
      return { totalContratos, percentualRepasse, totalBruto, totalMensal, totalAnual, count: commissionItems.length };
    };

    const pending = calcGroup(pendingList);
    const paid = calcGroup(paidList);
    const all = calcGroup(enrichedTransactions);

    // Saldo mensal disponível para saque/pagamento após abater adiantamentos globais
    const saldoMensalAReceber = Math.max(0, all.totalMensal - globalTotalAdiantamentos);

    return {
      pending,
      paid,
      all,
      totalAdiantamentos: globalTotalAdiantamentos,
      saldoMensalAReceber,
      poupancaAnualAcumulada: all.totalAnual
    };
  }, [enrichedTransactions, globalTotalAdiantamentos]);

  const totalsPending = totalsSummary.pending;

  const totalPending = totalsPending.totalBruto;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, mmnLevelFilter, searchQuery]);

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
    doc.text(`Afiliado: ${profile?.full_name || '---'} (${isUserPJ ? 'Pessoa Jurídica' : 'Pessoa Física'})`, 14, 33);
    doc.text(`Emissão: ${now}`, 145, 33);

    // Resumo
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Demonstrativo de Comissões & Cashback de Rede', 14, 52);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Categoria: Rede MMN (${mmnLevelFilter === 'all' ? 'G0 ao G2' : 'Nível G' + mmnLevelFilter}) | Tipo: ${activeFilter === 'all' ? 'Todos' : activeFilter === 'mensal' ? 'Mensal' : 'Anual'}`, 14, 59);
    doc.text(`Total Valor dos Contratos: ${totalsSummary.all.totalContratos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 65);
    doc.text(`Percentual de Repasse: ${totalsSummary.all.percentualRepasse.toFixed(2)}%`, 14, 71);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`(=) Valor Bruto do Cashback: ${totalsSummary.all.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 78);

    // Tabela
    const tableData: any[] = [];
    mmnHierarchyGroups.forEach(g => {
      tableData.push([
        '0',
        g.microfranqueado.name,
        g.levelTag,
        'FRANQUEADO',
        '0',
        '0',
        '0',
        '0',
        '0'
      ]);
      g.orders.forEach((t: any) => {
        tableData.push([
          `#${t.orderId}`,
          t.affiliateName.replace(' (Você)', '').replace(' (Regional)', ''),
          'AF',
          t.cashbackType,
          t.date,
          t.contractAmount ? t.contractAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---',
          t.percentage ? `${t.percentage.toFixed(0)}%` : '---',
          t.bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          t.cashbackType?.includes('Anual') ? 'Acumulando' : t.status
        ]);
      });
    });

    autoTable(doc, {
      startY: 85,
      head: [['ID PEDIDO', 'AFILIADO', 'NÍVEL', 'TIPO', 'DATA', 'VALOR CONTRATO', 'PERCENTUAL', 'VALOR BRUTO CASHBACK', 'STATUS']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255], 
        fontSize: 7.5, 
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: { 
        fontSize: 7.5,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'center', textColor: [79, 70, 229] },
        7: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
        8: { halign: 'center' }
      },
      styles: {
        lineColor: [241, 245, 249],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    const pageCount = (doc.internal as any).getNumberOfPages();
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
      const [statsData, activityData, configData, mfRes, pjReq, networkData] = await Promise.all([
        businessRules.getAffiliateStats(user.id),
        businessRules.getEcosystemActivity(user.id),
        businessRules.getMMNConfig(),
        businessRules.getMicrofranqueadoData(user.id),
        businessRules.checkMicrofranqueadoPjRequirement(user.id),
        businessRules.getAffiliateNetwork(user.id)
      ]);
      
      setStats(statsData);
      setTransactions(activityData);
      setMmnConfig(configData);
      setMicrofranqueadoData(mfRes);
      setPjRequirement(pjReq);
      setNetworkMembers(networkData || []);

      if (mfRes?.microfranqueado?.id) {
        const comRes = await businessRules.getComissoesMicrofranqueado(mfRes.microfranqueado.id);
        setComissoesData(comRes);
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigratePj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setMigratingPj(true);
      const res = await businessRules.migrarMicrofranqueadoPJ({
        userId: user.id,
        cnpj: pjCnpj,
        razaoSocial: pjRazaoSocial,
        nomeFantasia: pjNomeFantasia,
        pixKey: pjPixKey
      });

      if (res?.success) {
        toast.success(res.message || 'Cadastro PJ regularizado com sucesso!');
        setIsPjModalOpen(false);
        loadWalletData();
      } else {
        toast.error(res?.error || 'Erro ao realizar migração.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao processar migração para PJ.');
    } finally {
      setMigratingPj(false);
    }
  };

  const handleRegularizeLicense = async () => {
    if (!microfranqueadoData?.microfranqueado?.id) return;
    try {
      setRegularizing(true);
      const res = await businessRules.regularizarLicencaMicrofranqueado(microfranqueadoData.microfranqueado.id);
      if (res?.success) {
        toast.success('Licença regularizada e saldo desbloqueado com sucesso!');
        loadWalletData();
      } else {
        toast.error(res?.error || 'Erro ao regularizar licença.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha ao regularizar.');
    } finally {
      setRegularizing(false);
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
    <AffiliateLayout title="Financeiro de Rede">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Header with Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h2 className="text-3xl font-black text-midnight tracking-tighter uppercase italic">Financeiro de <span className="text-primary-blue">Rede</span></h2>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de ganhos e cashback da rede MMN</p>
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

        {/* Alerta se usuário não for Microfranqueado */}
        {microfranqueadoData && !microfranqueadoData.isMicrofranqueado && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-amber-500 text-midnight flex items-center justify-center shrink-0">
                <Wallet size={26} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-amber-950 uppercase text-sm">
                  Comissões de Rede são Exclusivas de Microfranqueados
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed max-w-2xl font-medium">
                  Seu cadastro atual é de <strong>Afiliado Premium (Seguro Vida Light)</strong>. O Seguro Vida Light contempla cobertura MBM de R$ 5.000, telemedicina 24h e sorteios da Loteria Federal, sem comissões de rede. Para ativar sua carteira financeira e receber até 33% de comissão (split 24% semanal / 9% anual), ative sua Licença de Microfranqueado.
                </p>
              </div>
            </div>
            <Link
              to="/afiliado/renovacoes"
              className="bg-amber-500 hover:bg-amber-400 text-midnight font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest shrink-0 transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              Ativar Microfranqueado
              <ArrowUpRight size={14} />
            </Link>
          </div>
        )}

        {/* ALERTA: MIGRAÇÃO OBRIGATÓRIA PARA PJ (LIMITE R$ 5.000 ATINGIDO) */}
        {pjRequirement?.isPjRequired && !isUserPJ && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/50 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-5">
              <div className="size-16 bg-amber-500 text-slate-950 rounded-3xl flex items-center justify-center shrink-0 font-black shadow-md shadow-amber-500/30">
                <Building2 size={32} />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-950 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">
                  ⚠️ Transição Tributária Obrigatória
                </div>
                <h4 className="text-xl font-black text-amber-950 uppercase tracking-tight">
                  Limite de R$ 5.000,00 Atingido como Pessoa Física
                </h4>
                <p className="text-xs font-medium text-amber-900/90 leading-relaxed max-w-2xl">
                  Seus ganhos acumulados atingiram <strong>R$ {Number(pjRequirement?.totalEarnings || 0).toFixed(2)}</strong>. Para cumprir as normas fiscais brasileiras e receber seus próximos repasses semanais com valor integral sem retenção na fonte (INSS 11% e IRRF), cadastre seu CNPJ/MEI.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPjModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Building2 size={16} /> Cadastrar CNPJ / MEI
            </button>
          </div>
        )}

        {/* CARD INFORMATIVO: PROGRESSO ATÉ R$ 5.000 (PF) */}
        {!isUserPJ && microfranqueadoData?.isMicrofranqueado && !pjRequirement?.isPjRequired && (
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-indigo-100 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-midnight uppercase tracking-wide">
                    Plano Pessoa Física (PF) — R$ {Number(pjRequirement?.totalEarnings || 0).toFixed(2)} / R$ 5.000,00
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    {Math.min(100, Math.round(((pjRequirement?.totalEarnings || 0) / 5000) * 100))}% da meta
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 max-w-xl">
                  Você opera como PF com emissão de Recibo RPA. Ao atingir R$ 5.000,00 acumulados, será solicitado seu CNPJ/MEI para receber 100% bruto sem descontos de INSS/IRRF.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPjModalOpen(true)}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:underline"
            >
              <Building2 size={14} /> Já possui MEI/CNPJ? Migrar agora
            </button>
          </div>
        )}

        {/* Balance Cards - Credit Card Style */}
        <div className="flex flex-col sm:flex-row items-stretch gap-6 md:gap-8">
           
           {/* Card 1: Comissões Semanais */}
           <motion.div 
             whileHover={{ y: -4 }}
             onClick={() => {
               setActiveFilter(activeFilter === 'mensal' ? 'all' : 'mensal');
               setCurrentPage(1);
             }}
             className={`w-full sm:w-[350px] aspect-[1.58/1] bg-slate-950 p-6 rounded-[1.75rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl transition-all cursor-pointer group shrink-0 ${
               activeFilter === 'mensal' ? 'ring-3 ring-emerald-500 shadow-emerald-500/20' : 'shadow-slate-900/20'
             }`}
           >
              {/* Design Elements */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-blue/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">COMISSÕES SEMANAIS</p>
                 </div>
                 <div className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
                   activeFilter === 'mensal' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-emerald-500 border-white/5'
                 }`}>
                    <Wallet size={16} />
                 </div>
              </div>

              <div className="relative z-10 my-auto">
                 <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase mb-1">
                   R$ {displayWeeklyCommission.toFixed(2).replace('.', ',')}
                 </h2>
                 <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                       Pagos toda terça-feira – {nextTuesdayFormatted}
                    </p>
                 </div>
              </div>

              {/* Card Footer Decoration */}
              <div className="relative z-10 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                 <div className="flex -space-x-1.5">
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                    <div className="size-4 rounded-full border border-white/20 bg-white/5"></div>
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest">SEMANAL • TODA TERÇA-FEIRA</span>
              </div>
           </motion.div>

           {/* Card 2: Bônus Anual Acumulado */}
           <motion.div 
             whileHover={{ y: -4 }}
             onClick={() => {
               setActiveFilter(activeFilter === 'anual' ? 'all' : 'anual');
               setCurrentPage(1);
             }}
             className={`w-full sm:w-[350px] aspect-[1.58/1] bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 p-6 rounded-[1.75rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl transition-all cursor-pointer group shrink-0 ${
               activeFilter === 'anual' ? 'ring-3 ring-blue-400 shadow-blue-500/20' : 'shadow-blue-900/20'
             }`}
           >
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">BÔNUS ANUAL ACUMULADO</p>
                 </div>
                 <div className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
                   activeFilter === 'anual' ? 'bg-white text-indigo-600 border-white' : 'bg-white/10 text-white border-white/10'
                 }`}>
                    <Calendar size={16} />
                 </div>
              </div>

              <div className="relative z-10 my-auto">
                 <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase mb-1">
                   R$ {displayAnnualBonus.toFixed(2).replace('.', ',')}
                 </h2>
                 <p className="text-[8px] font-black text-blue-200/70 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck size={11} /> Liberação 10 de dezembro.
                 </p>
              </div>

              <div className="relative z-10 flex justify-between items-center opacity-40">
                 <div className="flex gap-1">
                    <div className="w-4 h-1 bg-white/20 rounded-full"></div>
                    <div className="w-2 h-1 bg-white/20 rounded-full"></div>
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest text-blue-200">ANUAL • 10 DE DEZEMBRO</span>
              </div>
           </motion.div>

           {/* Card 3: Se houver comissões bloqueadas por inadimplência */}
           {comissoesData && Number(comissoesData.bloqueadoInadimplencia) > 0 && (
             <div className="w-full sm:w-[350px] aspect-[1.58/1] bg-rose-950/90 border border-rose-500/30 p-6 rounded-[1.75rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl shrink-0">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">COMISSÕES BLOQUEADAS</p>
                   <div className="size-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <Lock size={16} />
                   </div>
                </div>

                <div className="my-auto space-y-1">
                   <h2 className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
                     R$ {Number(comissoesData.bloqueadoInadimplencia).toFixed(2)}
                   </h2>
                   <p className="text-[9px] text-rose-200 leading-tight">
                     Retido por inadimplência da taxa de licença.
                   </p>
                </div>

                <button
                  onClick={handleRegularizeLicense}
                  disabled={regularizing}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {regularizing ? 'Processando...' : 'Regularizar e Desbloquear'}
                </button>
             </div>
           )}
        </div>

        {/* Bottom Section: Bank Info and Eligibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Eligibility Warning if blocked */}
           {!stats.isEligible && (
              <div className="lg:col-span-2 bg-rose-50 border border-rose-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                 <div className="flex items-center gap-6">
                    <div className="size-16 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-600 shrink-0">
                       <Clock size={32} />
                    </div>
                    <div>
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5">
                          🔒 Conta Inadimplente
                       </div>
                       <h4 className="text-xl font-black text-rose-900 uppercase tracking-tight">Pagamentos e Saques Bloqueados</h4>
                       <p className="text-xs font-medium text-rose-700/90 mt-1 max-w-lg">
                          Seu plano de assinatura está inativo ou expirado. De acordo com as normas da plataforma, usuários inadimplentes estão bloqueados para receber repasses e solicitar saques.
                       </p>
                    </div>
                 </div>
                 <Link 
                   to="/afiliado/renovacoes" 
                   className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-2"
                 >
                    Regularizar Plano <ChevronRight size={14} />
                 </Link>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
              <div>
                 <h2 className="text-2xl font-black text-midnight tracking-tighter uppercase italic underline decoration-primary-blue decoration-4 underline-offset-8">
                     Comissões de Rede MMN
                  </h2>
                  <p className="text-slate-500 font-medium mt-3">
                     Exibindo comissões de suas VENDAS DIRETAS (G0) e de sua rede de indicados (G1 e G2).
                  </p>
              </div>
              <div className="flex items-center gap-4">
                 {(activeFilter !== 'all' || mmnLevelFilter !== 'all') && (
                   <button 
                     onClick={() => {
                       setActiveFilter('all');
                       setMmnLevelFilter('all');
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

           {/* Subfiltro de Níveis MMN (G0, G1, G2 ou Todas) */}
           <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 shadow-sm">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">
               NÍVEL:
             </span>
             <button
               onClick={() => {
                 setMmnLevelFilter('all');
                 setCurrentPage(1);
               }}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                 mmnLevelFilter === 'all'
                   ? 'bg-slate-900 text-white shadow-md'
                   : 'text-slate-600 hover:text-slate-900 hover:bg-white'
               }`}
             >
               TODAS ({transactions.filter(t => t.level !== 'REG' && !t.isReseller && t.category !== 'reseller').length})
             </button>
             <button
               onClick={() => {
                 setMmnLevelFilter('0');
                 setCurrentPage(1);
               }}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                 mmnLevelFilter === '0'
                   ? 'bg-emerald-600 text-white shadow-md'
                   : 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/70'
               }`}
             >
               <span className="size-2 rounded-full bg-emerald-400" />
               G0 – VENDAS DIRETAS ({transactions.filter(t => t.level === '0').length})
             </button>
             <button
               onClick={() => {
                 setMmnLevelFilter('1');
                 setCurrentPage(1);
               }}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                 mmnLevelFilter === '1'
                   ? 'bg-indigo-600 text-white shadow-md'
                   : 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70'
               }`}
             >
               <span className="size-2 rounded-full bg-indigo-400" />
               G1 – VENDAS DOS MICROFRANQUEADOS INDICADOS DIRETO POR G0 ({transactions.filter(t => t.level === '1').length})
             </button>
             <button
               onClick={() => {
                 setMmnLevelFilter('2');
                 setCurrentPage(1);
               }}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                 mmnLevelFilter === '2'
                   ? 'bg-sky-600 text-white shadow-md'
                   : 'text-slate-700 hover:text-sky-600 hover:bg-sky-50/70'
               }`}
             >
               <span className="size-2 rounded-full bg-sky-400" />
               G2 – VENDAS DO MICROFRANQUEADO INDICADOS DIRETOS DE SEU G1 ({transactions.filter(t => t.level === '2').length})
             </button>
           </div>

           <div className="space-y-6">
              {(() => {
                const totalOrdersCount = mmnHierarchyGroups.reduce((acc, g) => acc + g.orders.length, 0);

                return (
                  <>
                    {/* Banner Consolidado de Cashback de Rede */}
                    <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-midnight text-white rounded-3xl border border-white/10 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="size-3 rounded-full bg-emerald-400 animate-pulse" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            Resumo de Comissões e Cashback de Rede
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Valores Brutos sem Descontos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total dos Contratos</p>
                          <p className="text-base lg:text-lg font-black text-white font-mono">
                            {totalsSummary.all.totalContratos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentual de Repasse</p>
                          <p className="text-base lg:text-lg font-black text-indigo-400 font-mono">
                            {totalsSummary.all.percentualRepasse.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Valor Bruto do Cashback</p>
                          <p className="text-base lg:text-lg font-black text-emerald-400 font-mono">
                            {totalsSummary.all.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-5 py-2">ID DO PEDIDO</th>
                            <th className="px-5 py-2">AFILIADO / ORIGEM</th>
                            <th className="px-3 py-2 text-center">NÍVEL</th>
                            <th className="px-4 py-2">CATEGORIA / PERÍODO</th>
                            <th className="px-4 py-2">DATA</th>
                            <th className="px-5 py-2 text-right">VALOR DO CONTRATO</th>
                            <th className="px-4 py-2 text-center">PERCENTUAL</th>
                            <th className="px-5 py-2 text-right text-emerald-700">VALOR BRUTO CASHBACK</th>
                            <th className="px-4 py-2 text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mmnHierarchyGroups.map((group) => (
                            <React.Fragment key={group.key}>
                              {/* Linha do Microfranqueado (G0, G1 ou G2) */}
                              <tr className="bg-slate-900 text-white font-bold border-y border-indigo-500/30">
                                <td className="px-5 py-3.5 rounded-l-2xl font-mono text-xs font-black text-slate-300">
                                  0
                                </td>
                                <td className="px-5 py-3.5 text-xs font-black text-white">
                                  <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{group.microfranqueado.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3.5 text-center">
                                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                                    group.levelTag === 'G0' 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                      : group.levelTag === 'G1' 
                                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  }`}>
                                    {group.levelTag}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/10 text-slate-200 uppercase tracking-wider">
                                    {group.microfranqueado.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-[10px] text-slate-400 font-mono">
                                  0
                                </td>
                                <td className="px-5 py-3.5 text-right text-xs font-mono text-slate-400">
                                  0
                                </td>
                                <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                                  0
                                </td>
                                <td className="px-5 py-3.5 text-right text-xs font-mono text-slate-400">
                                  0
                                </td>
                                <td className="px-4 py-3.5 rounded-r-2xl text-center text-[10px] font-mono text-slate-400">
                                  0
                                </td>
                              </tr>

                              {/* Pedidos dos Afiliados Premium vinculados logo abaixo deste Microfranqueado */}
                              {group.orders.length > 0 ? (
                                group.orders.map((t: any) => (
                                  <tr 
                                    key={t.id}
                                    className="bg-slate-50 hover:bg-white hover:shadow-md transition-all group border-b border-slate-100"
                                  >
                                    <td className="px-5 py-4 font-black text-midnight text-xs rounded-l-2xl whitespace-nowrap">
                                      #{t.orderId}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-slate-700 text-xs whitespace-nowrap">
                                      {t.affiliateName.replace(' (Você)', '').replace(' (Regional)', '')}
                                    </td>
                                    <td className="px-3 py-4 text-center whitespace-nowrap">
                                      <span 
                                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm"
                                        title="AF - Afiliado Premium"
                                      >
                                        AF
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                                        t.cashbackType?.includes('Anual') 
                                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      }`}>
                                        {t.cashbackType}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                      {t.date}
                                    </td>
                                    <td className="px-5 py-4 text-right font-mono font-bold text-xs text-slate-800 whitespace-nowrap">
                                      {Number(t.contractAmount || 0) > 0 
                                        ? Number(t.contractAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                        : '---'}
                                    </td>
                                    <td className="px-4 py-4 text-center font-mono font-black text-xs text-indigo-600 whitespace-nowrap">
                                      {Number(t.percentage || 0) > 0 ? `${Number(t.percentage).toFixed(0)}%` : '---'}
                                    </td>
                                    <td className="px-5 py-4 text-right font-mono font-black text-sm text-emerald-600 whitespace-nowrap">
                                      +{Number(t.bruto || t.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-4 rounded-r-2xl text-center whitespace-nowrap">
                                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase ${
                                        t.status === 'Cancelado' || t.status === 'Recusado'
                                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                          : t.status === 'Pago'
                                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                          : t.cashbackType?.includes('Anual')
                                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        {t.cashbackType?.includes('Anual') ? 'Acumulando' : t.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={9} className="px-6 py-2.5 text-center text-[10px] font-medium text-slate-400 italic bg-slate-50/50 rounded-2xl">
                                    Nenhum pedido de Afiliado Premium vinculado a este Microfranqueado no momento.
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          {/* 1. Lançamentos Quitados/Pagos se houver */}
                          {totalsSummary.paid.count > 0 && (
                            <tr className="bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] border-b border-emerald-900/50">
                              <td colSpan={5} className="px-6 py-3.5 rounded-l-2xl">
                                <div className="flex items-center gap-2 text-emerald-300">
                                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>TOTAIS QUITADOS / PAGOS (VIA PIX)</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-xs text-emerald-200">
                                {totalsSummary.paid.totalContratos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-xs text-emerald-300">
                                {totalsSummary.paid.percentualRepasse > 0 ? `${totalsSummary.paid.percentualRepasse.toFixed(2)}%` : '---'}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-sm text-emerald-300 font-black">
                                {totalsSummary.paid.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-3.5 rounded-r-2xl text-center text-[9px] text-emerald-400">PAGO</td>
                            </tr>
                          )}

                          {/* 2. Total Adiantamentos Pagos se houver */}
                          {totalsSummary.totalAdiantamentos > 0 && (
                            <tr className="bg-amber-950/80 text-amber-300 font-black uppercase tracking-widest text-[10px] border-b border-white/10">
                              <td colSpan={7} className="px-6 py-3 rounded-l-2xl">
                                <div className="flex items-center gap-2">
                                  <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                                  <span>(-) ADIANTAMENTO DE RENDIMENTOS (PAGO VIA PIX)</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-sm text-rose-400 font-bold">
                                - {totalsSummary.totalAdiantamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-3 rounded-r-2xl text-center text-[9px] text-amber-300 font-bold">
                                ADIANTADO
                              </td>
                            </tr>
                          )}

                          {/* 3. Saldo Mensal Restante */}
                          <tr className="bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] border-b border-white/10">
                            <td colSpan={5} className="px-6 py-4 rounded-l-2xl">
                              <div className="flex items-center gap-2 text-slate-200">
                                <span className={`size-2 rounded-full ${totalsSummary.saldoMensalAReceber > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                                <span>
                                  {totalsSummary.saldoMensalAReceber > 0 
                                    ? '(=) SALDO MENSAL A RECEBER (NO DIA 10)'
                                    : '(=) SALDO MENSAL A RECEBER NO DIA 10 (QUITADO VIA ADIANTAMENTO)'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-xs text-slate-200">
                              {totalsSummary.all.totalContratos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-xs text-indigo-300">
                              {totalsSummary.all.percentualRepasse > 0 ? `${totalsSummary.all.percentualRepasse.toFixed(0)}%` : '---'}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-sm text-emerald-400 font-black">
                              {totalsSummary.all.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-4 rounded-r-2xl text-center text-[9px] text-amber-400 font-bold">
                              {totalsSummary.saldoMensalAReceber > 0 ? 'PENDENTE' : 'ACUMULADO'}
                            </td>
                          </tr>

                          {/* 4. Poupança Anual Acumulada */}
                          {totalsSummary.poupancaAnualAcumulada > 0 && (
                            <tr className="bg-indigo-950/80 text-indigo-200 font-black uppercase tracking-widest text-[10px]">
                              <td colSpan={7} className="px-6 py-3 rounded-l-2xl">
                                <div className="flex items-center gap-2 text-indigo-300">
                                  <span className="size-2 rounded-full bg-indigo-400" />
                                  <span>PROVISÃO / POUPANÇA ANUAL (2% - ACUMULANDO PARA 10/DEZ)</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-sm text-indigo-300 font-black">
                                {totalsSummary.poupancaAnualAcumulada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-3 rounded-r-2xl text-center text-[9px] text-indigo-300 font-bold">
                                10/DEZ
                              </td>
                            </tr>
                          )}
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

      {/* MODAL DE MIGRAÇÃO PJ / MEI */}
      <AnimatePresence>
        {isPjModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPjModalOpen(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 z-10 border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                      Cadastrar Empresa / MEI
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Transição para Pessoa Jurídica (PJ)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPjModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-midnight cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleMigratePj} className="space-y-5">
                <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl text-xs text-purple-950 leading-relaxed font-medium">
                  💡 <strong>Vantagem PJ:</strong> Com seu CNPJ (inclusive MEI), você recebe 100% dos seus repasses semanais via PIX da empresa, isento de retenções na fonte de INSS (11%) e tabela progressiva de IRRF.
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    CNPJ da Empresa ou MEI *
                  </label>
                  <input
                    required
                    type="text"
                    value={pjCnpj}
                    onChange={(e) => setPjCnpj(formatCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold font-mono text-midnight"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Razão Social / Nome MEI *
                  </label>
                  <input
                    required
                    type="text"
                    value={pjRazaoSocial}
                    onChange={(e) => setPjRazaoSocial(e.target.value)}
                    placeholder="Ex: João da Silva Serviços MEI"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-midnight"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Nome Fantasia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pjNomeFantasia}
                    onChange={(e) => setPjNomeFantasia(e.target.value)}
                    placeholder="Ex: Urba Serviços Digitais"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-midnight"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Chave PIX da Empresa (Recomendado: CNPJ)
                  </label>
                  <input
                    type="text"
                    value={pjPixKey}
                    onChange={(e) => setPjPixKey(e.target.value)}
                    placeholder="CNPJ, E-mail ou Chave Aleatória da conta PJ"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-midnight"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPjModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={migratingPj}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {migratingPj ? 'Salvando...' : 'Confirmar e Migrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AffiliateLayout>
  );
}
