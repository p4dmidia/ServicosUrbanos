import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Package,
  User,
  ExternalLink,
  QrCode,
  CheckSquare,
  Square,
  Building2,
  CreditCard,
  Wallet,
  Shield,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import PaymentReceipt from './PaymentReceipt';
import { businessRules } from '../lib/businessRules';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface FinancialRecord {
  orderId: string;
  buyerName: string;
  payeeName: string;
  orderStatus: string;
  deliveryStatus: string;
  saleDate: string;
  amount: number;
  repasse: number;
  payDate: string;
  payeeId?: string;
  payeePixKey?: string;
  payeeCpf?: string;
  paymentMethod?: string;
  items?: any[];
  payoutStatus?: string;
}

interface FinancialReportTableProps {
  data: FinancialRecord[];
  affiliateData?: any[];
  title?: string;
  isAdmin?: boolean;
  mode?: 'merchants' | 'affiliates';
  onGeneratePayments?: (selected: FinancialRecord[]) => void;
  hideReceiptButton?: boolean;
  hidePdfButton?: boolean;
  platformRate?: number;
}

export default function FinancialReportTable({ 
  data, 
  affiliateData = [],
  title = "Relatório Financeiro", 
  isAdmin = false,
  mode = 'merchants',
  onGeneratePayments,
  hideReceiptButton = false,
  hidePdfButton = false,
  platformRate = 18
}: FinancialReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<FinancialRecord | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<FinancialRecord | null>(null);
  const [orderCommissions, setOrderCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!viewingOrder?.orderId || viewingOrder.orderId.includes('REP-')) {
        setOrderCommissions([]);
        return;
      }

      setLoadingCommissions(true);
      try {
        const comms = await businessRules.getOrderCommissions(viewingOrder.orderId);
        setOrderCommissions(comms);
      } catch (error) {
        console.error('Erro ao buscar comissões:', error);
      } finally {
        setLoadingCommissions(false);
      }
    };

    fetchCommissions();
  }, [viewingOrder?.orderId]);

  type GroupedCommission = {
    key: string;
    level: number;
    generation: number;
    affiliateId: string;
    affiliateName: string;
    orderId: string;
    mensal: number;
    digital: number;
    anual: number;
    total: number;
  };

  const addCommissionAmount = (row: GroupedCommission, description: string, amount: number) => {
    const desc = description || '';
    if (desc.includes('Mensal')) row.mensal += amount;
    else if (desc.includes('Digital')) row.digital += amount;
    else if (desc.includes('Anual')) row.anual += amount;
    else row.mensal += amount;
    row.total = row.mensal + row.digital + row.anual;
  };

  const groupedCommissions: GroupedCommission[] = React.useMemo(() => {
    const map = new Map<string, GroupedCommission>();
    orderCommissions.forEach((comm) => {
      const level = Number(comm.level) || 1;
      const affiliateId = comm.affiliate_id || comm.affiliateId || 'unknown';
      const key = `${level}-${affiliateId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          level,
          generation: Math.max(level - 1, 0),
          affiliateId,
          affiliateName: comm.affiliateName || 'Desconhecido',
          orderId: comm.order_id || viewingOrder?.orderId || '',
          mensal: 0,
          digital: 0,
          anual: 0,
          total: 0,
        });
      }
      const row = map.get(key)!;
      addCommissionAmount(row, comm.description, Number(comm.amount) || 0);
    });
    return Array.from(map.values()).sort((a, b) => a.level - b.level);
  }, [orderCommissions, viewingOrder?.orderId]);

  const totals = React.useMemo(() => {
    let mensal = 0;
    let digital = 0;
    let anual = 0;
    groupedCommissions.forEach((row) => {
      mensal += row.mensal;
      digital += row.digital;
      anual += row.anual;
    });
    return { mensal, digital, anual, total: mensal + digital + anual };
  }, [groupedCommissions]);

  const filteredData = (mode === 'merchants' ? data : affiliateData).filter((record: any) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = mode === 'merchants' 
      ? (record.payeeName || '').toLowerCase().includes(term) || (record.orderId || '').toLowerCase().includes(term)
      : (record.name || record.payeeName || '').toLowerCase().includes(term) || 
        (record.cpf || record.payeeCpf || '').toLowerCase().includes(term) ||
        (record.pix_key || record.payeePixKey || '').toLowerCase().includes(term);
    
    if (!nameMatch) return false;

    // Date filtering
    if (startDate || endDate) {
      const recordDateStr = mode === 'merchants' ? record.saleDate : (record.payDate || record.saleDate);
      if (!recordDateStr) return false;
      
      // Assume DD/MM/YYYY format
      const parts = recordDateStr.split('/');
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      
      if (startDate) {
        const start = new Date(startDate.replace(/-/g, '/'));
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate.replace(/-/g, '/'));
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString('pt-BR');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 40); // Midnight
    doc.text('SERVIÇOS URBANOS | RELATÓRIO', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tipo: ${mode === 'merchants' ? 'Repasses Lojistas' : 'Cashback Afiliados'}`, 14, 30);
    doc.text(`Gerado em: ${now}`, 14, 35);
    if (startDate || endDate) {
      doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, 14, 40);
    }

    const tableData = filteredData.map((record: any) => {
      if (mode === 'merchants') {
        return [
          record.orderId,
          record.payeeName,
          record.orderStatus,
          record.saleDate,
          `R$ ${(record.amount || 0).toFixed(2)}`,
          `R$ ${(record.repasse || 0).toFixed(2)}`
        ];
      } else {
        const name = record.name || record.payeeName || 'Afiliado';
        const pixKey = record.pix_key || record.payeePixKey || '---';
        const displayTotal = hideReceiptButton ? (record.mensal || 0) : (record.amount || record.repasse || 0);
        
        if (hideReceiptButton) {
          return [
            name,
            `R$ ${(record.mensal || 0).toFixed(2)}`,
            `R$ ${(record.digital || 0).toFixed(2)}`,
            `R$ ${(record.anual || 0).toFixed(2)}`,
            pixKey
          ];
        } else {
          return [
            name,
            `R$ ${(record.mensal || 0).toFixed(2)}`,
            `R$ ${(record.digital || 0).toFixed(2)}`,
            `R$ ${(record.anual || 0).toFixed(2)}`,
            `R$ ${displayTotal.toFixed(2)}`,
            pixKey,
            record.payDate || '---'
          ];
        }
      }
    });

    const head = mode === 'merchants' 
      ? [['ID', 'Lojista', 'Status', 'Data', 'Bruto', 'Líquido']]
      : hideReceiptButton
        ? [['Afiliado', 'Mensal', 'Digital', 'Anual', 'Chave PIX']]
        : [['Afiliado', 'Mensal', 'Digital', 'Anual', 'Total Pago', 'Chave PIX', 'Data Pagamento']];

    autoTable(doc, {
      head: head,
      body: tableData,
      startY: 45,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }, // Indigo-600
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Summary
    const totalAmount = filteredData.reduce((acc: number, curr: any) => {
      if (mode === 'merchants') {
        return acc + (curr.repasse || 0);
      } else {
        return acc + (hideReceiptButton ? (curr.mensal || 0) : (curr.amount || curr.repasse || 0));
      }
    }, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 40);
    const summaryLabel = (mode === 'affiliates' && !hideReceiptButton) ? 'TOTAL PAGO' : 'TOTAL LÍQUIDO';
    doc.text(`${summaryLabel}: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 15);

    doc.save(`Relatorio_${mode}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const exportToCSV = () => {
    // Determinar quais registros exportar (selecionados ou todos os filtrados)
    const recordsToExport = selectedRecords.length > 0
      ? (mode === 'merchants' ? data : affiliateData).filter((r: any) => selectedRecords.includes(mode === 'merchants' ? r.orderId : r.id))
      : filteredData;

    if (recordsToExport.length === 0) {
      toast.error('Nenhum registro encontrado para exportar.');
      return;
    }

    // Gerar o cabeçalho do CSV
    // Nome, Chave Pix, Valor a Pagar, Data de Pagamento
    const headers = ['Nome', 'Chave Pix', 'Valor a Pagar (R$)', 'Data de Pagamento'];
    
    // Gerar as linhas
    const rows = recordsToExport.map((record: any) => {
      if (mode === 'merchants') {
        return [
          record.payeeName || 'Lojista',
          record.payeePixKey || '---',
          (record.repasse || 0).toFixed(2),
          record.payDate || '---'
        ];
      } else {
        const name = record.name || record.payeeName || 'Afiliado';
        const pixKey = record.pix_key || record.payeePixKey || '---';
        const valorAPagar = record.mensal || 0; // O repasse para afiliado pendente é o mensal
        const payDate = record.payDate || new Date().toLocaleDateString('pt-BR');
        return [
          name,
          pixKey,
          valorAPagar.toFixed(2),
          payDate
        ];
      }
    });

    // Construir o conteúdo do CSV (com BOM para codificação correta de caracteres especiais no Excel)
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    
    // Criar download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `pagamentos_${mode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${recordsToExport.length} registros exportados para CSV.`);
  };

  const isEligibleForPayment = (record: any) => {
    if (mode === 'merchants') {
      return record.deliveryStatus === 'Concluído';
    }
    return true;
  };

  const toggleSelectAll = () => {
    const eligibleFiltered = filteredData.filter(isEligibleForPayment);
    const eligibleIds = eligibleFiltered.map(r => mode === 'merchants' ? r.orderId : r.id);
    const allEligibleSelected = eligibleIds.length > 0 && eligibleIds.every(id => selectedRecords.includes(id));

    if (allEligibleSelected) {
      setSelectedRecords(prev => prev.filter(id => !eligibleIds.includes(id)));
    } else {
      setSelectedRecords(prev => Array.from(new Set([...prev, ...eligibleIds])));
    }
  };

  const toggleSelect = (record: any) => {
    if (!isEligibleForPayment(record)) return;
    const id = mode === 'merchants' ? record.orderId : record.id;
    if (selectedRecords.includes(id)) {
      setSelectedRecords(prev => prev.filter(item => item !== id));
    } else {
      setSelectedRecords(prev => [...prev, id]);
    }
  };

  const handleGenerateClick = () => {
    if (onGeneratePayments) {
      const selectedItems = (mode === 'merchants'
        ? data.filter(r => selectedRecords.includes(r.orderId))
        : affiliateData.filter(r => selectedRecords.includes(r.id))
      ).filter(isEligibleForPayment);
      onGeneratePayments(selectedItems);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header com busca e filtros */}
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
        <div>
          <h3 className="text-2xl font-black text-midnight italic uppercase tracking-tighter">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {filteredData.length} registros em auditoria
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:outline-none px-2"
            />
            <span className="text-slate-300 text-[10px] font-black">ATÉ</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:outline-none px-2"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Localizar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-56 transition-all"
            />
          </div>
          
          {!hidePdfButton && (
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
              <Download size={18} />
              PDF
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
            >
              <FileText size={18} />
              CSV {selectedRecords.length > 0 ? `(${selectedRecords.length})` : ''}
            </button>
          )}

          {isAdmin && onGeneratePayments && selectedRecords.length > 0 && (
            <motion.button 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleGenerateClick}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              <QrCode size={18} />
              Gerar Pagamentos ({selectedRecords.length})
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {isAdmin && onGeneratePayments && (
                <th className="p-6 w-12">
                  <button 
                    onClick={toggleSelectAll} 
                    disabled={filteredData.filter(isEligibleForPayment).length === 0}
                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    {filteredData.filter(isEligibleForPayment).length > 0 && 
                     filteredData.filter(isEligibleForPayment).every(r => selectedRecords.includes(mode === 'merchants' ? r.orderId : r.id))
                      ? <CheckSquare size={22} className="text-indigo-600" /> 
                      : <Square size={22} />
                    }
                  </button>
                </th>
              )}
              {mode === 'merchants' ? (
                <>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID do Pedido</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lojista / Beneficiário</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Bruto</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Líquido ({100 - platformRate}%)</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Pagamento</th>
                </>
              ) : (
                <>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Afiliado</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cashback Mensal <br/><span className="text-[7px] text-emerald-500">(PAGO TODO MÊS)</span></th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cashback Digital <br/><span className="text-[7px] text-blue-500">(CARTEIRA)</span></th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cashback Anual <br/><span className="text-[7px] text-indigo-500">(PAGO 10/DEZ)</span></th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right bg-slate-50/50">
                    {hideReceiptButton ? (
                      <>Total Líquido <br/><span className="text-[7px] text-slate-500">(A PAGAR AGORA)</span></>
                    ) : (
                      <>Total Pago <br/><span className="text-[7px] text-emerald-500">(CONCLUÍDO)</span></>
                    )}
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chave PIX</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Pagamento</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((record: any, idx: number) => (
              <tr 
                key={mode === 'merchants' ? record.orderId : `aff-${idx}`} 
                className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${selectedRecords.includes(record.orderId) ? 'bg-indigo-50/40' : ''}`}
              >
                {isAdmin && onGeneratePayments && (
                  <td className="p-6">
                    {isEligibleForPayment(record) ? (
                      <button 
                        onClick={() => toggleSelect(record)} 
                        className="text-slate-300 hover:text-indigo-600 transition-colors"
                      >
                        {selectedRecords.includes(mode === 'merchants' ? record.orderId : record.id) 
                          ? <CheckSquare size={22} className="text-indigo-600" /> 
                          : <Square size={22} />
                        }
                      </button>
                    ) : (
                      <div 
                        className="text-slate-200 cursor-not-allowed opacity-40 flex items-center justify-center mx-auto"
                        title="Pagamento pendente: aguardando retirada do pedido"
                        style={{ width: 22, height: 22 }}
                      >
                        <Square size={22} />
                      </div>
                    )}
                  </td>
                )}
                
                {mode === 'merchants' ? (
                  <>
                    <td className="p-6">
                       <button 
                         onClick={() => setViewingOrder(record)}
                         className="flex items-center gap-2 group bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50 hover:border-indigo-200 transition-all"
                       >
                          <span className="text-xs font-black text-midnight group-hover:text-indigo-600 transition-colors">#{record.orderId}</span>
                          <ExternalLink size={12} className="text-slate-400" />
                       </button>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                           <Building2 size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-midnight uppercase tracking-tight">{record.payeeName}</span>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold italic">
                            <User size={8} /> Comprador: {record.buyerName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          record.orderStatus === 'Pago' || record.orderStatus === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {record.orderStatus}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          record.deliveryStatus === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {record.deliveryStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-[11px] font-bold text-slate-500 whitespace-nowrap">{record.saleDate}</td>
                    <td className="p-6 text-right text-xs font-bold text-slate-600 whitespace-nowrap">R$ {record.amount.toFixed(2).replace('.', ',')}</td>
                    <td className="p-6 text-right whitespace-nowrap">
                      <span className="text-xs font-black text-indigo-600 italic">R$ {record.repasse.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td className="p-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-indigo-600 italic tracking-tighter underline">{record.payDate}</span>
                          <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-1">Previsto</span>
                      {(record.orderStatus === 'Pago' || record.orderStatus === 'Concluído') && !hideReceiptButton && (
                        <button 
                          onClick={() => setViewingReceipt(record)}
                          className="mt-2 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all text-[9px] font-black uppercase tracking-tighter"
                        >
                          <FileText size={10} /> Comprovante
                        </button>
                      )}
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                           <User size={16} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-midnight uppercase tracking-tight">{record.name || record.payeeName}</span>
                           <span className="text-[9px] text-slate-400 font-bold">CPF: {record.cpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right text-xs font-black text-emerald-600 italic tracking-tighter">R$ {(record.mensal || 0).toFixed(2).replace('.', ',')}</td>
                    <td className="p-6 text-right text-xs font-bold text-blue-500 tracking-tighter">R$ {(record.digital || 0).toFixed(2).replace('.', ',')}</td>
                    <td className="p-6 text-right text-xs font-bold text-indigo-500 tracking-tighter">R$ {(record.anual || 0).toFixed(2).replace('.', ',')}</td>
                    <td className="p-6 text-right bg-slate-50/50">
                      <span className="text-sm font-black text-primary-blue italic">
                        R$ {((hideReceiptButton ? (record.mensal || 0) : (record.amount || record.repasse || 0))).toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-black text-slate-700 italic tracking-tighter">{record.pix_key || record.payeePixKey || '---'}</span>
                         <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{record.pix_type || '---'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-indigo-600 italic tracking-tighter underline">{record.payDate || '---'}</span>
                        <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                          {hideReceiptButton ? 'Previsto' : 'Liquidado'}
                        </span>
                        {!hideReceiptButton && (
                          <button 
                            onClick={() => setViewingReceipt(record)}
                            className="mt-2 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all text-[9px] font-black uppercase tracking-tighter"
                          >
                            <FileText size={10} /> Comprovante
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-[2rem]">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Mostrando {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-{Math.min(filteredData.length, currentPage * rowsPerPage)} de {filteredData.length} registros
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`size-8 rounded-lg text-[10px] font-black transition-all ${
                  currentPage === i + 1 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
          </div>

          <button 
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="absolute inset-0 bg-midnight/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
            >
              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="size-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                         <Package size={28} />
                      </div>
                      <div>
                         <h4 className="text-2xl font-black text-midnight italic uppercase tracking-tighter leading-none">Pedido #{viewingOrder.orderId}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Extrato de Auditoria Financeira</p>
                      </div>
                   </div>
                   <button onClick={() => setViewingOrder(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                      <X size={24} className="text-slate-400" />
                   </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3">
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                      <div className="size-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                         <Building2 size={20} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Lojista / Beneficiário</p>
                         <p className="text-sm font-black text-midnight uppercase">{viewingOrder.payeeName || 'Não Informado'}</p>
                         {viewingOrder.payeeCpf && (
                           <div className="flex items-center gap-1 mt-1">
                              <Shield size={10} className="text-slate-300" />
                              <span className="text-[9px] text-slate-400 font-bold">CPF/CNPJ: {viewingOrder.payeeCpf}</span>
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                      <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                         <User size={20} />
                      </div>
                      <div>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Cliente Comprador</p>
                         <p className="text-sm font-black text-midnight uppercase">{viewingOrder.buyerName}</p>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                       <div className="size-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Forma de Pagamento</p>
                          <p className="text-sm font-black text-midnight uppercase">{viewingOrder.paymentMethod || (viewingOrder as any).payment_method || 'Não Informado'}</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                       <div className="size-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <Calendar size={20} />
                       </div>
                       <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Data da Compra</p>
                          <p className="text-sm font-black text-midnight uppercase">
                            {!viewingOrder.saleDate || viewingOrder.saleDate === 'Invalid Date' ? 'Não Informada' : viewingOrder.saleDate}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Commissions List */}
                 <div className="space-y-4">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-4">Participação nas Comissões (MMN)</p>
                     <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        {loadingCommissions ? (
                          <div className="p-8 flex flex-col items-center justify-center gap-2">
                            <Loader2 size={24} className="text-indigo-500 animate-spin opacity-40" />
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Buscando rede...</p>
                          </div>
                        ) : groupedCommissions.length > 0 ? (
                          <>
                            <div className="divide-y divide-slate-100">
                               {groupedCommissions.map((row) => (
                                 <div key={row.key} className="p-5 hover:bg-white transition-all space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                       <div className="flex items-center gap-3 min-w-0">
                                          <div className="size-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 border border-slate-100 shadow-sm text-[10px] font-black shrink-0">
                                             G{row.generation}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                             <span className="text-xs font-black text-midnight uppercase leading-none mb-1 truncate">{row.affiliateName}</span>
                                             <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Geração G{row.generation}</span>
                                                <span className="text-slate-200">•</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pedido #{row.orderId}</span>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="text-right shrink-0">
                                          <span className="text-sm font-black text-indigo-600 italic tracking-tighter">R$ {row.total.toFixed(2).replace('.', ',')}</span>
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pl-11">
                                       <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Mensal</p>
                                          <p className="text-[11px] font-black text-emerald-600">R$ {row.mensal.toFixed(2).replace('.', ',')}</p>
                                       </div>
                                       <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Digital</p>
                                          <p className="text-[11px] font-black text-blue-500">R$ {row.digital.toFixed(2).replace('.', ',')}</p>
                                       </div>
                                       <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Anual</p>
                                          <p className="text-[11px] font-black text-indigo-500">R$ {row.anual.toFixed(2).replace('.', ',')}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                            {/* Summary footer based on the spreadsheet distribution */}
                            <div className="bg-indigo-50/50 p-4 px-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider flex-wrap gap-3">
                               <div className="flex items-center gap-1">
                                  <span>Mensal:</span>
                                  <span className="text-indigo-600 font-black">R$ {totals.mensal.toFixed(2).replace('.', ',')}</span>
                               </div>
                               <div className="hidden sm:inline text-slate-300">|</div>
                               <div className="flex items-center gap-1">
                                  <span>Digital:</span>
                                  <span className="text-indigo-600 font-black">R$ {totals.digital.toFixed(2).replace('.', ',')}</span>
                               </div>
                               <div className="hidden sm:inline text-slate-300">|</div>
                               <div className="flex items-center gap-1">
                                  <span>Anual:</span>
                                  <span className="text-indigo-600 font-black">R$ {totals.anual.toFixed(2).replace('.', ',')}</span>
                               </div>
                               <div className="hidden sm:inline text-slate-300">|</div>
                               <div className="bg-indigo-600 text-white px-2 py-1 rounded-lg shadow-sm">
                                  Total: R$ {totals.total.toFixed(2).replace('.', ',')}
                                </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center">
                             <p className="text-[10px] text-slate-300 font-black uppercase italic">Nenhuma comissão de rede vinculada</p>
                          </div>
                        )}
                     </div>
                  </div>

                {/* Product Items List */}
                <div className="space-y-4">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-4">Produtos Vinculados</p>
                   <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                      {viewingOrder.items && viewingOrder.items.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                           {viewingOrder.items.map((item: any, idx: number) => (
                             <div key={idx} className="p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                   <span className="text-xs font-black text-midnight uppercase">{item.name || item.title || 'Produto'}</span>
                                   <span className="text-[9px] text-slate-400 font-bold italic">Quantidade: {item.quantity || 1}x</span>
                                </div>
                                <span className="text-xs font-black text-slate-600 italic">R$ {(item.price || 0).toFixed(2).replace('.', ',')}</span>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                           <p className="text-[10px] text-slate-300 font-black uppercase italic">Nenhum item detalhado encontrado</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">Valor Total da Venda</span>
                      <span className="text-lg font-black text-midnight tracking-tighter italic">R$ {viewingOrder.amount.toFixed(2).replace('.', ',')}</span>
                   </div>
                   <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-tight italic">Cashback Serviços Urbanos ({platformRate}%)</span>
                      <span className="text-sm font-black text-red-500 italic">- R$ {(viewingOrder.amount * (platformRate / 100)).toFixed(2).replace('.', ',')}</span>
                   </div>
                   
                   <div className="mt-8 p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <QrCode size={80} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Líquido a Repassar</p>
                      <h2 className="text-4xl font-black italic tracking-tighter leading-none">
                        R$ {viewingOrder.repasse.toFixed(2).replace('.', ',')}
                      </h2>
                   </div>
                </div>

                <button 
                  onClick={() => setViewingOrder(null)}
                  className="w-full bg-slate-100 text-slate-600 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Comprovante de PIX */}
      <AnimatePresence>
        {viewingReceipt && (
          <PaymentReceipt 
            onClose={() => setViewingReceipt(null)}
            receiptData={{
              id: mode === 'merchants' ? viewingReceipt.orderId : (viewingReceipt.id || viewingReceipt.cpf || 'REF'),
              payeeName: mode === 'merchants' ? viewingReceipt.payeeName : viewingReceipt.name,
              payeePixKey: mode === 'merchants' ? viewingReceipt.payeePixKey : viewingReceipt.pix_key,
              payeeCpf: mode === 'merchants' ? viewingReceipt.payeeCpf : viewingReceipt.cpf,
              amount: mode === 'merchants' ? viewingReceipt.repasse : (viewingReceipt.mensal || viewingReceipt.amount),
              date: viewingReceipt.payDate || new Date().toLocaleDateString('pt-BR'),
              description: mode === 'merchants' 
                ? `Repasse Venda #${viewingReceipt.orderId}`
                : `Comissão Cashback - ${viewingReceipt.name}`,
              bankName: 'BCO SANTANDER (BRASIL) S.A.'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
