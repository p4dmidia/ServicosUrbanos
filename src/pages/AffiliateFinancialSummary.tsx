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
  ArrowDownRight
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

  const handlePrintPDF = () => {
    if (!statement) return;
    const doc = new jsPDF();

    // Título Principal
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text('REPASSE MENSAL DE REDE MMN - AFILIADO/REVENDEDOR - RESUMO DO PAGAMENTO', 105, 18, { align: 'center' });

    // Subtítulos
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`PERIODO DE ${statement.periodoStr}`, 105, 26, { align: 'center' });
    doc.text(`PREVISÃO DE PAGAMENTO DIA ${statement.previsaoPagamentoStr}`, 105, 32, { align: 'center' });

    // Faixa Amarela do Beneficiário
    doc.setFillColor(254, 240, 138); // Amarelo
    doc.rect(14, 38, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`AFILIADO/REVENDEDOR - ${statement.beneficiaryName.toUpperCase()}`, 105, 45, { align: 'center' });

    // Chave Pix
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CHAVE PIX CADASTRADA - ${statement.pixKey}`, 105, 54, { align: 'center' });

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
        `EMITIR NOTA FISCAL NO TOTAL BRUTO ATÉ ${statement.limiteNotaFiscalStr}`,
        statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'INSS (Teto de R$ 8.475,55 * 11% = R$ 932,31)',
        statement.isPJ ? 'Isento (PJ)' : statement.inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'BASE DE CALCULO DO IRPF (BRUTO-INSS)',
        statement.isPJ ? 'Isento (PJ)' : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'IRRF - CONFORME TABELA DO CONTADOR',
        statement.isPJ || statement.irrf === 0 ? 'Isento' : statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        'LIQUIDO A RECEBER',
        statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]
    ];

    autoTable(doc, {
      startY: 58,
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 9.5,
        cellPadding: 3.5,
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
        // Emitir NF em amarelo
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
          data.cell.styles.fontSize = 10.5;
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento consolidado gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} - Plataforma Serviços Urbanos`, 105, finalY, { align: 'center' });

    doc.save(`financeiro-resumo-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`);
  };

  const handleExportCSV = () => {
    if (!statement) return;
    businessRules.exportConsolidatedPayoutsCSV([statement], statement.refMonth);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  return (
    <AffiliateLayout title="Financeiro Resumo">
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full">
                    Resumo do Pagamento
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-midnight uppercase tracking-tight mt-2">
                    REPASSE MENSAL DE REDE MMN - AFILIADO/REVENDEDOR
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    PERÍODO DE {statement.periodoStr} • PREVISÃO DE PAGAMENTO DIA {statement.previsaoPagamentoStr}
                  </p>
                </div>

                {/* Box de Chave PIX e Beneficiário */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Beneficiário:</div>
                  <div className="font-black text-midnight text-sm uppercase">{statement.beneficiaryName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX:</span>
                    <span className="font-mono font-black text-slate-800">{statement.pixKey}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    {statement.isPJ ? 'Pessoa Jurídica (Isento de INSS e IRRF)' : 'Pessoa Física (Retenção Tributária Oficial)'}
                  </div>
                </div>
              </div>

              {/* Alerta de Nota Fiscal (Amarelo) */}
              <div className="bg-amber-100 border border-amber-300/80 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={20} className="text-amber-700 shrink-0" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                    EMITIR NOTA FISCAL NO TOTAL BRUTO ATÉ {statement.limiteNotaFiscalStr}
                  </span>
                </div>
                <span className="font-mono font-black text-sm sm:text-base text-amber-900 shrink-0">
                  {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* Linhas Discriminatórias */}
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
                      INSS (Teto de R$ 8.475,55 * 11% = R$ 932,31)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isPJ ? 'Pessoa Jurídica isenta de retenção previdenciária' : 'Retenção obrigatória Pessoa Física (INSS)'}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${statement.isPJ ? 'text-slate-500' : 'text-red-600'}`}>
                    {statement.isPJ 
                      ? 'Isento (PJ)' 
                      : statement.inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                      IRRF - CONFORME TABELA DO CONTADOR
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

          </div>
        ) : activeTab === 'archives' ? (
          
          /* PASTA DE PAGAMENTOS MENSAIS / ARQUIVADOS */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <FolderArchive size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                    Pasta de Pagamentos Mensais Efetivados
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Histórico de demonstrativos quitados e arquivados pela administração
                  </p>
                </div>
              </div>
            </div>

            {archives.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FolderArchive size={48} className="mx-auto text-slate-300" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-wide">
                  Nenhum pagamento arquivado ainda
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Assim que a administração efetivar o repasse mensal no dia 10, o demonstrativo oficial com o comprovante ficará guardado nesta pasta permanente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archives.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-midnight uppercase tracking-wider">
                        Competência: {item.refMonth}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} /> Quitado
                      </span>
                    </div>

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
        ) : null}

      </div>
    </AffiliateLayout>
  );
}
