import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Shield,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePixPayload } from '../lib/pix';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: any[];
  onConfirmPayment: (payeeGroup: any) => Promise<void>;
}

const detectKeyType = (key: string) => {
  if (!key) return 'Chave';
  if (key.includes('@')) return 'E-mail';
  const numeric = key.replace(/\D/g, '');
  if (numeric.length === 11) return 'CPF ou Telefone';
  if (numeric.length === 14) return 'CNPJ';
  if (key.length > 30) return 'Chave Aleatória';
  return 'Chave';
};

export default function PaymentModal({ isOpen, onClose, selectedRecords, onConfirmPayment }: PaymentModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPixKey, setManualPixKey] = useState('');
  const [editingPix, setEditingPix] = useState(false);

  // Removido o agrupamento por destinatário para mostrar registros individuais conforme pedido
  const currentRecord = selectedRecords[currentIndex];

  useEffect(() => {
    if (currentRecord) {
      // Prioridade: Chave PIX cadastrada > CPF cadastrado > Vazio
      const initialKey = currentRecord.payeePixKey || currentRecord.payeeCpf || '';
      setManualPixKey(initialKey);
      
      // Só entra em modo de edição se a chave estiver vazia
      if (initialKey && initialKey.trim() !== '' && initialKey !== '000.000.000-00') {
        setEditingPix(false);
      } else {
        setEditingPix(true);
      }
    }
  }, [currentIndex, currentRecord]);

  const qrCodePayload = useMemo(() => {
    if (!currentRecord || !manualPixKey) return null;
    try {
      return generatePixPayload({
        key: manualPixKey,
        amount: currentRecord.repasse,
        description: `PAG ${currentRecord.orderId}`,
        name: currentRecord.payeeName
      });
    } catch (e) {
      return null;
    }
  }, [currentRecord, manualPixKey]);

  const handleNext = () => {
    if (currentIndex < selectedRecords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const confirmCurrent = async () => {
    if (!manualPixKey) {
      toast.error('Informe a chave PIX para confirmar');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Como agora trabalhamos individualmente, passamos o registro no formato que o onConfirmPayment espera
      // (simulando um grupo com apenas um pedido)
      await onConfirmPayment({
        payeeId: currentRecord.payeeId,
        payeeName: currentRecord.payeeName,
        payeePixKey: manualPixKey,
        totalAmount: currentRecord.repasse,
        orders: [currentRecord]
      });

      if (currentIndex < selectedRecords.length - 1) {
        handleNext();
      } else {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPayload = () => {
    if (qrCodePayload) {
      navigator.clipboard.writeText(qrCodePayload);
      toast.success('Copiado para a área de transferência');
    }
  };

  if (!isOpen || !currentRecord) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-midnight/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
      >
        {/* Barra Lateral de Status */}
        <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col">
           <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-600/20">
              <QrCode size={24} />
           </div>

           <div className="space-y-1">
              <h3 className="text-xl font-black text-midnight italic uppercase tracking-tighter leading-none">Pagamentos</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lista de Beneficiários</p>
           </div>

           <div className="mt-12 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {selectedRecords.map((record, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    idx === currentIndex 
                      ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' 
                      : idx < currentIndex ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-slate-100'
                  }`}
                >
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${idx === currentIndex ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Ref: {record.orderId}
                  </p>
                  <p className={`text-[11px] font-black uppercase truncate ${idx === currentIndex ? 'text-white' : 'text-midnight'}`}>
                    {record.payeeName}
                  </p>
                  <p className={`text-xs font-black italic ${idx === currentIndex ? 'text-white/90' : 'text-indigo-600'}`}>
                    R$ {record.repasse.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
           </div>
        </div>

        {/* Área Principal do QR Code */}
        <div className="flex-1 p-8 md:p-12 space-y-8 overflow-y-auto custom-scrollbar">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-midnight italic uppercase tracking-tighter">Liquidando Repasse</h2>
                  <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Hash size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      ID: {currentRecord.orderId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentRecord.payeeName}</span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pagamento Único</span>
                  {currentRecord.payeeCpf && (
                    <>
                      <span className="text-xs text-slate-300">•</span>
                      <div className="flex items-center gap-1">
                        <Shield size={12} className="text-indigo-400" />
                        <span className="text-xs font-bold text-slate-400">CPF: {currentRecord.payeeCpf}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Valor do Repasse</p>
                 <p className="text-4xl font-black text-indigo-600 italic tracking-tighter">R$ {currentRecord.repasse.toFixed(2).replace('.', ',')}</p>
                 
                 {/* Detalhamento para Afiliados */}
                 {currentRecord.buyerName === 'Rede MMN' && (
                   <div className="flex flex-col items-end gap-1 mt-3 border-t border-slate-100 pt-3">
                     {currentRecord.items?.map((item: any, i: number) => (
                       <div key={i} className="flex items-center gap-2">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.name}:</span>
                         <span className={`text-[9px] font-black ${
                           item.name.includes('Mensal') ? 'text-emerald-500' : 
                           item.name.includes('Digital') ? 'text-blue-500' : 'text-indigo-400'
                         }`}>
                           R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}
                         </span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>

           {/* Input de Chave PIX */}
           <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-indigo-600">
                    <QrCode size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Chave PIX Destinatário</span>
                 </div>
                 <button 
                   onClick={() => setEditingPix(!editingPix)}
                   className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                 >
                   {editingPix ? 'Salvar' : 'Editar'}
                 </button>
              </div>

              {editingPix ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      value={manualPixKey}
                      onChange={(e) => setManualPixKey(e.target.value)}
                      placeholder="E-mail, CPF, Telefone ou Chave Aleatória"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                      autoFocus
                    />
                    {manualPixKey && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {detectKeyType(manualPixKey)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold italic px-2 uppercase tracking-tight">
                    O sistema formatará {detectKeyType(manualPixKey)} automaticamente seguindo o padrão BACEN.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{detectKeyType(manualPixKey)}</span>
                      <span className="font-black text-midnight tracking-tight">
                        {manualPixKey || <span className="text-red-400 italic">Chave não informada</span>}
                      </span>
                   </div>
                   {manualPixKey ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Shield size={16} className="text-slate-200" />}
                </div>
              )}
           </div>

           {/* Área do QR Code */}
           <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
              {manualPixKey ? (
                <div className="space-y-6 flex flex-col items-center">
                   <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                      {qrCodePayload && <QRCodeSVG value={qrCodePayload} size={200} />}
                   </div>
                   <button 
                     onClick={copyPayload}
                     className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-midnight transition-colors"
                   >
                      <Copy size={14} /> Copiar Código Copia e Cola
                   </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300 py-12">
                   <AlertCircle size={48} className="opacity-20" />
                   <p className="text-xs font-black uppercase tracking-widest text-center max-w-xs">Insira uma chave PIX acima para gerar o código de pagamento.</p>
                </div>
              )}
           </div>

           {/* Controles de Navegação */}
           <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              <div className="flex gap-2">
                 <button 
                   onClick={handlePrev}
                   disabled={currentIndex === 0}
                   className="p-4 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-all"
                 >
                   <ChevronLeft size={20} />
                 </button>
                 <button 
                   onClick={handleNext}
                   disabled={currentIndex === selectedRecords.length - 1}
                   className="p-4 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-all"
                 >
                   <ChevronRight size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-4">
                 <div className="hidden md:flex flex-col text-right">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Atenção</p>
                    <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">Confirme o pagamento no seu banco<br/>antes de marcar como pago.</p>
                 </div>
                 <button 
                   onClick={confirmCurrent}
                   disabled={isProcessing || !manualPixKey}
                   className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
                 >
                   {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                   Marcar como Pago
                 </button>
              </div>
           </div>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-colors">
           <X size={24} className="text-slate-400" />
        </button>
      </motion.div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
