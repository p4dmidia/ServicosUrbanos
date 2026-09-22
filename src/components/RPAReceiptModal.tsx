import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  User, 
  Building2, 
  DollarSign, 
  QrCode, 
  X,
  Loader2,
  Calendar,
  Sparkles,
  Receipt
} from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import { RPAReceipt, businessRules } from '../lib/businessRules';
import toast from 'react-hot-toast';

interface RPAReceiptModalProps {
  rpa: RPAReceipt;
  isOpen: boolean;
  mode: 'previsao' | 'quitacao' | 'view';
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function RPAReceiptModal({
  rpa,
  isOpen,
  mode,
  onClose,
  onSuccess
}: RPAReceiptModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !rpa) return null;

  const isLockMode = mode === 'quitacao';

  const isDate10Reached = useMemo(() => {
    if (!rpa?.reference_month) return true;
    try {
      const [yStr, mStr] = rpa.reference_month.split('-');
      const yNum = parseInt(yStr, 10);
      const mNum = parseInt(mStr, 10);
      const nextMonth = mNum === 12 ? 1 : mNum + 1;
      const nextYear = mNum === 12 ? yNum + 1 : yNum;
      const paymentDate = new Date(nextYear, nextMonth - 1, 10, 0, 0, 0);
      return new Date() >= paymentDate;
    } catch (e) {
      return true;
    }
  }, [rpa?.reference_month]);

  const handleAcceptPrevisao = async () => {
    try {
      setSubmitting(true);
      const updated = await businessRules.acceptRPAPrevisao(rpa.id, rpa.profile_id);
      if (updated) {
        toast.success('Ciência do Recibo de RPA registrada com sucesso!');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (e) {
      toast.error('Erro ao registrar ciência do RPA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuitacao = async () => {
    try {
      setSubmitting(true);
      const updated = await businessRules.acceptRPAQuitacao(rpa.id, rpa.profile_id);
      if (updated) {
        toast.success('Quitação do Recibo RPA confirmada com sucesso! Escritório Virtual liberado.', {
          icon: '🎉',
          duration: 5000
        });
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (e) {
      toast.error('Erro ao registrar quitação do RPA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      setDownloadingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Cabeçalho
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('SERVIÇOS URBANOS INTERMEDIAÇÃO DE NEGÓCIOS', 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text('RECIBO DE PAGAMENTO A AUTÔNOMO (RPA) - PRESTAÇÃO DE SERVIÇOS', 14, 21);
      doc.text(`Nº DE CONTROLE: ${rpa.rpa_number} • COMPETÊNCIA: ${rpa.month_label.toUpperCase()}`, 14, 27);

      let y = 42;

      // 1. DADOS DA INTERMEDIADORA (TOMADORA)
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('1. DADOS DA EMPRESA INTERMEDIADORA / TOMADORA', 16, y + 4.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Razão Social: ${rpa.company.name}`, 16, y);
      doc.text(`CNPJ: ${rpa.company.cnpj}`, 130, y);
      y += 5;
      doc.text(`Endereço: ${rpa.company.address}`, 16, y);
      doc.text(`Atividade: Intermediação e Agenciamento (CNAE 74.90-1-04)`, 16, y + 5);

      y += 12;

      // 2. DADOS DO PRESTADOR AUTÔNOMO (BENEFICIÁRIO)
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('2. DADOS DO PRESTADOR AUTÔNOMO (BENEFICIÁRIO)', 16, y + 4.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Nome Completo: ${rpa.beneficiary.name}`, 16, y);
      doc.text(`CPF: ${rpa.beneficiary.cpf}`, 130, y);
      y += 5;
      doc.text(`Chave PIX (${rpa.beneficiary.pix_type}): ${rpa.beneficiary.pix_key}`, 16, y);
      doc.text(`Domicílio / UF: ${rpa.beneficiary.city || 'Salvador'} - ${rpa.beneficiary.state || 'BA'}`, 130, y);

      y += 12;

      // 3. DISCRIMINAÇÃO DOS RENDIMENTOS
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const irrfVal = rpa.financial.deducao_irrf || 0;
      const irrfDesc = irrfVal > 0 
        ? '07. Retenção de Imposto de Renda na Fonte (IRRF 27,5% s/ excedente de R$ 5.000)'
        : '07. Retenção de Imposto de Renda na Fonte (IRRF Isento até R$ 5.000)';

      const items = [
        { desc: '01. Nível G0 (Cashback Titular 5%)', val: rpa.financial.rede_g0 || rpa.financial.cashback_mensal || 0 },
        { desc: '02. Nível G1 (Comissão de Rede MMN)', val: rpa.financial.rede_g1 || 0 },
        { desc: '03. Nível G2 (Comissão de Rede MMN)', val: rpa.financial.rede_g2 || 0 },
        { desc: '04. Revendedor (Vendas Diretas / Polo Regional)', val: rpa.financial.vendas_revendedor || 0 },
        { desc: rpa.reference_month?.endsWith('-12') ? `05. Cashback Anual (Ciclo ${rpa.financial.annual_cycle_period || '01/12 a 30/11'} - Liberado)` : `05. Provisão Anual Acumulada (Ciclo ${rpa.financial.annual_cycle_period || '01/12 a 30/11'} - Pago em 10/Dez)`, val: rpa.financial.cashback_anual },
        { desc: '06. TOTAL DOS RENDIMENTOS BRUTOS', val: rpa.financial.bruto_total, isBold: true },
        { desc: irrfDesc, val: irrfVal > 0 ? -irrfVal : 0.00, isDeduction: irrfVal > 0 },
        ...(rpa.financial.adiantamento && rpa.financial.adiantamento > 0 ? [
          { desc: `08. (-) Adiantamento de Rendimentos${rpa.financial.adiantamento_date ? ` (Pago em ${rpa.financial.adiantamento_date})` : ''}`, val: -rpa.financial.adiantamento, isDeduction: true }
        ] : []),
        { desc: '09. Retenção de INSS na Fonte (0% - Intermediação)', val: 0.00 },
        { desc: '10. VALOR LÍQUIDO EFETIVAMENTE PAGO / A PAGAR', val: rpa.financial.liquido_total, isHighlight: true }
      ];

      y += 6;
      items.forEach(it => {
        if (it.isHighlight) {
          doc.setFillColor(236, 253, 245); // emerald-50
          doc.rect(14, y, 142, 7.5, 'FD');
          doc.rect(156, y, 40, 7.5, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(4, 120, 87);
        } else {
          doc.rect(14, y, 142, 6.5);
          doc.rect(156, y, 40, 6.5);
          doc.setFont('helvetica', it.isBold ? 'bold' : 'normal');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
        }

        doc.text(it.desc, 16, y + 4.5);
        doc.text(`R$ ${it.val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 194, y + 4.5, { align: 'right' });
        y += it.isHighlight ? 8 : 6.5;
      });

      y += 3;

      // 3.1 DETALHAMENTO DOS PEDIDOS VINCULADOS
      if (rpa.ordersBreakdown && rpa.ordersBreakdown.length > 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 5.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('3.1 DETALHAMENTO DOS PEDIDOS CONTABILIZADOS', 16, y + 4);
        y += 7.5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text('PEDIDO', 16, y);
        doc.text('DATA', 44, y);
        doc.text('ORIGEM / REGRA', 68, y);
        doc.text('VALOR BASE', 125, y);
        doc.text('ALÍQUOTA', 155, y);
        doc.text('VALOR (R$)', 194, y, { align: 'right' });
        y += 2.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        rpa.ordersBreakdown.slice(0, 8).forEach(ord => {
          doc.text(ord.orderNumber, 16, y);
          doc.text(ord.date, 44, y);
          const origText = ord.origin.length > 30 ? ord.origin.substring(0, 30) + '...' : ord.origin;
          doc.text(origText, 68, y);
          doc.text(`R$ ${ord.amount.toFixed(2)}`, 125, y);
          doc.text(ord.rate, 155, y);
          doc.text(`R$ ${ord.commissionAmount.toFixed(2)}`, 194, y, { align: 'right' });
          y += 3.5;
        });

        if (rpa.ordersBreakdown.length > 8) {
          doc.setFont('helvetica', 'italic');
          doc.text(`... e mais ${rpa.ordersBreakdown.length - 8} pedido(s) contabilizado(s)`, 16, y);
          y += 3.5;
        }
        y += 2;
      }

      // 4. DECLARAÇÃO DE RESPONSABILIDADE FISCAL E PREVIDENCIÁRIA
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('4. DECLARAÇÃO LEGAL DE INTERMEDIAÇÃO & ENCARGOS INDIVIDUAIS', 16, y + 4.5);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const disclaimerLines = doc.splitTextToSize(
        'Declaro para os devidos fins que os valores acima decorrem estritamente de serviços de intermediação e agenciamento de produtos/serviços no ecossistema Serviços Urbanos. Em virtude do enquadramento de intermediação de negócios, a plataforma transfere 100% dos repasses sem retenções na fonte, cabendo exclusivamente a mim, como prestador autônomo pessoa física, o recolhimento de minhas contribuições previdenciárias como contribuinte individual (Carnê-Leão / GPS) e demais tributos perante os órgãos competentes.',
        178
      );
      doc.text(disclaimerLines, 16, y);

      y += disclaimerLines.length * 3.5 + 4;

      // 5. AUTENTICAÇÃO DIGITAL & QUITAÇÃO
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('5. ASSINATURA ELETRÔNICA & QUITAÇÃO', 16, y + 4.5);

      y += 8;
      doc.rect(14, y, 90, 20);
      doc.rect(104, y, 92, 20);

      doc.setFontSize(6.5);
      doc.text('EMPRESA INTERMEDIADORA', 16, y + 4);
      doc.text('PRESTADOR AUTÔNOMO', 106, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('SERVIÇOS URBANOS INTERMEDIAÇÃO', 16, y + 9);
      doc.text(rpa.beneficiary.name.toUpperCase(), 106, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('Autenticado Digitalmente pelo Sistema', 16, y + 14);
      
      const statusText = rpa.status === 'quitado'
        ? `Quitado eletronicamente em ${rpa.quitacao_accepted_at ? new Date(rpa.quitacao_accepted_at).toLocaleString('pt-BR') : 'Hoje'}`
        : rpa.status === 'ciente_previsao'
        ? `Ciência registrada em ${rpa.previsao_accepted_at ? new Date(rpa.previsao_accepted_at).toLocaleString('pt-BR') : 'Hoje'}`
        : 'Pendente de Quitação';
      doc.text(statusText, 106, y + 14);

      const fileName = `RPA_${rpa.rpa_number}_${rpa.reference_month}.pdf`;
      doc.save(fileName);
      toast.success('Recibo de RPA baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF do RPA:', err);
      toast.error('Erro ao gerar arquivo PDF do RPA');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 ${
      isLockMode ? 'bg-black/90 backdrop-blur-xl' : 'bg-black/80 backdrop-blur-md'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0a0e17] border border-white/10 w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-slate-200 relative"
      >
        {/* Banner de Bloqueio se for Modo Quitação */}
        {isLockMode && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-3.5 flex items-center justify-between text-white font-black text-xs uppercase tracking-wider shrink-0 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="animate-pulse shrink-0" />
              <span>Acesso ao Escritório Virtual Bloqueado Temporariamente</span>
            </div>
            <span className="bg-black/30 px-3 py-1 rounded-full text-[10px] font-bold">
              Quitação Obrigatória
            </span>
          </div>
        )}

        {/* Header do Recibo */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-start justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <FileText size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">
                  Recibo de Pagamento a Autônomo (RPA)
                </h2>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {rpa.rpa_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Competência de fechamento: <strong className="text-indigo-400">{rpa.month_label}</strong> • Previsão de depósito: <strong className="text-emerald-400">{rpa.financial.payment_forecast_date}</strong>
              </p>
            </div>
          </div>

          {!isLockMode && onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Corpo Rolável do Documento */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-xs custom-scrollbar">
          
          {/* Alerta Informativo Contextual */}
          {isLockMode ? (
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-3.5">
              <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                  Depósito PIX Programado / Realizado no Dia 10
                </h4>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Os repasses da sua competência fechada foram apurados. Conforme os termos de prestação autônoma, confirme o recebimento e quitação do recibo abaixo para liberar imediatamente o seu painel de afiliado.
                </p>
              </div>
            </div>
          ) : rpa.status === 'ciente_previsao' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-start gap-3.5">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">
                  Ciência do RPA Registrada ({rpa.month_label})
                </h4>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Você já registrou sua ciência quanto aos valores calculados deste recibo. O crédito está programado para depósito na sua chave PIX até o dia 10.
                </p>
              </div>
            </div>
          ) : mode === 'previsao' ? (
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl flex items-start gap-3.5">
              <Calendar size={20} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">
                  Fechamento Contábil de {rpa.month_label}
                </h4>
                <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                  Seus ganhos foram compilados no 1º dia útil. Dê o seu aceite de ciência abaixo para confirmar que está ciente do valor a ser transferido via PIX até o dia 10.
                </p>
              </div>
            </div>
          ) : null}

          {/* Dados das Partes (Intermediadora & Prestador) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tomadora */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">
                <Building2 size={14} className="text-indigo-400" />
                <span>Empresa Intermediadora (Tomadora)</span>
              </div>
              <p className="font-bold text-white text-xs">{rpa.company.name}</p>
              <p className="text-slate-400">CNPJ: <span className="font-mono text-slate-200 font-bold">{rpa.company.cnpj}</span></p>
              <p className="text-slate-400">{rpa.company.address}</p>
              <p className="text-[10px] text-slate-500 font-medium">{rpa.company.activity}</p>
            </div>

            {/* Prestador */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">
                <User size={14} className="text-emerald-400" />
                <span>Prestador Autônomo (Beneficiário)</span>
              </div>
              <p className="font-bold text-white text-xs">{rpa.beneficiary.name}</p>
              <p className="text-slate-400">CPF: <span className="font-mono text-slate-200 font-bold">{rpa.beneficiary.cpf}</span></p>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl mt-1">
                <QrCode size={14} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300 font-mono font-bold truncate">
                  PIX ({rpa.beneficiary.pix_type}): {rpa.beneficiary.pix_key}
                </span>
              </div>
              <p className="text-slate-400 text-[10px]">Localidade: {rpa.beneficiary.city} - {rpa.beneficiary.state}</p>
            </div>
          </div>

          {/* Tabela de Discriminação dos Rendimentos */}
          <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-3.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-indigo-400" />
                <span className="font-black text-[10px] uppercase tracking-wider text-slate-300">
                  Discriminação dos Rendimentos & Isenção de Retenção
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-400">100% Repasse Bruto</span>
            </div>

            <div className="divide-y divide-white/5">
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Nível G0</span>
                <span className="font-mono font-bold text-white">R$ {(rpa.financial.rede_g0 || rpa.financial.cashback_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Nível G1</span>
                <span className="font-mono font-bold text-white">R$ {(rpa.financial.rede_g1 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Nível G2</span>
                <span className="font-mono font-bold text-white">R$ {(rpa.financial.rede_g2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Revendedor</span>
                <span className="font-mono font-bold text-white">R$ {(rpa.financial.vendas_revendedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-5 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-semibold">Cashback / Provisão Anual (2%)</span>
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {rpa.reference_month?.endsWith('-12') ? 'Liberado no Total' : 'Pago em 10/Dez'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">R$ {rpa.financial.cashback_anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-[10px] text-indigo-300/80 mt-1 pl-2 border-l border-indigo-500/30 font-medium">
                  Vigência do Ciclo: <strong>{rpa.financial.annual_cycle_period || '01/12 a 30/11'}</strong> (Acumulado)
                </p>
              </div>

              {/* Total Bruto */}
              <div className="px-5 py-3 bg-white/[0.03] flex items-center justify-between font-bold">
                <span className="text-slate-200">TOTAL DOS RENDIMENTOS BRUTOS</span>
                <span className="font-mono text-sm text-white">R$ {rpa.financial.bruto_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Deduções Fiscais: IRPF e INSS */}
              <div className="px-5 py-2.5 flex items-center justify-between text-slate-400 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span>Desconto de IRPF na Fonte (Ganhos &gt; R$ 5.000,00)</span>
                  {(rpa.financial.deducao_irrf || 0) > 0 ? (
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold">
                      27,5% s/ Excedente
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                      Isento até R$ 5.000,00
                    </span>
                  )}
                </div>
                <span className={`font-mono font-bold ${(rpa.financial.deducao_irrf || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(rpa.financial.deducao_irrf || 0) > 0
                    ? `- R$ ${(rpa.financial.deducao_irrf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'R$ 0,00 (Isento na Fonte)'}
                </span>
              </div>

              <div className="px-5 py-2.5 flex items-center justify-between text-slate-400 bg-emerald-500/[0.02]">
                <div className="flex items-center gap-2">
                  <span>Retenção de INSS na Fonte (0% - Intermediação)</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold">Sem Desconto</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">R$ 0,00 (Isento na Fonte)</span>
              </div>

              {/* (-) Adiantamento de Rendimentos se houver */}
              {(rpa.financial.adiantamento || 0) > 0 && (
                <div className="px-5 py-2.5 flex items-center justify-between text-slate-300 bg-amber-500/10 border-t border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold">(-) Adiantamento de Rendimentos</span>
                    {rpa.financial.adiantamento_date && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                        Pago em {rpa.financial.adiantamento_date}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    - R$ {rpa.financial.adiantamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Total Líquido a Receber */}
              <div className="px-5 py-4 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block">
                    VALOR LÍQUIDO A RECEBER VIA PIX
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Depósito integral programado para {rpa.financial.payment_forecast_date}
                  </span>
                </div>
                <span className="font-mono text-2xl font-black text-emerald-300">
                  R$ {rpa.financial.liquido_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Detalhamento dos Pedidos Vinculados */}
          {rpa.ordersBreakdown && rpa.ordersBreakdown.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={15} className="text-emerald-400" />
                  <span className="font-black text-[10px] uppercase tracking-wider text-slate-300">
                    Detalhamento dos Pedidos Vinculados ({rpa.ordersBreakdown.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  Total: R$ {rpa.financial.liquido_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                      <th className="py-2.5 px-4">Pedido</th>
                      <th className="py-2.5 px-4">Data</th>
                      <th className="py-2.5 px-4">Origem</th>
                      <th className="py-2.5 px-4 text-right">Valor Base</th>
                      <th className="py-2.5 px-4 text-center">Alíquota</th>
                      <th className="py-2.5 px-4 text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                    {rpa.ordersBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-white">{item.orderNumber}</td>
                        <td className="py-2.5 px-4 text-slate-400">{item.date}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold">
                            {item.origin}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-emerald-400 font-bold">{item.rate}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-300">
                          R$ {item.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Declaração Legal e Responsabilidade Individual do Afiliado */}
          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>Declaração Legal de Intermediação & Responsabilidade Previdenciária</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              {rpa.legal_disclaimer}
            </p>
          </div>

          {/* Metadados de Assinatura Digital */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-400">
            <div>
              <span>Código de Autenticação Digital: </span>
              <strong className="font-mono text-slate-300">{rpa.id}</strong>
            </div>

            <div>
              <span>Status do Recibo: </span>
              <strong className={
                rpa.status === 'quitado' ? 'text-emerald-400' :
                rpa.status === 'ciente_previsao' ? 'text-indigo-400' :
                'text-amber-400'
              }>
                {rpa.status === 'quitado' ? 'Quitado / Recebido' :
                 rpa.status === 'ciente_previsao' ? 'Ciência Registrada' :
                 'Pendente de Aceite'}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-6 md:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full sm:w-auto px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
          >
            {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} className="text-indigo-400" />}
            Baixar RPA Oficial (.PDF)
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            {isLockMode ? (
              <button
                onClick={handleAcceptQuitacao}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Confirmo Recebimento & Dou Quitação
              </button>
            ) : mode === 'previsao' ? (
              rpa.status === 'ciente_previsao' || rpa.status === 'quitado' ? (
                <div className="flex items-center gap-3">
                  <span className="px-5 py-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/10">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Ciência já Registrada
                  </span>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              ) : !isDate10Reached ? (
                <div className="flex items-center gap-3">
                  <span className="px-5 py-3 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    Aceite disponível a partir do dia 10
                  </span>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAcceptPrevisao}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={18} />}
                  Estou Ciente do Valor a Receber no Dia 10
                </button>
              )
            ) : (
              onClose && (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Fechar
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
