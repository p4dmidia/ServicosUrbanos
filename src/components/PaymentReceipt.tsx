import React from 'react';
import { CheckCircle2, ShieldCheck, Printer, Download, X } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentReceiptProps {
  receiptData: {
    id: string;
    payeeName: string;
    payeePixKey: string;
    amount: number;
    date: string;
    description: string;
    authCode?: string;
    transactionId?: string;
  };
  onClose: () => void;
}

export default function PaymentReceipt({ receiptData, onClose }: PaymentReceiptProps) {
  const authCode = receiptData.authCode || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const transactionId = receiptData.transactionId || 'E' + Math.random().toString().substring(2, 26);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:rounded-none print:max-w-full print:p-0"
      >
        {/* Header - No Print */}
        <div className="p-6 flex justify-between items-center bg-slate-50 border-b border-slate-100 print:hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Comprovante de Pagamento</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] print:max-h-none print:p-12" id="printable-receipt">
          {/* Brand & Status */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter italic">SERVIÇOS<span className="text-indigo-600">URBANOS</span></span>
            </div>
            
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="size-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <p className="text-emerald-500 font-black text-xl italic uppercase tracking-tighter">Pix realizado!</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{receiptData.date}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Destinatário</p>
              <p className="text-sm font-black text-midnight uppercase tracking-tight">{receiptData.payeeName}</p>
              <p className="text-xs text-slate-500 font-medium">Chave PIX: {receiptData.payeePixKey}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Valor</p>
                <p className="text-xl font-black text-midnight italic tracking-tighter">R$ {receiptData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Tipo</p>
                <p className="text-xs font-bold text-midnight uppercase">Transferência PIX</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Descrição</p>
              <p className="text-xs font-medium text-slate-600">{receiptData.description}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          {/* Security Info */}
          <div className="space-y-4">
             <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Código de Autenticação</p>
              <p className="text-[10px] font-mono text-slate-500 break-all">{authCode}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ID da Transação</p>
              <p className="text-[10px] font-mono text-slate-500 break-all">{transactionId}</p>
            </div>
          </div>

          {/* Footer Receipt */}
          <div className="pt-4 flex items-center justify-center gap-2 text-slate-300">
             <ShieldCheck size={14} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">Pagamento Seguro via Serviços Urbanos</span>
          </div>
        </div>

        {/* Actions - No Print */}
        <div className="p-8 pt-0 grid grid-cols-2 gap-4 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button 
            onClick={handlePrint} // No browser environment, print to PDF is often the same
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
          >
            <Download size={16} /> Salvar PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}
