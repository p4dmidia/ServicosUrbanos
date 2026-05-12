import React from 'react';
import { Check, Printer, Download, X, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentReceiptProps {
  receiptData: {
    id: string;
    payeeName: string;
    payeePixKey?: string;
    payeeCpf?: string;
    amount: number;
    date: string;
    description: string;
    authCode?: string;
    transactionId?: string;
    bankName?: string;
  };
  onClose: () => void;
}

export default function PaymentReceipt({ receiptData, onClose }: PaymentReceiptProps) {
  // Generate identifiable IDs based on the order ID if real ones aren't provided
  const authCode = receiptData.authCode || `SU-${receiptData.id}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const transactionId = receiptData.transactionId || `E${receiptData.id}${new Date().getTime()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const bankName = receiptData.bankName || 'BCO SANTANDER (BRASIL) S.A.';
  
  // Format CPF to show 6 middle digits: ***.456.789-**
  const formatCpf = (cpf?: string) => {
    if (!cpf) return '***.***.***-**';
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return cpf;
    return `***.${cleanCpf.substring(3, 6)}.${cleanCpf.substring(6, 9)}-**`;
  };

  const maskedCpf = formatCpf(receiptData.payeeCpf);

  // Get initials from payee name
  const name = receiptData.payeeName || 'Usuário';
  const initials = name
    .split(' ')
    .filter(n => n.length > 0)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm print:bg-white print:p-0">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#f4f4f4] w-full max-w-md h-full md:h-auto md:max-h-[90vh] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:rounded-none print:max-w-full print:h-screen"
      >
        {/* Header - No Print */}
        <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100 print:hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Comprovante Pix</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f4f4f4] print:overflow-visible">
          {/* Receipt Card */}
          <div 
            id="pix-receipt-content"
            className="mx-auto my-4 md:my-8 bg-white w-[90%] max-w-[360px] shadow-sm relative print:my-0 print:w-full print:max-w-none print:shadow-none"
          >
            {/* Top Border Deco */}
            <div className="h-2 w-full bg-slate-900 flex justify-between items-start overflow-hidden">
               {Array.from({ length: 20 }).map((_, i) => (
                 <div key={i} className="w-4 h-4 bg-white rounded-full -mt-2 shrink-0" />
               ))}
            </div>

            <div className="p-8 space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-1">
                <span className="text-xl font-black tracking-tighter italic">SERVIÇOS<span className="text-indigo-600">URBANOS</span></span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-12 relative">
                {/* Connector Line */}
                <div className="absolute top-4 left-[30%] right-[30%] h-[1px] bg-slate-200" />
                
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">Pix em<br/>andamento</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">{receiptData.date}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">Pix<br/>realizado!</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">{receiptData.date}</p>
                  </div>
                </div>
              </div>

              {/* Payee Info */}
              <div className="space-y-6 pt-4">
                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold tracking-tighter">
                  {initials}
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-900 leading-tight">{name}</p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p><span className="font-medium text-slate-700">Banco:</span> {bankName}</p>
                    <p><span className="font-medium text-slate-700">Agência:</span> ****</p>
                    <p><span className="font-medium text-slate-700">Conta:</span> 0***-*</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                   <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">Código de autenticação</p>
                      <p className="text-[11px] font-bold text-slate-900 break-all">{authCode}</p>
                   </div>
                   <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">ID da transação</p>
                      <p className="text-[11px] font-bold text-slate-900 break-all">{transactionId}</p>
                   </div>
                   <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">CPF / CNPJ</p>
                      <p className="text-[11px] font-bold text-slate-900">{maskedCpf}</p>
                   </div>
                </div>

                <div className="pt-4">
                   <p className="text-[11px] text-slate-400 font-medium mb-1">Valor</p>
                   <p className="text-2xl font-bold text-slate-900">R$ {receiptData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div>
                   <p className="text-[11px] text-slate-400 font-medium mb-1">Data e hora da transação</p>
                   <p className="text-[11px] font-bold text-slate-900">{receiptData.date}</p>
                </div>

                <div>
                   <p className="text-[11px] text-slate-400 font-medium mb-1">Descrição</p>
                   <p className="text-[11px] font-bold text-slate-900">{receiptData.description}</p>
                </div>
              </div>

              {/* Bottom Border */}
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between opacity-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Serviços Urbanos</span>
                <ShieldCheck size={14} className="text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions - No Print */}
        <div className="p-8 bg-white border-t border-slate-100 grid grid-cols-2 gap-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
          >
            <Download size={16} /> Baixar
          </button>
        </div>
      </motion.div>

      {/* Global CSS for printing the receipt */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #pix-receipt-content, #pix-receipt-content * {
            visibility: visible;
          }
          #pix-receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}} />
    </div>
  );
}
