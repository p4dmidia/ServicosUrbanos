import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderArchive,
  ExternalLink,
  Loader2,
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Wallet,
  ArrowDownRight,
  ShoppingBag,
  Hash,
  Receipt,
  Layers,
  Tag,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AffiliateFinancialSummary() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copiedRpa, setCopiedRpa] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});

  // Competência selecionada (Mês e Ano)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [statement, setStatement] = useState<any>(null);
  const [archives, setArchives] = useState<any[]>([]);
  const [networkMembers, setNetworkMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'statement' | 'archives'>('statement');

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Ciclos semanais do mês selecionado enriquecidos com os pedidos da competência
  const weeklyCycles = useMemo(() => {
    const rawCycles = (businessRules as any).getWeeklyCyclesForMonth(selectedYear, selectedMonth);
    const orders = statement?.ordersBreakdown || [];

    const parseOrderDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();

    return rawCycles.map((cycle: any) => {
      const cycleOrders = orders.filter((o: any) => {
        const oDate = parseOrderDate(o.date);
        if (!oDate) return false;
        return oDate >= cycle.cycleStart && oDate <= cycle.cycleEnd;
      });

      const bruto = cycleOrders.reduce((sum: number, o: any) => sum + Number(o.commissionAmount || 0), 0);
      const contractTotal = cycleOrders.reduce((sum: number, o: any) => sum + Number(o.contractAmount || o.orderAmount || 0), 0);

      const baseRpa = statement?.rpaNumber || `RPA Nº ${selectedYear}${String(selectedMonth).padStart(2, '0')}`;
      const rpaParts = baseRpa.split('-');
      const rpaWeeklyNumber = rpaParts.length === 2 
        ? `${rpaParts[0]}-${cycle.rpaSuffix}-${rpaParts[1]}` 
        : `${baseRpa}-${cycle.rpaSuffix}`;

      const isPaid = statement?.isPaid || (now > cycle.payoutDate && bruto > 0 && !cycleOrders.some((o: any) => o.status === 'Pendente' || o.status === 'pending'));
      const isCurrentWeek = now >= cycle.cycleStart && now <= cycle.cycleEnd;
      const isPending = !isPaid && bruto > 0;

      return {
        ...cycle,
        orders: cycleOrders,
        pedidosCount: cycleOrders.length,
        bruto,
        liquido: bruto,
        contractTotal,
        rpaWeeklyNumber,
        isPaid,
        isCurrentWeek,
        isPending
      };
    });
  }, [selectedYear, selectedMonth, statement]);

  const monthlyWeeklyTotals = useMemo(() => {
    let totalPago = 0;
    let totalPrevisto = 0;
    let totalPedidosMes = 0;

    weeklyCycles.forEach((w: any) => {
      totalPedidosMes += w.pedidosCount;
      if (w.isPaid) {
        totalPago += w.liquido;
      } else {
        totalPrevisto += w.liquido;
      }
    });

    return {
      totalPago,
      totalPrevisto,
      totalPedidosMes,
      totalGeralMes: totalPago + totalPrevisto
    };
  }, [weeklyCycles]);

  const toggleWeekExpand = (weekNumber: number) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNumber]: !prev[weekNumber]
    }));
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stmtData, archivesData, netMembers] = await Promise.all([
        businessRules.getConsolidatedFinancialStatement(user.id, selectedYear, selectedMonth),
        businessRules.getMonthlyPayoutArchives({ userId: user.id }),
        businessRules.getAffiliateNetwork(user.id)
      ]);
      setStatement(stmtData);
      setArchives(archivesData || []);
      setNetworkMembers(netMembers || []);
    } catch (error) {
      console.error('Erro ao carregar resumo financeiro consolidado:', error);
      toast.error('Erro ao calcular resumo financeiro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCopyRPA = () => {
    if (!statement?.rpaNumber) return;
    navigator.clipboard.writeText(statement.rpaNumber);
    setCopiedRpa(true);
    toast.success(`Número do RPA copiado: ${statement.rpaNumber}`);
    setTimeout(() => setCopiedRpa(false), 2500);
  };

  // Agrupamento hierárquico MMN dos pedidos do RPA: Microfranqueados G0, G1 e G2
  const mmnHierarchyGroups = useMemo(() => {
    const rawBreakdown = (statement?.ordersBreakdown || []).filter((t: any) => t.level !== 'REG');

    // 1. G0 - O próprio Microfranqueado autenticado (Vendas Diretas)
    const g0Mf = {
      id: user?.id || 'g0',
      name: profile?.full_name || statement?.beneficiaryName || 'Você (Microfranqueado)',
      levelTag: 'G0',
      category: 'MICROFRANQUEADO',
      date: '0',
      status: '0'
    };
    const g0Orders = rawBreakdown.filter((t: any) => t.level === '0' || t.level === 0 || t.level === 'G0');

    // 2. G1 - Microfranqueados indicados direto por G0
    const g1Members = (networkMembers || []).filter((m: any) => Number(m.level) === 1);
    const g1Orders = rawBreakdown.filter((t: any) => t.level === '1' || t.level === 1 || t.level === 'G1');

    const g1Groups: any[] = [];
    if (g1Members.length > 0) {
      g1Members.forEach(m => {
        const orders = g1Orders.filter((t: any) => t.sellerId === m.id || t.referredBy === m.id);
        const resolvedOrders = orders.length > 0 ? orders : (g1Members.length === 1 ? g1Orders : []);
        if (resolvedOrders.length > 0) {
          g1Groups.push({
            key: `g1-${m.id}`,
            levelTag: 'G1',
            microfranqueado: {
              id: m.id,
              name: m.name,
              levelTag: 'G1',
              category: 'MICROFRANQUEADO',
              date: '0',
              status: '0'
            },
            orders: resolvedOrders
          });
        }
      });
    } else if (g1Orders.length > 0) {
      const seller = g1Orders[0]?.sellerName || g1Orders[0]?.affiliateName || 'Microfranqueado Indicado Direto (G1)';
      g1Groups.push({
        key: 'g1-default',
        levelTag: 'G1',
        microfranqueado: {
          id: 'g1-default',
          name: seller,
          levelTag: 'G1',
          category: 'MICROFRANQUEADO',
          date: '0',
          status: '0'
        },
        orders: g1Orders
      });
    }

    // 3. G2 - Microfranqueados indicados diretos de seu G1
    const g2Members = (networkMembers || []).filter((m: any) => Number(m.level) === 2);
    const g2Orders = rawBreakdown.filter((t: any) => t.level === '2' || t.level === 2 || t.level === 'G2');

    const g2Groups: any[] = [];
    if (g2Members.length > 0) {
      g2Members.forEach(m => {
        const orders = g2Orders.filter((t: any) => t.sellerId === m.id || t.referredBy === m.id);
        const resolvedOrders = orders.length > 0 ? orders : (g2Members.length === 1 ? g2Orders : []);
        if (resolvedOrders.length > 0) {
          g2Groups.push({
            key: `g2-${m.id}`,
            levelTag: 'G2',
            microfranqueado: {
              id: m.id,
              name: m.name,
              levelTag: 'G2',
              category: 'MICROFRANQUEADO',
              date: '0',
              status: '0'
            },
            orders: resolvedOrders
          });
        }
      });
    } else if (g2Orders.length > 0) {
      const seller = g2Orders[0]?.sellerName || g2Orders[0]?.affiliateName || 'Microfranqueado Indireto (G2)';
      g2Groups.push({
        key: 'g2-default',
        levelTag: 'G2',
        microfranqueado: {
          id: 'g2-default',
          name: seller,
          levelTag: 'G2',
          category: 'MICROFRANQUEADO',
          date: '0',
          status: '0'
        },
        orders: g2Orders
      });
    }

    const allGroups: any[] = [];
    if (g0Orders.length > 0 || (g1Groups.length === 0 && g2Groups.length === 0)) {
      allGroups.push({
        key: 'g0',
        levelTag: 'G0',
        microfranqueado: g0Mf,
        orders: g0Orders
      });
    }

    g1Groups.forEach(g => allGroups.push(g));
    g2Groups.forEach(g => allGroups.push(g));

    return allGroups;
  }, [user, profile, statement?.ordersBreakdown, statement?.beneficiaryName, networkMembers]);

  // Totais agregados da tabela de pedidos vinculados ao RPA
  const { totalContratosUnicos, totalComissaoCalculada, mediaPercentual } = useMemo(() => {
    if (!statement?.ordersBreakdown || statement.ordersBreakdown.length === 0) {
      return { totalContratosUnicos: 0, totalComissaoCalculada: 0, mediaPercentual: 0 };
    }
    const uniqueOrders = new Map<string, number>();
    let totalComissao = 0;

    statement.ordersBreakdown.forEach((o: any) => {
      const key = o.orderId && o.orderId !== '---' ? String(o.orderId) : (o.orderNumber || o.id);
      const amt = Number(o.contractAmount || o.orderAmount || o.amount || 0);
      if (!uniqueOrders.has(key) || amt > (uniqueOrders.get(key) || 0)) {
        uniqueOrders.set(key, amt);
      }
      totalComissao += Number(o.commissionAmount || o.bruto || 0);
    });

    const totalContratos = Array.from(uniqueOrders.values()).reduce((a, b) => a + b, 0);
    const perc = totalContratos > 0 ? (totalComissao / totalContratos) * 100 : 0;

    return {
      totalContratosUnicos: totalContratos,
      totalComissaoCalculada: totalComissao,
      mediaPercentual: perc
    };
  }, [statement?.ordersBreakdown]);

  const handlePrintPDF = (specificWeek?: any) => {
    if (!statement) return;
    const doc = new jsPDF();

    const targetPeriodo = specificWeek ? specificWeek.periodoStr : statement.periodoStr;
    const targetPrevisao = specificWeek ? specificWeek.previsaoPagamentoStr : statement.previsaoPagamentoStr;
    const targetRpa = specificWeek ? specificWeek.rpaWeeklyNumber : (statement.rpaNumber || 'RPA-PENDENTE');

    // Título Principal
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text(
      specificWeek 
        ? `REPASSE SEMANAL DE REDE MMN - MICROFRANQUEADO (${specificWeek.weekLabel.toUpperCase()})` 
        : 'REPASSE SEMANAL DE REDE MMN - MICROFRANQUEADO - RESUMO DO PAGAMENTO', 
      105, 16, { align: 'center' }
    );

    // Subtítulos
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`PERIODO DE ${targetPeriodo}  •  DOCUMENTO / RECIBO: ${targetRpa}`, 105, 23, { align: 'center' });
    doc.text(`PREVISÃO DE PAGAMENTO: ${targetPrevisao}`, 105, 29, { align: 'center' });

    // Faixa Amarela do Beneficiário
    doc.setFillColor(254, 240, 138); // Amarelo
    doc.rect(14, 34, 182, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`MICROFRANQUEADO - ${statement.beneficiaryName.toUpperCase()}  |  ${targetRpa}`, 105, 40, { align: 'center' });

    // Chave Pix & Pedidos Vinculados
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const pedidosLabel = specificWeek 
      ? (specificWeek.orders.map((o: any) => o.orderNumber).join(', ') || 'Nenhum')
      : ((statement.ordersList || []).join(', ') || 'Nenhum');
    doc.text(`CHAVE PIX: ${statement.pixKey}   |   PEDIDOS VINCULADOS: ${pedidosLabel}`, 105, 48, { align: 'center' });

    // Tabela do Demonstrativo Consolidado
    const tableRows = [
      [
        'Cashback semanal da Rede de MMN (G0 AO G2) do Microfranqueado',
        statement.brutoMensalMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        `Cashback anual MICROFRANQUEADO periodo ${statement.annualPeriodLabel}`,
        statement.brutoAnualMmn > 0 
          ? statement.brutoAnualMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : 'R$ 0,00'
      ],
      [
        'TOTAL BRUTO',
        statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'INSS (0% - INTERMEDIAÇÃO DE NEGÓCIOS) 0% de retenção na fonte. Afiliado autônomo recolhe individualmente',
        statement.isPJ ? 'Isento (PJ)' : 'R$ 0,00 (0%)'
      ],
      [
        'BASE DE CÁLCULO DO IRPF (BRUTO - DEDUÇÃO) Base de apuração para aplicação da tabela progressiva RFB',
        statement.isPJ ? 'Isento (PJ)' : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'IRRF - Retenção na Fonte conforme faixa de rendimentos da RFB (Tabela 2026 / Lei 15.270)',
        statement.isPJ || statement.irrf === 0 ? 'R$ 0,00' : `- ${statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      ],
      [
        'LÍQUIDO A RECEBER - Disponível para saque e transferência VIA PIX',
        statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        `TOTAL A RECEBER ATÉ ${statement.limiteNotaFiscalStr || statement.previsaoPagamentoStr}`,
        statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]
    ];

    autoTable(doc, {
      startY: 52,
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        lineColor: [51, 65, 85],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 130 },
        1: { halign: 'right', fontStyle: 'bold', cellWidth: 52 }
      },
      didParseCell: (data) => {
        // Linhas de cashback anual em vermelho
        if (data.row.index === 1) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        // Total Bruto
        if (data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
        }
        // Total a receber em amarelo
        if (data.row.index === 7) {
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
        // Líquido em destaque verde
        if (data.row.index === 6) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontSize = 9.5;
        }
      }
    });

    let lastY = (doc as any).lastAutoTable.finalY + 8;

    // Tabela Secundária: Discriminação dos Pedidos e Comissões
    if (mmnHierarchyGroups && mmnHierarchyGroups.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`DISCRIMINAÇÃO DOS PEDIDOS E COMISSÕES DA COMPETÊNCIA (${statement.rpaNumber || 'RPA'})`, 14, lastY);

      const tableRowsGrouped: any[] = [];
      mmnHierarchyGroups.forEach((group: any) => {
        // Linha master do microfranqueado
        tableRowsGrouped.push([
          '0',
          group.microfranqueado.name,
          group.levelTag,
          'MICROFRANQUEADO',
          '0',
          '0',
          '0',
          '0',
          '0'
        ]);
        // Pedidos
        group.orders.forEach((order: any) => {
          tableRowsGrouped.push([
            order.orderNumber,
            order.affiliateName || 'Afiliado',
            'AF',
            order.category || 'SEMANAL',
            order.date,
            Number(order.contractAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            order.rate || `${order.percentage || 21}%`,
            Number(order.commissionAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            order.status
          ]);
        });
      });

      // Rodapé
      tableRowsGrouped.push([
        'TOTAL BRUTO MENSAL APURADO',
        '',
        '',
        '',
        '',
        totalContratosUnicos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        `${mediaPercentual.toFixed(0)}%`,
        statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        'BRUTO'
      ]);
      tableRowsGrouped.push([
        '(=) SALDO SEMANAL A RECEBER',
        '',
        '',
        '',
        '',
        '',
        '',
        statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        'A RECEBER'
      ]);

      autoTable(doc, {
        startY: lastY + 3,
        head: [['ID PEDIDO', 'AFILIADO / ORIGEM', 'NÍVEL', 'CATEGORIA', 'DATA', 'VALOR CONTRATO', 'PERC.', 'VALOR BRUTO', 'STATUS']],
        body: tableRowsGrouped,
        theme: 'striped',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          lineColor: [203, 213, 225],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { halign: 'center', cellWidth: 14 },
          3: { halign: 'center', cellWidth: 22 },
          4: { cellWidth: 18 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'center', cellWidth: 14 },
          7: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 22 },
          8: { halign: 'center', cellWidth: 15 }
        }
      });

      lastY = (doc as any).lastAutoTable.finalY + 8;
    }

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const pdfFileName = specificWeek 
      ? `repasse-semanal-${specificWeek.rpaSuffix.toLowerCase()}-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`
      : `repasse-semanal-microfranqueado-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`;
    doc.save(pdfFileName);
  };

  const handleExportCSV = () => {
    if (!statement) return;
    businessRules.exportConsolidatedPayoutsCSV([statement], statement.refMonth);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  return (
    <AffiliateLayout 
      title="Financeiro Resumo"
      customBalance={statement?.isPaid ? 0 : statement?.liquido}
      customBalanceLabel={statement?.isPaid ? "Competência Quitada" : "Comissão Semanal Disponível (Terça-Feira)"}
    >
      <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-5xl mx-auto">
        
        {/* Header com Navegação Mês a Mês */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-primary-blue/10 text-primary-blue rounded-xl">
                <BarChart3 size={20} />
              </span>
              <h2 className="text-xl lg:text-2xl font-black text-midnight tracking-tight uppercase italic">
                Financeiro <span className="text-primary-blue">Resumo Consolidado</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Demonstrativo oficial de repasses semanais: Rede MMN (G0 ao G2) com apuração tributária
            </p>
          </div>

          {/* Navegador de Mês */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm"
              title="Mês Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-center min-w-[170px]">
              <span className="text-xs font-black text-midnight uppercase tracking-wider block capitalize">
                {monthLabel}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Competência
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm"
              title="Próximo Mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Abas: Demonstrativo do Mês vs Pasta de Arquivos */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('statement')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'statement'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText size={16} />
            Demonstrativo Consolidado
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'archives'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderArchive size={16} />
            Pasta de Pagamentos Semanais
          </button>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="size-10 text-primary-blue animate-spin opacity-50" />
          </div>
        ) : activeTab === 'statement' && statement ? (
          <div className="space-y-6">
            
            {/* Status Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              statement.isPaid 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {statement.isPaid ? <CheckCircle2 size={22} className="text-emerald-600" /> : <Clock size={22} className="text-amber-600" />}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    Status: {statement.isPaid ? 'Pagamento Efetivado / Quitado' : 'Pagamento Programado (Pendente)'}
                  </p>
                  <p className="text-[10px] font-bold opacity-80">
                    {statement.isPaid 
                      ? `Valor creditado na chave PIX cadastrada. Comprovante arquivado na pasta.`
                      : `Previsão de quitação no dia ${statement.previsaoPagamentoStr} via PIX.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {statement.receiptUrl && (
                  <a
                    href={statement.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink size={14} /> Ver Comprovante
                  </a>
                )}
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download size={14} /> Exportar CSV
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* GRID DE 3 CARDS MODERNOS: RESUMO CONSOLIDADO (PRINT 2) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Semanal da Rede MMN */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    SEMANAL DA REDE MMN
                  </span>
                  <div className="size-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-tight">
                    {statement.brutoMensalMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    G0 ao G2 da Rede
                  </p>
                </div>
              </div>

              {/* Card 2: Total Bruto */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    TOTAL BRUTO
                  </span>
                  <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-tight">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-1">
                    Base de Emissão de RPA
                  </p>
                </div>
              </div>

              {/* Card 3: Líquido a Receber / Quitado */}
              <div className="bg-gradient-to-br from-emerald-900/80 via-emerald-950 to-slate-950 p-6 rounded-3xl border border-emerald-500/40 shadow-xl shadow-emerald-950/40 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {statement.isPaid ? 'LÍQUIDO PAGO / QUITADO' : 'LÍQUIDO A RECEBER'}
                  </span>
                  <div className="size-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-1">
                    Transferência VIA PIX
                  </p>
                </div>
              </div>

            </div>

            {/* CARD DETALHADO: DEMONSTRATIVO OFICIAL CONSOLIDADO */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
              
              {/* Cabeçalho do Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full">
                      Resumo do Pagamento
                    </span>
                    <button
                      onClick={handleCopyRPA}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase px-3 py-1 rounded-full bg-slate-900 text-amber-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                      title="Clique para copiar o número do RPA"
                    >
                      <Receipt size={13} className="text-amber-400" />
                      {statement.rpaNumber || 'RPA Nº PENDENTE'}
                      {copiedRpa ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="opacity-60" />}
                    </button>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-midnight uppercase tracking-tight">
                    REPASSE SEMANAL DE REDE MMN - MICROFRANQUEADO
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    PERÍODO DE {statement.periodoStr} • PREVISÃO DE PAGAMENTO: {statement.previsaoPagamentoStr}
                  </p>
                </div>

                {/* Box de Chave PIX e Beneficiário */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1 min-w-[260px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Beneficiário:</span>
                    <span className="text-[10px] font-mono font-bold text-primary-blue">{statement.rpaNumber}</span>
                  </div>
                  <div className="font-black text-midnight text-sm uppercase">{statement.beneficiaryName}</div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX:</span>
                    <span className="font-mono font-black text-slate-800">{statement.pixKey}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="font-bold text-slate-500">
                      {statement.isPJ ? 'Pessoa Jurídica (Isento via NF)' : 'Pessoa Física (RPA - INSS/IRRF)'}
                    </span>
                    <span className="font-black text-slate-700">
                      {statement.ordersBreakdown?.length || 0} pedido(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner Total a Receber ou Quitado (Print 2) */}
              {statement.isPaid ? (
                <div className="bg-emerald-100 border border-emerald-300/80 rounded-2xl p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide block text-emerald-900">
                        PAGAMENTO EFETIVADO & QUITADO
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold">
                        Documento: {statement.rpaNumber} • Transferido via PIX • {(statement.ordersList || []).length} pedido(s) vinculados
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-900 shrink-0">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ) : (
                <div className="bg-amber-100 border border-amber-300/80 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={20} className="text-amber-700 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide block">
                        TOTAL A RECEBER ATÉ {statement.limiteNotaFiscalStr || statement.previsaoPagamentoStr}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold">
                        Documento: {statement.rpaNumber} • {(statement.ordersBreakdown || []).length} pedido(s) apurado(s)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-900 shrink-0">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              {/* Linhas Discriminatórias Fiscais (Print 3) */}
              <div className="space-y-2 text-xs md:text-sm">
                
                {/* 1. Cashback Semanal da Rede MMN do Microfranqueado */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      Cashback semanal da Rede de MMN (G0 AO G2) do Microfranqueado
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Comissões de rede ativas apuradas no período de: {statement.periodoStr}
                    </span>
                  </div>
                  <span className="font-mono font-black text-midnight">
                    {statement.brutoMensalMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 2. Cashback Anual Microfranqueado */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      Cashback anual MICROFRANQUEADO periodo {statement.annualPeriodLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isDecemberAnnualPayout 
                        ? 'Acumulado anual liberado no ciclo de 10 de Dezembro'
                        : statement.acumuladoAnualMmn > 0 
                          ? 'Acumulado na Poupança Urba (liberação em 10 de Dezembro)'
                          : 'Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro'}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${statement.isDecemberAnnualPayout ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {statement.isDecemberAnnualPayout
                      ? (statement.brutoAnualMmn > 0 ? statement.brutoAnualMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00')
                      : (statement.acumuladoAnualMmn > 0 
                          ? `${statement.acumuladoAnualMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Poupança)` 
                          : 'R$ 0,00')}
                  </span>
                </div>

                {/* 3. TOTAL BRUTO */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="font-black text-midnight uppercase tracking-wider">
                    Total Bruto
                  </span>
                  <span className="font-mono font-black text-midnight text-base">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 4. INSS */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      INSS (0% - INTERMEDIAÇÃO DE NEGÓCIOS) 0% de retenção na fonte. Afiliado autônomo recolhe individualmente
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isPJ ? 'Pessoa Jurídica isenta de retenção previdenciária' : '0% de retenção na fonte. Afiliado autônomo recolhe individualmente'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-600">
                    R$ 0,00 (0%)
                  </span>
                </div>

                {/* 5. Base de Cálculo IRPF */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      BASE DE CÁLCULO DO IRPF (BRUTO - DEDUÇÃO)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Base de apuração para aplicação da tabela progressiva RFB
                    </span>
                  </div>
                  <span className="font-mono font-black text-slate-700">
                    {statement.isPJ 
                      ? 'Isento (PJ)' 
                      : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 6. IRRF */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div>
                    <span className="font-bold text-emerald-950 uppercase block">
                      IRRF - Retenção na Fonte conforme faixa de rendimentos da RFB (Tabela 2026 / Lei 15.270)
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {statement.isPJ ? 'Isento para Pessoa Jurídica' : 'Retenção na fonte calculada pela tabela progressiva oficial'}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${statement.isPJ || statement.irrf === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {statement.isPJ || statement.irrf === 0 
                      ? 'R$ 0,00' 
                      : `- ${statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </span>
                </div>

                {/* 7. LÍQUIDO A RECEBER */}
                <div className={`flex items-center justify-between p-4 rounded-2xl text-white shadow-lg mt-4 ${statement.isPaid ? 'bg-emerald-700' : 'bg-emerald-600'}`}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                      {statement.isPaid ? <CheckCircle2 size={20} /> : <Wallet size={20} />}
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        {statement.isPaid ? 'LÍQUIDO PAGO / QUITADO' : 'LÍQUIDO A RECEBER'}
                      </span>
                      <span className="text-[10px] text-emerald-100 font-bold">
                        {statement.isPaid 
                          ? 'Transferência PIX efetivada com sucesso' 
                          : 'Disponível para saque e transferência VIA PIX'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xl lg:text-2xl">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 8. TOTAL A RECEBER ATÉ (Print 3) */}
                <div className="bg-amber-100 border border-amber-300/80 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={20} className="text-amber-700 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide block">
                        TOTAL A RECEBER ATÉ {statement.limiteNotaFiscalStr || statement.previsaoPagamentoStr}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold">
                        Documento: {statement.rpaNumber} • {(statement.ordersBreakdown || []).length} pedido(s) apurado(s)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-900 shrink-0">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

              </div>

            </div>

            {/* SEÇÃO: DISCRIMINAÇÃO DOS PEDIDOS E COMISSÕES (PRINT 4) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <ShoppingBag size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                        Discriminação dos Pedidos e Comissões
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {statement.rpaNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Detalhamento de cada transação de pedido que compõe este repasse
                    </p>
                  </div>
                </div>

                {/* Badges de Contagem */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs">
                    <Hash size={16} className="text-primary-blue" />
                    <span className="font-bold text-slate-600">Total de Pedidos:</span>
                    <span className="font-mono font-black text-midnight">
                      {statement.ordersBreakdown?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista dos Números de Pedidos Vinculados */}
              {statement.ordersList && statement.ordersList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-600">
                      <Tag size={14} className="text-amber-500" />
                      <span>Número dos Pedidos da Competência:</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      {statement.ordersBreakdown?.length || 0} {(statement.ordersBreakdown?.length || 0) === 1 ? 'pedido apurado' : 'pedidos apurados'} Total a Receber: {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {statement.ordersList.map((orderNum: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs font-black shadow-sm flex items-center gap-1.5"
                      >
                        <Hash size={12} className="opacity-70" />
                        {orderNum.replace('#', '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de Discriminação de Valores Padrão MMN (Print 4) */}
              {!statement.ordersBreakdown || statement.ordersBreakdown.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <ShoppingBag size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wide">
                    Nenhum pedido processado nesta competência
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Assim que novas vendas da rede de Microfranqueados ocorrerem em {monthLabel}, elas serão discriminadas aqui com seus respectivos números e alíquotas.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-separate border-spacing-y-2.5 p-3">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-4 py-2">ID DO PEDIDO</th>
                        <th className="px-4 py-2">AFILIADO / ORIGEM</th>
                        <th className="px-3 py-2 text-center">NÍVEL</th>
                        <th className="px-4 py-2 text-center">CATEGORIA / PERÍODO</th>
                        <th className="px-4 py-2">DATA</th>
                        <th className="px-4 py-2 text-right">VALOR DO CONTRATO</th>
                        <th className="px-4 py-2 text-center">PERCENTUAL</th>
                        <th className="px-4 py-2 text-right text-emerald-700">VALOR BRUTO CASHBACK</th>
                        <th className="px-4 py-2 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mmnHierarchyGroups && mmnHierarchyGroups.length > 0 ? (
                        mmnHierarchyGroups.map((group) => (
                          <React.Fragment key={group.key}>
                            {/* Linha Master do Microfranqueado (G0, G1 ou G2) */}
                            <tr className="bg-slate-100/90 hover:bg-slate-200/70 transition-all rounded-2xl text-xs font-bold border border-slate-200">
                              <td className="px-4 py-3.5 rounded-l-2xl font-mono text-slate-500 font-bold">
                                0
                              </td>
                              <td className="px-4 py-3.5 font-black text-midnight uppercase tracking-wide">
                                {group.microfranqueado.name}
                              </td>
                              <td className="px-3 py-3.5 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-xl text-[10px] font-black border ${
                                  group.levelTag === 'G0'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : group.levelTag === 'G1'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-sky-100 text-sky-800 border-sky-300'
                                }`}>
                                  {group.levelTag}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700">
                                  MICROFRANQUEADO
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 font-mono">
                                0
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                                0
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-500">
                                0
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                                0
                              </td>
                              <td className="px-4 py-3.5 text-center rounded-r-2xl font-mono text-slate-500">
                                0
                              </td>
                            </tr>

                            {/* Pedidos do Plano Afiliado Premium vendidos por este Microfranqueado */}
                            {group.orders.map((order: any, orderIdx: number) => (
                              <tr
                                key={order.id || `${group.key}-order-${orderIdx}`}
                                className="bg-white hover:bg-emerald-50/30 transition-all rounded-2xl text-xs font-medium border border-slate-100 shadow-sm"
                              >
                                <td className="px-4 py-3.5 rounded-l-2xl font-black text-midnight font-mono">
                                  {order.orderNumber}
                                </td>
                                <td className="px-4 py-3.5 font-bold text-slate-700">
                                  {order.affiliateName || order.origin || 'Afiliado'}
                                </td>
                                <td className="px-3 py-3.5 text-center">
                                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80" title="Plano Afiliado Premium">
                                    AF
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
                                    {order.category || 'SEMANAL'}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                                  {order.date}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-600 text-xs">
                                  R$ {Number(order.contractAmount || order.orderAmount || order.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-600 text-xs">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                                    {order.rate || (order.percentage ? `${Number(order.percentage).toFixed(0)}%` : '21%')}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-600">
                                  +R$ {Number(order.commissionAmount || order.bruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3.5 text-center rounded-r-2xl">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    order.status === 'Pago' || order.status === 'completed' || order.status === 'pago' || order.status === 'Concluído'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {order.status === 'Pago' || order.status === 'completed' || order.status === 'pago' || order.status === 'Concluído'
                                      ? 'Pago'
                                      : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            Nenhum pedido individual detalhado nesta competência.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      {/* Linha 1: Total Bruto Apurado */}
                      <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] border-b border-white/10">
                        <td colSpan={5} className="px-6 py-3 rounded-l-2xl">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="size-2 rounded-full bg-slate-400" />
                            <span>TOTAL BRUTO MENSAL APURADO</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">
                          R$ {totalContratosUnicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-indigo-300">
                          {mediaPercentual > 0 ? `${mediaPercentual.toFixed(0)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-200 font-bold">
                          +R$ {statement.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center rounded-r-2xl text-[9px] text-slate-400 font-bold">
                          BRUTO
                        </td>
                      </tr>

                      {/* Linha 2: Saldo Semanal a Receber */}
                      <tr className="bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]">
                        <td colSpan={7} className="px-6 py-4 rounded-l-2xl">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${statement.liquido > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                            <span>(=) SALDO SEMANAL A RECEBER</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-emerald-400 font-black">
                          R$ {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-4 py-4 text-center rounded-r-2xl text-[9px] text-emerald-400 font-bold">
                          {statement.liquido > 0 ? 'A RECEBER' : 'QUITADO'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Nota de rodapé explicativa */}
              <p className="text-[11px] text-slate-500 italic mt-3">
                * Nas discriminações dos Pedidos e comissões, a origem e nível de cada pedido refletem as Gerações G0 (21%), G1 (3%) e G2 (3%) do modelo de Microfranquia MMN, tendo sido descontinuado o cargo de revendedor regional.
              </p>

            </div>

          </div>
        ) : activeTab === 'archives' ? (
          
          /* PASTA DE PAGAMENTOS SEMANAIS */
          <div className="space-y-8">
            
            {/* Header da Pasta de Pagamentos Semanais */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <FolderArchive size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-midnight uppercase tracking-tight">
                        Pasta de Pagamentos Semanais
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-blue/10 text-primary-blue text-xs font-black uppercase font-mono">
                        {monthLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Repasses apurados e liquidados semanalmente na rede MMN (G0 ao G2) com quitação toda terça-feira via PIX
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintPDF()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Printer size={15} /> Imprimir Consolidado
                  </button>
                </div>
              </div>

              {/* 3 Cards de Resumo do Mês */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/70">
                  <span className="text-[10px] text-emerald-800 uppercase font-black tracking-wider block">
                    Total Já Quitado no Mês
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-xl block mt-1">
                    {monthlyWeeklyTotals.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={11} /> Ciclos semanais pagos via PIX
                  </span>
                </div>

                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                  <span className="text-[10px] text-amber-800 uppercase font-black tracking-wider block">
                    Previsto / Em Apuração
                  </span>
                  <span className="font-mono font-black text-amber-800 text-xl block mt-1">
                    {monthlyWeeklyTotals.totalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> Quitação na próxima terça-feira
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                    Total Geral Acumulado no Mês
                  </span>
                  <span className="font-mono font-black text-midnight text-xl block mt-1">
                    {monthlyWeeklyTotals.totalGeralMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    {monthlyWeeklyTotals.totalPedidosMes} pedido(s) apurado(s) em {weeklyCycles.length} semana(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Lista dos Ciclos Semanais do Mês */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-sm font-black text-midnight uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-primary-blue" />
                    Ciclos Semanais de Pagamento ({monthLabel})
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    Cada semana compreende vendas de segunda a domingo com transferência via PIX na terça-feira subsequente
                  </p>
                </div>
              </div>

              {weeklyCycles.map((week: any) => {
                const isExpanded = expandedWeeks[week.weekNumber] ?? (week.pedidosCount > 0);
                return (
                  <div 
                    key={week.weekNumber} 
                    className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                      week.isCurrentWeek 
                        ? 'border-amber-300 shadow-md ring-1 ring-amber-200' 
                        : week.isPaid 
                          ? 'border-emerald-200/80 shadow-sm' 
                          : 'border-slate-200/80 shadow-sm'
                    }`}
                  >
                    {/* Header do Card da Semana */}
                    <div className="p-6 md:p-7 space-y-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3.5">
                          <div className={`size-11 rounded-2xl text-white flex items-center justify-center shadow-md ${
                            week.isPaid 
                              ? 'bg-emerald-600' 
                              : week.isPending 
                                ? 'bg-amber-500' 
                                : 'bg-slate-300'
                          }`}>
                            {week.isPaid ? (
                              <CheckCircle2 size={22} />
                            ) : week.isPending ? (
                              <Clock size={22} />
                            ) : (
                              <Calendar size={22} />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-black text-midnight uppercase tracking-tight">
                                {week.weekLabel} • {week.periodoStr}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-black">
                                {week.rpaWeeklyNumber}
                              </span>
                              {week.isPaid ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                                  <CheckCircle2 size={11} /> Quitado
                                </span>
                              ) : week.isPending ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase flex items-center gap-1">
                                  <Clock size={11} /> Em Apuração
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                                  Sem Movimentação
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {week.isPaid 
                                ? `Pagamento semanal quitado e creditado na chave PIX cadastrada`
                                : week.isPending 
                                  ? `Apuração em andamento para quitação na terça-feira (${week.previsaoPagamentoStr}) via PIX`
                                  : `Nenhum pedido de afiliados G0 ao G2 registrado neste período`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {week.orders.length > 0 && (
                            <button
                              onClick={() => toggleWeekExpand(week.weekNumber)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? 'Recolher Pedidos' : `Ver Pedidos (${week.pedidosCount})`}
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintPDF(week)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Printer size={14} /> Imprimir / PDF
                          </button>
                        </div>
                      </div>

                      {/* 3 Caixas de Indicadores da Semana */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Documento Oficial</span>
                          <span className="font-mono font-black text-midnight text-sm block mt-1">{week.rpaWeeklyNumber}</span>
                          <span className="text-[10px] text-slate-500 font-bold">Ciclo: {week.periodoStr}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Pedidos da Semana</span>
                          <span className="font-mono font-black text-midnight text-sm block mt-1">
                            {week.pedidosCount} pedido(s)
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {week.contractTotal > 0 ? `Contratos: ${week.contractTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem contratos no ciclo'}
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl border ${
                          week.isPaid 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : week.isPending 
                              ? 'bg-amber-50 border-amber-200' 
                              : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`text-[10px] uppercase font-bold block ${
                            week.isPaid ? 'text-emerald-700' : week.isPending ? 'text-amber-700' : 'text-slate-400'
                          }`}>
                            {week.isPaid ? 'Líquido Pago' : 'Líquido Previsto'}
                          </span>
                          <span className={`font-mono font-black text-lg block mt-1 ${
                            week.isPaid ? 'text-emerald-700' : week.isPending ? 'text-amber-800' : 'text-slate-500'
                          }`}>
                            {week.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            week.isPaid ? 'text-emerald-600' : week.isPending ? 'text-amber-700' : 'text-slate-400'
                          }`}>
                            {week.isPaid ? 'Creditado via PIX' : `PIX em ${week.previsaoPagamentoStr}`}
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Pedidos da Semana (Expandível) */}
                      {isExpanded && week.orders.length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <ShoppingBag size={14} className="text-amber-500" />
                            Discriminação dos Pedidos Vinculados ao RPA ({week.rpaWeeklyNumber}):
                          </h4>
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
                                  <th className="py-2.5 px-3">Nº Pedido</th>
                                  <th className="py-2.5 px-3">Data</th>
                                  <th className="py-2.5 px-3">Origem / Nível</th>
                                  <th className="py-2.5 px-3 text-right">Valor Base</th>
                                  <th className="py-2.5 px-3 text-center">Alíquota</th>
                                  <th className="py-2.5 px-3 text-right">Comissão</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[11px]">
                                {week.orders.map((row: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono font-black text-slate-800">{row.orderNumber}</td>
                                    <td className="py-2.5 px-3 text-slate-500 font-mono">{row.date}</td>
                                    <td className="py-2.5 px-3 font-bold text-slate-700">{row.origin}</td>
                                    <td className="py-2.5 px-3 text-right font-mono">
                                      {row.orderAmount > 0 ? row.orderAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono">{row.commissionRate || row.percentage || 21}%</td>
                                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600">
                                      {row.commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Histórico Geral de Ciclos Anteriores Arquivados */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <FolderArchive size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                      Histórico Geral de Pagamentos Efetivados
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Demonstrativos arquivados permanentemente após a quitação pela administração
                    </p>
                  </div>
                </div>
              </div>

              {archives.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <FolderArchive size={44} className="mx-auto text-slate-300" />
                  <p className="text-sm font-black text-slate-600 uppercase tracking-wide">
                    Nenhum ciclo anterior arquivado ainda
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Assim que a administração efetivar o repasse semanal toda terça-feira via PIX, o comprovante oficial e o demonstrativo consolidado serão armazenados aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archives.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-midnight uppercase tracking-wider block">
                            Competência: {item.refMonth}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {item.rpaNumber || `RPA Nº ${item.refMonth.replace('-', '')}`}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Quitado
                        </span>
                      </div>

                      {item.ordersList && item.ordersList.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-bold">
                          <span>Pedidos: </span>
                          <span className="font-mono text-slate-700">{item.ordersList.join(', ')}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Bruto</span>
                          <span className="font-mono font-bold text-slate-700">
                            {Number(item.totalBruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Líquido Pago</span>
                          <span className="font-mono font-black text-emerald-700">
                            {Number(item.liquido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>

                      {item.receiptUrl && (
                        <div className="pt-2">
                          <a
                            href={item.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                          >
                            <ExternalLink size={14} /> Comprovante de Pagamento
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </AffiliateLayout>
  );
}
