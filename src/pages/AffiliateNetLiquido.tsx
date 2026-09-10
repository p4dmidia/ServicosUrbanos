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
  FileSpreadsheet,
  Building2,
  Wallet
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AffiliateNetLiquido() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  // Redireciona revendedores regionais para o financeiro de revendedor
  if (profile?.role === 'regional_reseller') {
    return <Navigate to="/afiliado/financeiro-revendedor" replace />;
  }

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
        businessRules.getAffiliateMonthlyStatement(user.id, selectedYear, selectedMonth),
        businessRules.getMonthlyPayoutArchives({ userId: user.id })
      ]);
      setStatement(stmtData);
      setArchives(archivesData || []);
    } catch (error) {
      console.error('Erro ao carregar demonstrativo:', error);
      toast.error('Erro ao calcular demonstrativo mensal');
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
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text('REPASSE MENSAL DE REDE MMN - AFILIADO RESUMO DO PAGAMENTO', 105, 18, { align: 'center' });

    // Subtítulos
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`PERIODO DE ${statement.periodoStr}`, 105, 26, { align: 'center' });
    doc.text(`PREVISÃO DE PAGAMENTO DIA ${statement.previsaoPagamentoStr}`, 105, 32, { align: 'center' });

    // Faixa Amarela do Afiliado
    doc.setFillColor(254, 240, 138); // Amarelo claro
    doc.rect(14, 38, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`AFILIADO - ${statement.affiliateName.toUpperCase()}`, 105, 45, { align: 'center' });

    // Chave Pix
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Chave Pix - ${statement.pixKey}`, 105, 54, { align: 'center' });

    // Tabela do Demonstrativo
    const tableRows = [
      [
        'Cashback mensal da Rede de MMN (G0 AO G2)',
        statement.brutoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ],
      [
        `Cashback anual AFILIADO periodo ${statement.annualPeriodLabel}`,
        statement.brutoAnual > 0 
          ? statement.brutoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
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
        'IRRF',
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
        // Linha 1 (Cashback Anual em vermelho)
        if (data.row.index === 1) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        // Linha 2 (Total Bruto em destaque)
        if (data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
        }
        // Linha 3 (Emitir NF em fundo amarelo)
        if (data.row.index === 3) {
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
        // Linha 4 (INSS texto vermelho)
        if (data.row.index === 4 && data.column.index === 1 && !statement.isPJ) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        // Linha 6 (IRRF fundo verde claro)
        if (data.row.index === 6) {
          data.cell.styles.fillColor = [220, 252, 231];
          if (data.column.index === 1 && !statement.isPJ && statement.irrf > 0) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
        // Linha 7 (Líquido em destaque)
        if (data.row.index === 7) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} - Plataforma Serviços Urbanos`, 105, finalY, { align: 'center' });

    doc.save(`resumo-repasse-liquido-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`);
  };

  return (
    <AffiliateLayout title="Financeiro da Rede Valor Líquido">
      <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-5xl mx-auto">
        
        {/* Header com Navegação Mês a Mês */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-primary-blue/10 text-primary-blue rounded-xl">
                <FileSpreadsheet size={20} />
              </span>
              <h2 className="text-xl lg:text-2xl font-black text-midnight tracking-tight uppercase italic">
                Financeiro da Rede <span className="text-primary-blue">Valor Líquido</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Resumo oficial de repasse mensal com apuração tributária e retenção na fonte
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
            Demonstrativo da Competência
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
            Pasta de Pagamentos Arquivados ({archives.length})
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
                  onClick={handlePrintPDF}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* CARDS PRINCIPAIS: RESUMO DO PAGAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Cashback Mensal */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cashback Mensal
                  </span>
                  <div className="size-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Wallet size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-tight">
                    {statement.brutoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Rede MMN (G0 ao G2)
                  </p>
                </div>
              </div>

              {/* Card 2: Cashback Anual Acumulado */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    Cashback Anual
                  </span>
                  <div className="size-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black font-mono text-blue-400 tracking-tight">
                    {statement.brutoAnual > 0 
                      ? statement.brutoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {statement.isAnnualPayout 
                      ? `Creditado em 10 de Dezembro`
                      : `Acumulando p/ 10.12`}
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
                    Base p/ Emissão de NF
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

            {/* CARD DETALHADO: DEMONSTRATIVO TRIBUTÁRIO & INFORMATIVO OFICIAL */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
              
              {/* Cabeçalho do Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full">
                    Resumo do Pagamento Oficial
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-midnight uppercase tracking-tight mt-2">
                    REPASSE MENSAL DE REDE MMN - AFILIADO
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    PERÍODO DE {statement.periodoStr} • PREVISÃO DE PAGAMENTO DIA {statement.previsaoPagamentoStr}
                  </p>
                </div>

                {/* Box de Chave PIX e Beneficiário */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Beneficiário:</div>
                  <div className="font-black text-midnight text-sm uppercase">{statement.affiliateName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX:</span>
                    <span className="font-mono font-black text-slate-800">{statement.pixKey}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    {statement.isPJ ? 'Pessoa Jurídica (Isento de INSS e IRRF)' : 'Pessoa Física (Retenção Tributária Oficial)'}
                  </div>
                </div>
              </div>

              {/* Alerta de Nota Fiscal */}
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

              {/* Linhas de Discriminação de Valores */}
              <div className="space-y-2 text-xs md:text-sm">
                
                {/* 1. Cashback Mensal */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">Cashback mensal da Rede de MMN (G0 AO G2)</span>
                    <span className="text-[10px] text-slate-400">Apuração de comissões ativas no período</span>
                  </div>
                  <span className="font-mono font-black text-midnight">
                    {statement.brutoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 2. Cashback Anual */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      Cashback anual AFILIADO periodo {statement.annualPeriodLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Liberado exclusivamente no ciclo de pagamento de 10 de Dezembro
                    </span>
                  </div>
                  <span className="font-mono font-black text-blue-600">
                    {statement.brutoAnual > 0 
                      ? statement.brutoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </span>
                </div>

                {/* 3. Total Bruto */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="font-black text-midnight uppercase tracking-wider">
                    TOTAL BRUTO
                  </span>
                  <span className="font-mono font-black text-midnight text-base">
                    {statement.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 4. INSS */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      INSS (Teto de R$ 8.475,55 * 11% = R$ 932,31)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {statement.isPJ ? 'Isento de retenção previdenciária (PJ)' : 'Retenção na fonte limitada ao teto previdenciário'}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${statement.isPJ ? 'text-slate-400' : 'text-rose-600'}`}>
                    {statement.isPJ ? 'Isento (PJ)' : `- ${statement.inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </span>
                </div>

                {/* 5. Base de Cálculo IRPF */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 uppercase block">
                      BASE DE CÁLCULO DO IRPF (BRUTO - INSS)
                    </span>
                    <span className="text-[10px] text-slate-400">Base para aplicação da tabela progressiva RFB</span>
                  </div>
                  <span className="font-mono font-black text-slate-800">
                    {statement.isPJ ? 'Isento (PJ)' : statement.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* 6. IRRF */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                  <div>
                    <span className="font-bold text-emerald-950 uppercase block">
                      IRRF
                    </span>
                    <span className="text-[10px] text-emerald-800/80">Tabela progressiva mensal da Receita Federal</span>
                  </div>
                  <span className={`font-mono font-black ${statement.isPJ || statement.irrf === 0 ? 'text-emerald-900' : 'text-rose-600'}`}>
                    {statement.isPJ || statement.irrf === 0 ? 'Isento' : `- ${statement.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </span>
                </div>

                {/* 7. Líquido a Receber */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <div>
                    <span className="text-sm md:text-base font-black uppercase tracking-wider block">
                      LÍQUIDO A RECEBER
                    </span>
                    <span className="text-xs text-emerald-100">
                      Transferência PIX Dia {statement.previsaoPagamentoStr}
                    </span>
                  </div>
                  <span className="font-mono font-black text-lg md:text-2xl text-white">
                    {statement.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

              </div>

            </div>

          </div>
        ) : activeTab === 'archives' ? (
          /* Seção da Pasta de Pagamentos Arquivados */
          <div className="space-y-6">
            {archives.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
                <FolderArchive size={40} className="mx-auto text-slate-300" />
                <p className="text-sm font-black uppercase tracking-wider">Nenhum pagamento arquivado ainda</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Assim que a administração liquidar os repasses mensais, os comprovantes e informativos fiscais ficarão arquivados nesta pasta para download e consulta.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archives.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span className="text-xs font-black text-midnight uppercase tracking-wider">
                          Competência {item.refMonth}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(item.paidAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Bruto</span>
                        <span className="text-xs font-mono font-black text-slate-800">
                          {Number(item.totalBruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        <span className="text-[9px] font-bold text-rose-500 block uppercase">Retenção</span>
                        <span className="text-xs font-mono font-black text-rose-600">
                          {((Number(item.inss || 0)) + Number(item.irrf || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[9px] font-bold text-emerald-600 block uppercase">Líquido</span>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          {Number(item.liquido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>

                    {item.receiptUrl && (
                      <a
                        href={item.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={14} /> Abrir Comprovante Pix
                      </a>
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
