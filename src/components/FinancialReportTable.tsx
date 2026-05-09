import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
}

interface FinancialReportTableProps {
  data: FinancialRecord[];
  title?: string;
  isAdmin?: boolean;
  onGeneratePayments?: (selected: FinancialRecord[]) => void;
}

export default function FinancialReportTable({ 
  data, 
  title = "Relatório Financeiro", 
  isAdmin = false,
  onGeneratePayments
}: FinancialReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<FinancialRecord | null>(null);

  const filteredData = data.filter(record => 
    record.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.payeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredData.map(r => r.orderId));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(prev => prev.filter(item => item !== id));
    } else {
      setSelectedRecords(prev => [...prev, id]);
    }
  };

  const handleGenerateClick = () => {
    if (onGeneratePayments) {
      const selectedItems = data.filter(r => selectedRecords.includes(r.orderId));
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

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Localizar lojista ou pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-72 transition-all"
            />
          </div>
          
          {isAdmin && selectedRecords.length > 0 && (
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
              {isAdmin && (
                <th className="p-6 w-12">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedRecords.length === filteredData.length && filteredData.length > 0 
                      ? <CheckSquare size={22} className="text-indigo-600" /> 
                      : <Square size={22} />
                    }
                  </button>
                </th>
              )}
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID do Pedido</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lojista / Beneficiário</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Bruto</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Líquido (80%)</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((record) => (
              <tr 
                key={record.orderId} 
                className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${selectedRecords.includes(record.orderId) ? 'bg-indigo-50/40' : ''}`}
              >
                {isAdmin && (
                  <td className="p-6">
                    <button onClick={() => toggleSelect(record.orderId)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                      {selectedRecords.includes(record.orderId) 
                        ? <CheckSquare size={22} className="text-indigo-600" /> 
                        : <Square size={22} />
                      }
                    </button>
                  </td>
                )}
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
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                         <p className="text-sm font-black text-midnight uppercase">{viewingOrder.payeeName}</p>
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
                         <p className="text-sm font-black text-midnight uppercase">{viewingOrder.paymentMethod || 'Não Informado'}</p>
                      </div>
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
                      <span className="text-xs font-bold uppercase tracking-tight italic">Comissão Serviços Urbanos (20%)</span>
                      <span className="text-sm font-black text-red-500 italic">- R$ {(viewingOrder.amount * 0.2).toFixed(2).replace('.', ',')}</span>
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
    </div>
  );
}
