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
  Check
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

  // Competência selecionada (Mês e Ano)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [statement, setStatement] = useState<any>(null);
  const [archives, setArchives] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'statement' | 'archives'>('statement');

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stmtData, archivesData] = await Promise.all([
        businessRules.getConsolidatedFinancialStatement(user.id, selectedYear, selectedMonth),
        businessRules.getMonthlyPayoutArchives({ userId: user.id })
      ]);
      setStatement(stmtData);
      setArchives(archivesData || []);
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

  const handlePrintPDF = () => {
    if (!statement) return;
    const doc = new jsPDF();

    // Título Principal
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text('REPASSE MENSAL DE REDE MMN - AFILIADO/REVENDEDOR - RESUMO DO PAGAMENTO', 105, 16, { align: 'center' });

    // Subtítulos
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`PERIODO DE ${statement.periodoStr}  •  DOCUMENTO / RECIBO: ${statement.rpaNumber || 'RPA-PENDENTE'}`, 105, 23, { align: 'center' });
    doc.text(`PREVISÃO DE PAGAMENTO DIA ${statement.previsaoPagamentoStr}`, 105, 29, { align: 'center' });

    // Faixa Amarela do Beneficiário
    doc.setFillColor(254, 240, 138); // Amarelo
    doc.rect(14, 34, 182, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`AFILIADO/REVENDEDOR - ${statement.beneficiaryName.toUpperCase()}  |  ${statement.rpaNumber || ''}`, 105, 40, { align: 'center' });

    // Chave Pix & Pedidos Vinculados
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`CHAVE PIX: ${statement.pixKey}   |   PEDIDOS VINCULADOS: ${(statement.ordersList || []).join(', ') || 'Nenhum'}`, 105, 48, { align: 'center' });

    // Tabela do Demonstrativo Consolidado
    const tableRows = [
      [
        'Cashback mensal da Rede de MMN (G0 AO G2)',
        statement.brutoMensalMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'Cashback mensal do Revendedor',
        statement.brutoMensalRevendedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        `Cashbbach anual AFILIADO periodo ${statement.annualPeriodLabel}`,
        statement.brutoAnualMmn > 0 
          ? statement.brutoAnualMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '-'
      ],
      [
        `Cashbbach anual REVENDEDOR periodo ${statement.annualPeriodLabel}`,
        statement.brutoAnualRevendedor > 0 
          ? statement.brutoAnualRevendedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '-'
      ],
      [
        'TOTAL BRUTO',
        statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        `TOTAL A RECEBER ATÉ ${statement.limiteNotaFiscalStr}`,
        statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'INSS (0% - Intermediação de Negócios / Isenção na Fonte)',
        statement.isPJ ? 'Isento (PJ)' : '0% (Intermediação)'
      ],
      [
        'BASE DE CALCULO DO IRPF (BRUTO-INSS)',
        statement.isPJ ? 'Isento (PJ)' : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'IRRF',
        statement.isPJ || statement.irrf === 0 ? 'Isento' : statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'LIQUIDO A RECEBER',
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
        if (data.row.index === 2 || data.row.index === 3) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        // Total Bruto
        if (data.row.index === 4) {
          data.cell.styles.fontStyle = 'bold';
        }
        // Total a receber em amarelo
        if (data.row.index === 5) {
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
        // INSS em vermelho
        if (data.row.index === 6 && data.column.index === 1 && !statement.isPJ) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        // IRRF em verde claro
        if (data.row.index === 8) {
          data.cell.styles.fillColor = [220, 252, 231];
          if (data.column.index === 1 && !statement.isPJ && statement.irrf > 0) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
        // Líquido em destaque
        if (data.row.index === 9) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontSize = 9.5;
        }
      }
    });

    let lastY = (doc as any).lastAutoTable.finalY + 8;

    // Tabela Secundária: Discriminação dos Pedidos e Valores
    if (statement.ordersBreakdown && statement.ordersBreakdown.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`DISCRIMINAÇÃO DOS PEDIDOS E COMISSÕES DA COMPETÊNCIA (${statement.rpaNumber || 'RPA'})`, 14, lastY);

      const orderRows = statement.ordersBreakdown.map((item: any) => [
        item.orderNumber,
        item.date,
        item.origin,
        item.orderAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        `${item.commissionRate}%`,
        item.commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]);

      autoTable(doc, {
        startY: lastY + 3,
        head: [['Nº Pedido', 'Data', 'Origem / Nível', 'Valor Base', 'Alíquota (%)', 'Comissão (R$)']],
        body: orderRows,
        theme: 'striped',
        styles: {
          fontSize: 8,
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
          0: { fontStyle: 'bold', cellWidth: 28 },
          1: { cellWidth: 22 },
          2: { cellWidth: 45 },
          3: { halign: 'right', cellWidth: 28 },
          4: { halign: 'center', cellWidth: 22 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 37 }
        }
      });

      lastY = (doc as any).lastAutoTable.finalY + 8;
    }

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento consolidado gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} - Plataforma Serviços Urbanos • ${statement.rpaNumber || ''}`, 105, lastY + 4, { align: 'center' });

    doc.save(`financeiro-resumo-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`);
  };

  const handleExportCSV = () => {
    if (!statement) return;
    businessRules.exportConsolidatedPayoutsCSV([statement], statement.refMonth);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  return (
    <AffiliateLayout 
      title="Financeiro Resumo"
      customBalance={statement?.liquido}
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
              Demonstrativo unificado: Rede MMN + Revendedor Regional com apuração fiscal oficial
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
            Pasta de Pagamentos Mensais ({archives.length})
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

            {/* GRID DE CARDS MODERNOS: RESUMO CONSOLIDADO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Cashback Rede MMN */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mensal Rede MMN
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

              {/* Card 2: Cashback Revendedor */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mensal Revendedor
                  </span>
                  <div className="size-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-tight">
                    {statement.brutoMensalRevendedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Comissão de Revenda
                  </p>
                </div>
              </div>

              {/* Card 3: Total Bruto */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    Total Bruto
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
                    Base de Emissão de NF
                  </p>
                </div>
              </div>

              {/* Card 4: Líquido a Receber */}
              <div className="bg-gradient-to-br from-emerald-900/80 via-emerald-950 to-slate-950 p-6 rounded-3xl border border-emerald-500/40 shadow-xl shadow-emerald-950/40 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Líquido a Receber
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
                    Transferência PIX Dia {statement.previsaoPagamentoStr.split('.')[0]}
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
                    REPASSE MENSAL DE REDE MMN - AFILIADO/REVENDEDOR
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    PERÍODO DE {statement.periodoStr} • PREVISÃO DE PAGAMENTO DIA {statement.previsaoPagamentoStr}
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
                      {statement.isPJ ? 'Pessoa Jurídica (Isento)' : 'Pessoa Física (RPA 0%)'}
                    </span>
                    <span className="font-black text-slate-700">
                      {statement.ordersBreakdown?.length || 0} pedido(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner Total a Receber ou Quitado */}
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
                        TOTAL A RECEBER ATÉ {statement.limiteNotaFiscalStr}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold">
                        Documento: {statement.rpaNumber} • {(statement.ordersList || []).length} pedido(s) apurado(s)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-900 shrink-0">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              {/* Linhas Discriminatórias Fiscais */}
              <div className="space-y-2 text-xs md:text-sm">
                
                {/* 1. Cashback Mensal MMN */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">Cashback mensal da Rede de MMN (G0 AO G2)</span>
                    <span className="text-[10px] text-slate-400">Comissões de rede ativas apuradas no período</span>
                  </div>
                  <span className="font-mono font-black text-midnight">
                    {statement.brutoMensalMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 2. Cashback Mensal Revendedor */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">Cashback mensal do Revendedor</span>
                    <span className="text-[10px] text-slate-400">Comissões de vendas diretas e revenda regional</span>
                  </div>
                  <span className="font-mono font-black text-midnight">
                    {statement.brutoMensalRevendedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 3. Cashback Anual Afiliado */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      Cashback anual AFILIADO periodo {statement.annualPeriodLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isDecemberAnnualPayout 
                        ? 'Acumulado anual liberado no ciclo de 10 de Dezembro'
                        : 'Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-red-600">
                    {statement.brutoAnualMmn > 0 
                      ? statement.brutoAnualMmn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </span>
                </div>

                {/* 4. Cashback Anual Revendedor */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      Cashback anual REVENDEDOR periodo {statement.annualPeriodLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isDecemberAnnualPayout 
                        ? 'Acumulado anual de revenda liberado no ciclo de 10 de Dezembro'
                        : 'Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-red-600">
                    {statement.brutoAnualRevendedor > 0 
                      ? statement.brutoAnualRevendedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </span>
                </div>

                {/* 5. TOTAL BRUTO */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="font-black text-midnight uppercase tracking-wider">
                    TOTAL BRUTO
                  </span>
                  <span className="font-mono font-black text-midnight text-base">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 6. INSS */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      INSS (0% - Intermediação de Negócios)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isPJ ? 'Pessoa Jurídica isenta de retenção previdenciária' : '0% de retenção na fonte. Afiliado autônomo recolhe individualmente'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-600">
                    R$ 0,00 (0%)
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
                    {statement.isPJ 
                      ? 'Isento (PJ)' 
                      : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 8. IRRF */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div>
                    <span className="font-bold text-emerald-950 uppercase block">
                      IRRF
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {statement.isPJ ? 'Isento para Pessoa Jurídica' : 'Retenção na Fonte conforme faixa de rendimentos da RFB'}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${statement.isPJ || statement.irrf === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {statement.isPJ || statement.irrf === 0 
                      ? 'Isento' 
                      : statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                        Disponível para saque e transferência PIX no dia {statement.previsaoPagamentoStr.split('.')[0]}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xl lg:text-2xl">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

              </div>

            </div>

            {/* SEÇÃO NOVA: DISCRIMINAÇÃO DOS PEDIDOS E VALORES */}
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

                {/* Badge de Contagem */}
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs">
                  <Hash size={16} className="text-primary-blue" />
                  <span className="font-bold text-slate-600">Total de Pedidos:</span>
                  <span className="font-mono font-black text-midnight">
                    {statement.ordersList?.length || 0}
                  </span>
                </div>
              </div>

              {/* Lista dos Números de Pedidos Vinculados */}
              {statement.ordersList && statement.ordersList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-600">
                    <Tag size={14} className="text-amber-500" />
                    <span>Número dos Pedidos da Competência:</span>
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

              {/* Tabela de Discriminação de Valores */}
              {!statement.ordersBreakdown || statement.ordersBreakdown.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <ShoppingBag size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wide">
                    Nenhum pedido processado nesta competência
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Assim que novas vendas de rede ou revenda ocorrerem em {monthLabel}, elas serão discriminadas aqui com seus respectivos números e alíquotas.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Nº Pedido</th>
                        <th className="py-3.5 px-4">Data</th>
                        <th className="py-3.5 px-4">Origem / Nível</th>
                        <th className="py-3.5 px-4">Tipo</th>
                        <th className="py-3.5 px-4 text-right">Valor do Pedido</th>
                        <th className="py-3.5 px-4 text-center">Alíquota (%)</th>
                        <th className="py-3.5 px-4 text-right">Comissão Gerada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {statement.ordersBreakdown.map((row: any, idx: number) => {
                        const isRevenda = row.origin.includes('Revenda');
                        const isG0 = row.origin.includes('G0');
                        const isG1 = row.origin.includes('G1');
                        const isG2 = row.origin.includes('G2');

                        const pillColor = isRevenda
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : isG0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isG1
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : isG2
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-black text-slate-900">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                                {row.orderNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {row.date}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${pillColor}`}>
                                <Layers size={11} />
                                {row.origin}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-bold text-[11px]">
                              {row.type}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                              {row.orderAmount > 0
                                ? row.orderAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                              {row.commissionRate > 0 ? `${row.commissionRate}%` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                              {row.commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-midnight text-xs">
                        <td colSpan={4} className="py-3.5 px-4 uppercase">
                          Total Discriminado da Competência ({statement.rpaNumber})
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                          {statement.ordersBreakdown
                            .reduce((acc: number, r: any) => acc + (r.orderAmount || 0), 0)
                            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">-</td>
                        <td className="py-3.5 px-4 text-right font-mono text-base text-emerald-700">
                          {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

            </div>

          </div>
        ) : activeTab === 'archives' ? (
          
          /* PASTA DE PAGAMENTOS MENSAIS / ARQUIVADOS */
          <div className="space-y-6">
            
            {/* Card Superior da Competência Atual em Processamento */}
            {statement && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`size-11 rounded-2xl ${statement.isPaid ? 'bg-emerald-600' : 'bg-amber-500'} text-white flex items-center justify-center shadow-md`}>
                      {statement.isPaid ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                          {statement.isPaid ? `Competência Quitada & Paga (${monthLabel})` : `Competência Atual em Aberto (${monthLabel})`}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full ${statement.isPaid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'} text-[10px] font-mono font-black`}>
                          {statement.rpaNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {statement.isPaid 
                          ? 'Pagamento quitado e creditado na chave PIX cadastrada'
                          : `Apuração em andamento para quitação dia ${statement.previsaoPagamentoStr}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintPDF}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer size={14} /> Imprimir / PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Documento Oficial</span>
                    <span className="font-mono font-black text-midnight text-sm block mt-1">{statement.rpaNumber}</span>
                    <span className="text-[10px] text-slate-500 font-bold">Ref: {statement.refMonth}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pedidos da Competência</span>
                    <span className="font-mono font-black text-midnight text-sm block mt-1">
                      {statement.ordersList?.length || 0} pedido(s)
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Apurados no período</span>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                      {statement.isPaid ? 'Líquido Pago' : 'Líquido Previsto'}
                    </span>
                    <span className="font-mono font-black text-emerald-700 text-lg block mt-1">
                      {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {statement.isPaid ? 'Creditado via PIX' : `PIX em ${statement.previsaoPagamentoStr}`}
                    </span>
                  </div>
                </div>

                {/* Se houver pedidos, mostra a discriminação */}
                {statement.ordersBreakdown && statement.ordersBreakdown.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ShoppingBag size={14} className="text-amber-500" />
                      Discriminação dos Pedidos Vinculados ao RPA ({statement.rpaNumber}):
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
                          {statement.ordersBreakdown.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-black text-slate-800">{row.orderNumber}</td>
                              <td className="py-2 px-3 text-slate-500 font-mono">{row.date}</td>
                              <td className="py-2 px-3 font-bold text-slate-700">{row.origin}</td>
                              <td className="py-2 px-3 text-right font-mono">
                                {row.orderAmount > 0 ? row.orderAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                              </td>
                              <td className="py-2 px-3 text-center font-mono">{row.commissionRate}%</td>
                              <td className="py-2 px-3 text-right font-mono font-black text-emerald-600">
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
            )}

            {/* Histórico de Pagamentos Já Efetivados / Arquivados */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <FolderArchive size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                      Histórico de Pagamentos Efetivados
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
                    Assim que a administração efetivar o repasse mensal no dia 10, o comprovante oficial e o demonstrativo consolidado serão armazenados aqui.
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
