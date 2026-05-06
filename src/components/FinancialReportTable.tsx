import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface FinancialRecord {
  orderId: string;
  buyerName: string;
  orderStatus: 'Pendente' | 'Processando' | 'Pago' | 'Cancelado' | 'Pago, Aguardando Retirada';
  deliveryStatus: 'Pendente' | 'Enviado' | 'Entregue' | 'Cancelado';
  saleDate: string;
  amount: number;
  repasse: number;
  payDate: string;
  managerName?: string;
}

interface Props {
  data: FinancialRecord[];
  title?: string;
  isAdmin?: boolean;
}

export default function FinancialReportTable({ data, title = "Histórico Financeiro", isAdmin = false }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [deliveryFilter, setDeliveryFilter] = useState('Todos');
  const [payDateFilter, setPayDateFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extrair datas de pagamento únicas para o filtro
  const uniquePayDates = useMemo(() => {
    const dates = [...new Set(data.map(item => item.payDate))];
    return dates.sort((a, b) => {
      const dateA = a.split('/').reverse().join('');
      const dateB = b.split('/').reverse().join('');
      return dateB.localeCompare(dateA); // Ordem decrescente
    });
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.orderId.toLowerCase().includes(search.toLowerCase()) || 
                            item.buyerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || item.orderStatus === statusFilter;
      const matchesDelivery = deliveryFilter === 'Todos' || item.deliveryStatus === deliveryFilter;
      const matchesPayDate = payDateFilter === 'Todos' || item.payDate === payDateFilter;
      
      return matchesSearch && matchesStatus && matchesDelivery && matchesPayDate;
    });
  }, [data, search, statusFilter, deliveryFilter, payDateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, deliveryFilter, payDateFilter]);

  const totalAReceber = useMemo(() => {
    return filteredData
      .filter(item => {
        const isPaid = item.orderStatus.toLowerCase() === 'pago' || item.orderStatus.toLowerCase() === 'concluído';
        const isDelivered = item.deliveryStatus.toLowerCase() === 'entregue' || item.deliveryStatus.toLowerCase() === 'concluído';
        return isPaid && isDelivered;
      })
      .reduce((acc, curr) => acc + curr.repasse, 0);
  }, [filteredData]);

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pago' || s === 'entregue' || s === 'concluído') {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (s === 'pendente' || s === 'processando' || s === 'pago, aguardando retirada') {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (s === 'cancelado') {
      return 'bg-red-50 text-red-600 border-red-100';
    }
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {isAdmin ? 'Gestão de repasses e liquidação' : 'Comissões de Gerentes (Filiais)'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-100">
                <Download size={14} /> Exportar
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="ID ou Comprador..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all text-midnight"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
           </div>

           <select 
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none text-midnight cursor-pointer"
           >
             <option value="Todos">Status Pedido</option>
             <option value="Pago">Pago</option>
             <option value="Pendente">Pendente</option>
             <option value="Cancelado">Cancelado</option>
           </select>

           <select 
             value={deliveryFilter}
             onChange={e => setDeliveryFilter(e.target.value)}
             className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none text-midnight cursor-pointer"
           >
             <option value="Todos">Status Entrega</option>
             <option value="Entregue">Entregue</option>
             <option value="Pendente">Pendente</option>
             <option value="Cancelado">Cancelado</option>
           </select>

           <select 
             value={payDateFilter}
             onChange={e => setPayDateFilter(e.target.value)}
             className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none text-midnight cursor-pointer"
           >
             <option value="Todos">A Pagar Dia</option>
             {uniquePayDates.map(date => (
               <option key={date} value={date}>{date}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Rules Alert - Premium Spreadsheet Style */}
      <div className="bg-[#fffbeb] border-2 border-[#fef3c7] p-8 rounded-[2rem] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Info size={120} />
         </div>
         
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-amber-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-400/20">
                <CheckCircle size={18} />
              </div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-[0.2em] italic">Regras de Liberação de Valores</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/50 p-4 rounded-2xl border border-amber-200/50">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Condição de Repasse</p>
                <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
                  Os valores só serão liberados ao lojista quando o status do pedido e status da entrega estiverem <strong className="text-amber-900 font-black">PAGOS E ENTREGUES</strong>.
                </p>
              </div>
              
              <div className="bg-amber-400 p-4 rounded-2xl shadow-xl shadow-amber-400/10 border border-amber-500/20">
                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Horário de Liquidação</p>
                <p className="text-xs text-amber-900 font-black italic leading-tight">
                  OS REPASSES SERÃO FEITOS TODOS OS DIAS ATÉ AS 17 HS DE TODOS OS PEDIDOS DEVIDAMENTE QUITADOS E ENTREGUES ATÉ AS 17 HS DO DIA ANTERIOR.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-bold text-amber-700/60 uppercase tracking-widest">
              <AlertCircle size={12} />
              Caso algum status esteja pendente, o valor ficará retido pela Serviços Urbanos
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">ID do Pedido</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Comprador</th>
                {!isAdmin && <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Gerente (Filial)</th>}
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Status Pedido</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Status Entrega</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Data Venda</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Valor Compra</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">{isAdmin ? 'Repasse' : 'Comissão Gerente'}</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">A Pagar Dia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              <AnimatePresence mode="popLayout">
                {paginatedData.length > 0 ? paginatedData.map((item, idx) => (
                  <motion.tr 
                    key={item.orderId + idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6 font-black text-midnight italic">#{item.orderId}</td>
                    <td className="px-8 py-6">
                       <span className="font-bold text-midnight uppercase tracking-tight">{item.buyerName}</span>
                    </td>
                    {!isAdmin && (
                      <td className="px-8 py-6">
                        <span className="font-bold text-primary-blue uppercase tracking-tight">{item.managerName || 'N/A'}</span>
                      </td>
                    )}
                    <td className="px-8 py-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(item.orderStatus)}`}>
                         {item.orderStatus}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(item.deliveryStatus)}`}>
                         {item.deliveryStatus}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-slate-400">{item.saleDate}</td>
                    <td className="px-8 py-6 text-right font-bold text-slate-400">R$ {item.amount.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-right font-black text-midnight tracking-tighter italic text-sm">R$ {item.repasse.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="font-black text-primary-blue italic">{item.payDate}</span>
                          <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Previsto</span>
                       </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center opacity-20">
                          <AlertCircle size={48} className="mb-4" />
                          <p className="text-sm font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                       </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
            <tfoot>
               <tr className="bg-midnight text-white font-black italic">
                  <td colSpan={isAdmin ? 6 : 7} className="px-8 py-6 text-right uppercase tracking-[0.2em] text-[10px]">
                    {isAdmin ? 'Total a Receber (Liquidados)' : 'Total de Comissões a Pagar (Liquidados)'}
                  </td>
                  <td className="px-8 py-6 text-right text-lg tracking-tighter">R$ {totalAReceber.toFixed(2).replace('.', ',')}</td>
                  <td></td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="size-10 flex items-center justify-center rounded-xl bg-slate-50 text-midnight disabled:opacity-30 border border-slate-100 hover:bg-slate-100 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                // Mostrar apenas algumas páginas se houver muitas
                if (totalPages > 7) {
                  if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                    if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 text-slate-300">...</span>;
                    return null;
                  }
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-10 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                        : 'bg-white text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="size-10 flex items-center justify-center rounded-xl bg-slate-50 text-midnight disabled:opacity-30 border border-slate-100 hover:bg-slate-100 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

