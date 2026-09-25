import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Clock, 
  DollarSign, 
  Building2, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  HelpCircle,
  Link as LinkIcon,
  Check,
  MapPin,
  Building,
  User,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Receipt,
  PackageCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { getFiscalPortalForCity, NATIONAL_MEI_PORTAL, normalizeCity } from '../lib/fiscalPortals';
import { auditInvoicePdf, parseBrazilianCurrency, InvoiceAuditResult } from '../lib/pdfInvoiceParser';
import RPAReceiptModal from '../components/RPAReceiptModal';
import { RPAReceipt } from '../lib/businessRules';
import toast from 'react-hot-toast';

export default function AffiliateInvoice() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [invoiceLink, setInvoiceLink] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estados de Auditoria Automática e Cidade Fiscal
  const [taxpayerType, setTaxpayerType] = useState<'pf' | 'pj'>('pf');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');

  // Declaração do valor e auditoria do arquivo
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<InvoiceAuditResult | null>(null);

  // Estados exclusivos de RPA (Pessoa Física)
  const [rpaReceipt, setRpaReceipt] = useState<RPAReceipt | null>(null);
  const [allUserRpas, setAllUserRpas] = useState<RPAReceipt[]>([]);
  const [isRPAModalOpen, setIsRPAModalOpen] = useState(false);

  // Estados de Adiantamento Mensal (PF)
  const [advanceRequests, setAdvanceRequests] = useState<any[]>([]);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const [advanceNotesInput, setAdvanceNotesInput] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  // Navegação e Filtro por Mês da Competência do RPA
  const defaultClosedDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const [currentDate, setCurrentDate] = useState(defaultClosedDate);

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12
  const refMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const defaultRefMonthStr = `${defaultClosedDate.getFullYear()}-${String(defaultClosedDate.getMonth() + 1).padStart(2, '0')}`;
  const isDefaultCompetence = refMonthStr === defaultRefMonthStr;

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrent = () => {
    setCurrentDate(defaultClosedDate);
  };

  const companyData = {
    razaoSocial: 'SERVIÇOS URBANOS INTERMEDIAÇÃO DE NEGÓCIOS LTDA',
    cnpj: '58.490.123/0001-45',
    descricaoServico: 'Intermediação de negócios, agenciamento e divulgação de planos de benefícios e serviços urbanos.'
  };

  // Totais agregados da tabela de pedidos vinculados ao RPA
  const { totalContratosUnicos, totalComissaoCalculada, mediaPercentual } = useMemo(() => {
    if (!rpaReceipt?.ordersBreakdown || rpaReceipt.ordersBreakdown.length === 0) {
      return { totalContratosUnicos: 0, totalComissaoCalculada: 0, mediaPercentual: 0 };
    }
    const uniqueOrders = new Map<string, number>();
    let totalComissao = 0;

    rpaReceipt.ordersBreakdown.forEach((o: any) => {
      const key = o.orderId && o.orderId !== '---' ? String(o.orderId) : (o.orderNumber || o.id);
      const amt = Number(o.contractAmount || o.amount || 0);
      if (!uniqueOrders.has(key) || amt > (uniqueOrders.get(key) || 0)) {
        uniqueOrders.set(key, amt);
      }
      totalComissao += Number(o.commissionAmount || o.bruto || 0);
    });

    const totalContratos = Array.from(uniqueOrders.values()).reduce((a, b) => a + b, 0);
    const perc = totalContratos > 0 ? (totalComissao / totalContratos) * 100 : 0;

    return {
      totalContratosUnicos: totalContratos,
      totalComissaoCalculada: totalComissao,
      mediaPercentual: perc
    };
  }, [rpaReceipt?.ordersBreakdown]);

  // Inicializa a cidade e o tipo tributário com base no perfil do afiliado
  useEffect(() => {
    if (profile) {
      const city = profile.city || 'Salvador';
      const state = profile.state || 'BA';
      setSelectedCity(city);
      setSelectedState(state);
      setCityInput(city);
      setStateInput(state);

      const isPJ = profile.person_type === 'PJ' || Boolean(profile.cnpj && profile.cnpj.replace(/\D/g, '').length === 14) || Boolean((profile as any).description?.includes('[PJ]'));
      if (isPJ) {
        setTaxpayerType('pj');
      } else {
        setTaxpayerType('pf');
      }
    }
  }, [profile]);

  // Informações do portal fiscal da cidade selecionada
  const fiscalPortal = useMemo(() => {
    return getFiscalPortalForCity(selectedCity, selectedState);
  }, [selectedCity, selectedState]);

  const loadData = async (targetMonthStr?: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const activeRefMonth = targetMonthStr || refMonthStr;
      const isPJUser = taxpayerType === 'pj';

      if (isPJUser) {
        const [y, m] = activeRefMonth.split('-');
        const [res, advList] = await Promise.all([
          businessRules.getAffiliateInvoiceSummary(user.id, parseInt(y, 10), parseInt(m, 10) - 1),
          businessRules.getAffiliateAdvanceRequests(activeRefMonth, user.id)
        ]);
        setSummary(res);
        setAdvanceRequests(advList || []);
        if (res.totalGross) {
          setDeclaredAmount(res.totalGross.toFixed(2).replace('.', ','));
        }
        if (res.currentInvoice) {
          setInvoiceLink(res.currentInvoice.invoice_link || '');
          setInvoiceNumber(res.currentInvoice.invoice_number || '');
          if (res.currentInvoice.amount_gross) {
            setDeclaredAmount(Number(res.currentInvoice.amount_gross).toFixed(2).replace('.', ','));
          }
        }
      } else {
        // Pessoa Física: Carrega Recibo RPA para o mês selecionado e solicitações de adiantamento
        const [currentRpa, rpasList, advList] = await Promise.all([
          businessRules.generateMonthlyRPAReceipt(user.id, activeRefMonth),
          businessRules.getAffiliateRPAReceipts(user.id),
          businessRules.getAffiliateAdvanceRequests(activeRefMonth, user.id)
        ]);

        setRpaReceipt(currentRpa);
        setAllUserRpas(rpasList || []);
        setAdvanceRequests(advList || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados fiscais:', error);
      toast.error('Erro ao carregar resumo contábil.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSubmittingAdvance(true);
      const cleanVal = parseFloat(advanceAmountInput.replace(/\./g, '').replace(',', '.'));
      if (isNaN(cleanVal) || cleanVal <= 0) {
        toast.error('Informe um valor válido para o adiantamento.');
        return;
      }

      const isPJUser = taxpayerType === 'pj';
      const availableNet = isPJUser 
        ? (summary?.totalGross || summary?.monthlyGross || 0)
        : (rpaReceipt?.financial?.liquido_total !== undefined 
            ? rpaReceipt.financial.liquido_total 
            : (rpaReceipt?.financial?.bruto_total || 0));

      if (availableNet <= 0) {
        toast.error('Não há saldo líquido disponível para adiantamento.');
        return;
      }

      if (Math.abs(cleanVal - availableNet) > 0.05) {
        toast.error(`A solicitação de adiantamento deve ser no valor integral disponível de R$ ${availableNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Não são permitidas antecipações parciais.`);
        return;
      }

      await businessRules.requestAffiliateAdvance(user.id, cleanVal, advanceNotesInput);
      toast.success('Solicitação de adiantamento enviada com sucesso! A administração analisará seu pedido para transferência via PIX.', {
        duration: 5000,
        icon: '💵'
      });
      setIsAdvanceModalOpen(false);
      setAdvanceAmountInput('');
      setAdvanceNotesInput('');
      await loadData(refMonthStr);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar solicitação de adiantamento.');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  useEffect(() => {
    loadData(refMonthStr);
  }, [user, profile, refMonthStr, taxpayerType]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copiado com sucesso!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Auditoria automática quando o afiliado escolhe um arquivo
  const handleFileChange = async (file: File | null) => {
    setInvoiceFile(file);
    setAuditResult(null);

    if (!file) return;

    // Se for PDF, executa a auditoria automática de texto
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        setIsAuditing(true);
        const expected = summary?.totalGross || 0;
        const affDoc = profile?.cpf || profile?.cnpj || '';
        const result = await auditInvoicePdf(file, expected, affDoc);
        setAuditResult(result);

        if (result.extractedNumber && !invoiceNumber) {
          setInvoiceNumber(result.extractedNumber);
        }

        if (result.isValid) {
          toast.success('Nota Fiscal validada com sucesso! O valor confere exatamente.');
        } else {
          toast.error(result.message, { duration: 6000 });
        }
      } catch (err) {
        console.error('Erro ao auditar PDF:', err);
      } finally {
        setIsAuditing(false);
      }
    } else {
      // Para fotos/imagens, avisa sobre a conferência pelo valor declarado
      toast('Arquivo de imagem anexado. Certifique-se de que os dados e valores estejam legíveis.', { icon: 'ℹ️' });
    }
  };

  // Validação do valor declarado vs valor exigido
  const declaredNumeric = useMemo(() => {
    return parseBrazilianCurrency(declaredAmount);
  }, [declaredAmount]);

  const expectedTotal = summary?.totalGross || 0;
  const isDeclaredValueMatching = Math.abs(declaredNumeric - expectedTotal) < 0.02;

  // Atualização manual da cidade fiscal
  const handleSaveCustomCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) {
      toast.error('Informe o nome da cidade.');
      return;
    }
    setSelectedCity(cityInput.trim());
    setSelectedState(stateInput.trim() || 'BA');
    setIsEditingCity(false);
    toast.success(`Cidade fiscal atualizada para ${cityInput.trim()}!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !summary) return;

    if (!invoiceLink.trim() && !invoiceFile && !summary.currentInvoice?.file_url) {
      toast.error('Por favor, faça upload do PDF da Nota Fiscal ou informe o link da Prefeitura.');
      return;
    }

    // 1. Validação do valor declarado
    if (!isDeclaredValueMatching) {
      toast.error(
        `O valor da nota deve ser exatamente R$ ${expectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O valor informado (R$ ${declaredNumeric.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) diverge do total apurado.`,
        { duration: 6000 }
      );
      return;
    }

    // 2. Validação do arquivo PDF (se auditado e inválido, bloqueia o envio)
    if (auditResult && !auditResult.isValid) {
      toast.error(`Envio bloqueado: ${auditResult.message}`, { duration: 6000 });
      return;
    }

    try {
      setSubmitting(true);
      await businessRules.submitAffiliateInvoice({
        profile_id: user.id,
        reference_month: summary.referenceMonth,
        amount_gross: declaredNumeric || summary.totalGross,
        invoice_number: invoiceNumber,
        invoice_link: invoiceLink.trim() || undefined,
        file: invoiceFile || undefined,
        status: auditResult?.isValid ? 'verified' : 'pending'
      });

      toast.success('Nota Fiscal enviada com sucesso para conferência financeira!');
      await loadData();
    } catch (error) {
      console.error('Erro ao enviar nota fiscal:', error);
      toast.error('Ocorreu um erro ao enviar a nota fiscal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (taxpayerType === 'pf') {
    return (
      <AffiliateLayout title="Recibo de Pagamento a Autônomo (RPA)">
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
          {/* Banner Informativo de Intermediação e Isenção de Retenção */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                  Regra Oficial de Repasse Autônomo (RPA)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Repasses a autônomos (Pessoa Física) processados com retenção de <strong>INSS (11%)</strong> e <strong>IRPF na Fonte (conforme tabela progressiva e Lei 15.270)</strong>. Pessoas Jurídicas (PJ) recebem sem retenções mediante Nota Fiscal.
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-emerald-100/80 px-4 py-2 rounded-xl border border-emerald-300 text-[10px] font-black uppercase tracking-wider text-emerald-800 shadow-sm">
              Depósito Todo Dia 10 via PIX
            </div>
          </div>

          {/* Barra de Filtro de Mês / Competência do RPA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <Calendar size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider">
                    Competência do RPA
                  </h4>
                  {isDefaultCompetence && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Mês a Receber
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Navegue entre os meses com as setas para filtrar os valores e pedidos correspondentes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
              {!isDefaultCompetence && (
                <button
                  onClick={handleResetToCurrent}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Voltar para a competência padrão a receber"
                >
                  <RefreshCw size={12} />
                  Mês Atual
                </button>
              )}

              {/* Controles de Navegação com Setas Esquerda/Direita */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                  title="Mês Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 text-center min-w-[160px]">
                  <span className="text-xs font-black text-midnight uppercase tracking-wider block capitalize">
                    {monthLabel}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {isDefaultCompetence ? 'Competência Aberta' : 'Filtro por Mês'}
                  </span>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2.5 rounded-xl hover:bg-white text-slate-600 hover:text-midnight transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                  title="Próximo Mês"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Card de Solicitação de Adiantamento Mensal de Rendimentos */}
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <DollarSign size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                    Adiantamento Mensal de Rendimentos
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[9px] font-black uppercase tracking-wider">
                    1 Solicitação por Mês
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} /> Recebimento no Dia Útil Seguinte
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Todo afiliado tem direito a solicitar a antecipação de seus rendimentos apurados no mês. O valor antecipado é transferido para sua chave PIX <strong>no dia útil seguinte</strong> e <strong>descontado automaticamente no acerto do dia 10</strong>.
                </p>
                {advanceRequests && advanceRequests.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {advanceRequests.map((adv: any) => (
                      <div 
                        key={adv.id} 
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold border ${
                          adv.status === 'paid' 
                            ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' 
                            : adv.status === 'rejected'
                            ? 'bg-rose-100/80 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <span>
                          {adv.status === 'paid' ? '✅ Adiantamento Pago:' : adv.status === 'rejected' ? '❌ Adiantamento Recusado:' : '⏳ Em Análise:'} R$ {adv.amount.toFixed(2).replace('.', ',')}
                        </span>
                        {adv.paid_at && <span className="text-[10px] text-emerald-700 font-normal">({adv.paid_at})</span>}
                        {adv.receipt_url && (
                          <a 
                            href={adv.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-emerald-900 underline font-black ml-1"
                          >
                            Ver Comprovante PIX
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end">
              {(!advanceRequests || !advanceRequests.some((a: any) => a.status === 'pending' || a.status === 'paid')) ? (
                <button
                  onClick={() => {
                    const maxNet = rpaReceipt?.financial?.liquido_total || 0;
                    setAdvanceAmountInput(maxNet > 0 ? maxNet.toFixed(2).replace('.', ',') : '');
                    setIsAdvanceModalOpen(true);
                  }}
                  disabled={(rpaReceipt?.financial?.liquido_total || 0) <= 0}
                  className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <DollarSign size={16} />
                  Solicitar Adiantamento
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-xl border border-amber-300">
                  {advanceRequests.some((a: any) => a.status === 'paid') ? 'Adiantamento Concedido' : 'Solicitação em Análise'}
                </span>
              )}
            </div>
          </div>

          {/* Grid Principal do RPA Atual */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Card de Rendimentos da Competência Fechada */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                    Competência: {rpaReceipt?.month_label || monthLabel}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    {rpaReceipt?.rpa_number || `RPA-${refMonthStr.replace('-', '')}`}
                  </span>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Valor Total a Receber via PIX
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-midnight tracking-tighter mb-4 font-mono">
                  R$ {loading ? '...' : (rpaReceipt?.financial.liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>

                <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                  Este valor será depositado diretamente na sua chave PIX no <strong>dia {rpaReceipt?.financial.payment_forecast_date ? rpaReceipt.financial.payment_forecast_date.split('/')[0] : '10'}</strong>. O documento oficial de RPA foi preenchido automaticamente pelo sistema.
                </p>

                {/* Discriminação */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Nível G0:</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.rede_g0 || rpaReceipt?.financial.cashback_mensal || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Nível G1:</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.rede_g1 || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Nível G2:</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.rede_g2 || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Revendedor:</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.vendas_revendedor || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">Cashback / Provisão Anual (2%):</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {refMonthStr.endsWith('-12') ? 'Liberado no Total' : 'Pago em 10/Dez'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-midnight">
                        R$ {(rpaReceipt?.financial.cashback_anual || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-600/80 mt-1 pl-2 border-l-2 border-indigo-200 font-medium">
                      Período de Apuração: <strong>{rpaReceipt?.financial.annual_cycle_period || '01/12 a 30/11'}</strong> (Acumulado)
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span>Desconto de IRPF na Fonte:</span>
                      {(rpaReceipt?.financial?.deducao_irrf || 0) > 0 ? (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Tabela Progressiva
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Isento na Fonte
                        </span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${(rpaReceipt?.financial?.deducao_irrf || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(rpaReceipt?.financial?.deducao_irrf || 0) > 0
                        ? `- R$ ${(rpaReceipt?.financial?.deducao_irrf || 0).toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00 (Isento na Fonte)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Desconto de INSS na Fonte (11%):</span>
                    <span className={`font-mono font-bold ${(rpaReceipt?.financial?.deducao_inss || 0) > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {(rpaReceipt?.financial?.deducao_inss || 0) > 0
                        ? `- R$ ${(rpaReceipt?.financial?.deducao_inss || 0).toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00 (Isento / PJ)'}
                    </span>
                  </div>

                  {/* (-) Adiantamento de Rendimentos se houver */}
                  {(rpaReceipt?.financial?.adiantamento || 0) > 0 && (
                    <div className="flex justify-between items-center text-slate-600 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      <div>
                        <span className="font-bold text-amber-900 block">(-) Adiantamento de Rendimentos:</span>
                        {rpaReceipt?.financial?.adiantamento_date && (
                          <span className="text-[9px] text-amber-700 font-medium">Pago em {rpaReceipt.financial.adiantamento_date}</span>
                        )}
                      </div>
                      <span className="font-mono font-black text-amber-700">
                        - R$ {(rpaReceipt?.financial?.adiantamento || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center font-black text-midnight text-sm">
                    <span>Total Líquido do Recibo:</span>
                    <span className="font-mono text-emerald-600 text-base">
                      R$ {(rpaReceipt?.financial.liquido_total || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações do RPA */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Status de Quitação
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    rpaReceipt?.status === 'quitado' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : rpaReceipt?.status === 'ciente_previsao'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rpaReceipt?.status === 'quitado' ? 'Quitado & Recebido' :
                     rpaReceipt?.status === 'ciente_previsao' ? 'Ciência Registrada' :
                     'Pendente de Aceite'}
                  </span>
                </div>

                <button
                  onClick={() => setIsRPAModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <FileText size={16} />
                  Visualizar & Assinar RPA
                </button>
              </div>
            </div>

            {/* Card Lateral: Dados do Tomador & Beneficiário */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                  <Building2 size={16} className="text-emerald-600" />
                  <span>Empresa Intermediadora (Tomadora)</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-midnight">{companyData.razaoSocial}</p>
                  <p className="text-slate-500">CNPJ: <span className="font-mono text-midnight font-bold">{companyData.cnpj}</span></p>
                  <p className="text-[11px] text-slate-400">Av. Tancredo Neves, 2539, CEO Salvador Shopping - Salvador/BA</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                  <User size={16} className="text-indigo-600" />
                  <span>Dados do Prestador Autônomo</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-midnight">{profile?.full_name || 'Afiliado'}</p>
                  <p className="text-slate-500">CPF: <span className="font-mono text-midnight font-bold">{profile?.cpf || 'Não informado'}</span></p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      Chave PIX ({profile?.pix_type || 'CPF'})
                    </span>
                    <span className="font-mono font-bold text-midnight text-xs break-all">
                      {profile?.pix_key || 'Chave PIX não cadastrada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Detalhado: Discriminação dos Pedidos Vinculados ao RPA */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-midnight uppercase tracking-tight">
                    Discriminação dos Pedidos Vinculados ao RPA
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detalhamento de cada pedido e comissão contabilizada para compor o valor total deste recibo ({rpaReceipt?.month_label || monthLabel})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {rpaReceipt?.ordersBreakdown?.length || 0} {(rpaReceipt?.ordersBreakdown?.length || 0) === 1 ? 'pedido apurado' : 'pedidos apurados'}
                </span>
                <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-mono font-bold">
                  Total a Receber: R$ {(rpaReceipt?.financial.liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tabela de Pedidos Padrão Financeiro */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-2">ID DO PEDIDO</th>
                    <th className="px-5 py-2">AFILIADO / ORIGEM</th>
                    <th className="px-3 py-2 text-center">NÍVEL</th>
                    <th className="px-4 py-2 text-center">CATEGORIA / PERÍODO</th>
                    <th className="px-4 py-2">DATA</th>
                    <th className="px-5 py-2 text-right">VALOR DO CONTRATO</th>
                    <th className="px-4 py-2 text-center">PERCENTUAL</th>
                    <th className="px-5 py-2 text-right text-emerald-700">VALOR BRUTO CASHBACK</th>
                    <th className="px-4 py-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rpaReceipt?.ordersBreakdown && rpaReceipt.ordersBreakdown.length > 0 ? (
                    rpaReceipt.ordersBreakdown.map((order: any, idx: number) => (
                      <tr
                        key={order.id || idx}
                        className="bg-slate-50/70 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all rounded-2xl text-xs font-medium"
                      >
                        <td className="px-5 py-4 rounded-l-2xl font-black text-midnight font-mono">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-700">
                          {order.affiliateName || order.origin || 'Afiliado'}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {order.level === 'REG' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200/60" title="Revendedor Regional">
                              🏢 REG
                            </span>
                          ) : order.level === '0' || order.level === 'G0' ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-xl text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200" title="Titular da Compra (G0)">
                              🟡 G0
                            </span>
                          ) : order.level === '1' || order.level === 'G1' ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200" title="1º Nível (G1)">
                              🟢 G1
                            </span>
                          ) : order.level === '2' || order.level === 'G2' ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-xl text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200" title="2º Nível (G2)">
                              🔵 G2
                            </span>
                          ) : order.level === '3' || order.level === 'G3' ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-xl text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200" title="3º Nível (G3)">
                              🟣 G3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-xl text-[10px] font-black bg-slate-200 text-slate-600">
                              {order.level || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            (order.category || '').toUpperCase().includes('MENSAL')
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {order.category || 'MENSAL'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 text-[11px]">
                          {order.date}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-600 text-xs">
                          R$ {Number(order.contractAmount || order.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-indigo-600 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                            {order.rate || (order.percentage ? `${Number(order.percentage).toFixed(2)}%` : '5.00%')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-black text-emerald-600">
                          +R$ {Number(order.commissionAmount || order.bruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-center rounded-r-2xl">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            order.status === 'Pago' || order.status === 'completed' || order.status === 'pago' || order.status === 'Concluído'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (rpaReceipt?.financial.adiantamentos_total || 0) >= (rpaReceipt?.financial.bruto_total || 0) && (rpaReceipt?.financial.bruto_total || 0) > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status === 'Pago' || order.status === 'completed' || order.status === 'pago' || order.status === 'Concluído'
                              ? 'Pago'
                              : (rpaReceipt?.financial.adiantamentos_total || 0) >= (rpaReceipt?.financial.bruto_total || 0) && (rpaReceipt?.financial.bruto_total || 0) > 0
                              ? 'Adiantado'
                              : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhum pedido individual detalhado nesta competência.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  {/* Linha 1: Total Bruto Apurado */}
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] border-b border-white/10">
                    <td colSpan={5} className="px-6 py-3 rounded-l-2xl">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="size-2 rounded-full bg-slate-400" />
                        <span>TOTAL BRUTO MENSAL APURADO</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-slate-300">
                      R$ {totalContratosUnicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-indigo-300">
                      {mediaPercentual > 0 ? `${mediaPercentual.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-slate-200 font-bold">
                      R$ {(rpaReceipt?.financial.bruto_total || totalComissaoCalculada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center rounded-r-2xl text-[9px] text-slate-400 font-bold">
                      BRUTO
                    </td>
                  </tr>

                  {/* Linha 2: (-) Adiantamento de Rendimentos se houver */}
                  {(rpaReceipt?.financial.adiantamentos_total || 0) > 0 && (
                    <tr className="bg-amber-950/80 text-amber-300 font-black uppercase tracking-widest text-[10px] border-b border-white/10">
                      <td colSpan={7} className="px-6 py-2.5 rounded-l-2xl">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>(-) ADIANTAMENTO DE RENDIMENTOS (PAGO VIA PIX)</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-sm text-rose-400 font-bold">
                        - R$ {(rpaReceipt?.financial.adiantamentos_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-center rounded-r-2xl text-[9px] text-amber-300 font-bold">
                        ADIANTADO
                      </td>
                    </tr>
                  )}

                  {/* Linha 3: Total Líquido a Receber via PIX */}
                  <tr className="bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]">
                    <td colSpan={7} className="px-6 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${(rpaReceipt?.financial.liquido_total || 0) > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                        <span>
                          {(rpaReceipt?.financial.liquido_total || 0) > 0 
                            ? '(=) SALDO RESTANTE A RECEBER VIA PIX (NO DIA 10)'
                            : '(=) SALDO RESTANTE A RECEBER NO DIA 10 (TOTALMENTE QUITADO VIA ADIANTAMENTO)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-emerald-400 font-black">
                      R$ {(rpaReceipt?.financial.liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-center rounded-r-2xl text-[9px] text-emerald-400 font-bold">
                      {(rpaReceipt?.financial.liquido_total || 0) > 0 ? 'A RECEBER' : 'QUITADO'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Modal Oficial de Recibo RPA */}
          {rpaReceipt && (
            <RPAReceiptModal
              isOpen={isRPAModalOpen}
              mode={rpaReceipt.status === 'quitado' ? 'view' : 'previsao'}
              rpa={rpaReceipt}
              onClose={() => setIsRPAModalOpen(false)}
              onSuccess={() => {
                loadData();
                setIsRPAModalOpen(false);
              }}
            />
          )}

          {/* Modal de Solicitação de Adiantamento Mensal */}
          {isAdvanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white"
              >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">
                        Solicitar Adiantamento Mensal
                      </h3>
                      <p className="text-xs text-slate-400">
                        Competência: {rpaReceipt?.month_label || monthLabel}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAdvanceModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <AlertCircle size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleRequestAdvance} className="p-6 space-y-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        Saldo Líquido Disponível (Pós-IRPF):
                      </span>
                      <span className="text-[10px] font-bold text-amber-400/80 uppercase">
                        Limite Máximo
                      </span>
                    </div>
                    <span className="text-2xl font-mono font-black text-amber-200 block">
                      R$ {(rpaReceipt?.financial?.liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-[11px] text-amber-200/80">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Bruto Apurado:</span>
                        <span className="font-mono font-bold text-white">
                          R$ {(rpaReceipt?.financial?.bruto_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">(-) IRPF na Fonte:</span>
                        <span className="font-mono font-bold text-rose-300">
                          - R$ {(rpaReceipt?.financial?.deducao_irrf || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-200/70 mt-1">
                      O adiantamento é sempre pelo valor integral do saldo líquido disponível. O valor será transferido para sua chave PIX <strong>no dia útil seguinte</strong> e abatido na liquidação do dia 10.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Valor Integral a Antecipar:
                      </label>
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                        100% do Saldo Líquido
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        R$
                      </span>
                      <input 
                        type="text"
                        readOnly
                        value={advanceAmountInput}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-amber-500/40 rounded-2xl text-amber-300 font-mono font-black text-xl cursor-not-allowed select-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      🔒 <strong>Regra de Antecipação Integral:</strong> O adiantamento é sempre pelo valor total líquido disponível naquele momento. Não são permitidos valores picados.
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Chave PIX Cadastrada para Recebimento:
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 block truncate">
                      {profile?.pix_key || 'Chave PIX não cadastrada no perfil'}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Tipo: {profile?.pix_type || 'CPF'} • Titular: {profile?.full_name || 'Afiliado'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Observações / Justificativa (Opcional):
                    </label>
                    <textarea 
                      rows={2}
                      value={advanceNotesInput}
                      onChange={(e) => setAdvanceNotesInput(e.target.value)}
                      placeholder="Ex: Solicitação de antecipação referente às vendas da 1ª quinzena."
                      className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAdvanceModalOpen(false)}
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAdvance}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {submittingAdvance ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                      Confirmar Solicitação
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout 
      title="Emissão e Envio de Nota Fiscal (PJ)" 
    >
      <div className="space-y-8 max-w-6xl mx-auto pb-16">

        {/* Banner Informativo de Regra de Pagamento */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                Regra Oficial de Fechamento & Pagamento PJ
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Período de apuração dos rendimentos: <strong>01 a 30 de cada mês</strong>. A nota fiscal deve ser emitida no <strong>valor exato a receber</strong> e enviada impreterivelmente <strong>até o dia 05 do mês subsequente</strong> para conferência e liberação no <strong>dia 10</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white px-4 py-2 rounded-xl border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-700 shadow-sm">
            Prazo limite: Até dia 05 do mês subsequente
          </div>
        </div>

        {/* Barra de Filtro de Mês / Competência da NF */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-midnight uppercase tracking-wider">
                  Competência Fiscal PJ
                </h4>
                {isDefaultCompetence && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Mês Atual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Navegue entre os meses com as setas para filtrar o faturamento apurado e notas fiscais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
            {!isDefaultCompetence && (
              <button
                onClick={handleResetToCurrent}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Mês Atual
              </button>
            )}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-midnight hover:bg-white transition-all shadow-sm cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 py-1 font-black text-xs text-midnight uppercase tracking-wider min-w-[140px] text-center font-mono">
                {summary?.monthLabel || monthLabel}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-midnight hover:bg-white transition-all shadow-sm cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Card de Adiantamento / Solicitação de Saque PJ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-midnight uppercase tracking-tight">
                  Adiantamento / Solicitação de Saque PJ
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  1 por mês
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Clock size={11} /> Recebimento no Dia Útil Seguinte
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Você pode solicitar até 1 adiantamento por competência do seu faturamento acumulado via PIX, com <strong>pagamento no dia útil seguinte</strong>.
              </p>
              {advanceRequests && advanceRequests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {advanceRequests.map((adv: any) => (
                    <div key={adv.id} className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-mono font-bold text-slate-700">
                        R$ {Number(adv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        adv.status === 'paid' || adv.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : adv.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {adv.status === 'paid' || adv.status === 'completed' ? 'Pago via PIX' : adv.status === 'pending' ? 'Em Análise' : 'Recusado'}
                      </span>
                      {adv.receipt_url && (
                        <a href={adv.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold underline">
                          Comprovante
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end">
            {(!advanceRequests || !advanceRequests.some((a: any) => a.status === 'pending' || a.status === 'paid' || a.status === 'completed')) ? (
              <button
                onClick={() => {
                  const maxNet = summary?.totalGross || summary?.monthlyGross || 0;
                  setAdvanceAmountInput(maxNet > 0 ? maxNet.toFixed(2).replace('.', ',') : '');
                  setIsAdvanceModalOpen(true);
                }}
                disabled={(summary?.totalGross || summary?.monthlyGross || 0) <= 0}
                className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
              >
                <DollarSign size={16} />
                Solicitar Adiantamento PJ
              </button>
            ) : (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-xl border border-amber-300">
                {advanceRequests.some((a: any) => a.status === 'paid' || a.status === 'completed') ? 'Adiantamento Concedido' : 'Solicitação em Análise'}
              </span>
            )}
          </div>
        </div>

        {/* Grid Superior: Valores para Emissão + Dados da Tomadora */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card de Valores Apurados no Mês */}
          <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Competência: {summary?.monthLabel || 'Mês Atual'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Rendimentos Acumulados
                </span>
              </div>

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Valor Total Bruto Obrigatório da NF
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-midnight tracking-tighter mb-4">
                R$ {loading ? '...' : (summary?.totalGross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>

              <p className="text-xs text-slate-500 font-medium mb-6">
                Este é o valor exato que deve constar no campo <strong>Valor dos Serviços</strong> na sua Nota Fiscal. O sistema fará a conferência automática deste valor.
              </p>

              {/* Discriminação Mensal */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Cashback Mensal Bruto:</span>
                  <span className="font-mono font-bold text-midnight">
                    R$ {(summary?.monthlyGross || summary?.totalGross || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-midnight">
                  <span>Valor Exato da Nota a Emitir:</span>
                  <span className="font-mono text-indigo-600">
                    R$ {(summary?.totalGross || summary?.monthlyGross || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status atual da NF enviada */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Status da NF do Mês:
              </span>
              {summary?.currentInvoice ? (
                summary.currentInvoice.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Aprovada & Paga
                  </span>
                ) : summary.currentInvoice.status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Valor Conferido / Em Análise
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                    <Clock size={12} /> Enviada / Em Conferência
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">
                  <AlertCircle size={12} /> Pendente de Envio
                </span>
              )}
            </div>
          </div>

          {/* Card de Dados da Tomadora (Serviços Urbanos) com Botão Copiar */}
          <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Dados do Tomador
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Preenchimento na Nota
                </span>
              </div>

              <h3 className="text-lg font-black text-midnight uppercase tracking-tight mb-2">
                Dados Oficiais da Empresa Tomadora
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Utilize exatamente os dados abaixo no campo de Tomador/Cliente da sua Nota Fiscal:
              </p>

              <div className="space-y-4">
                {/* Razão Social */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Razão Social</span>
                    <span className="text-xs font-bold text-midnight">{companyData.razaoSocial}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCopy(companyData.razaoSocial, 'Razão Social')}
                    className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    title="Copiar Razão Social"
                  >
                    {copiedField === 'Razão Social' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* CNPJ */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CNPJ da Empresa</span>
                    <span className="text-xs font-mono font-bold text-midnight">{companyData.cnpj}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCopy(companyData.cnpj, 'CNPJ')}
                    className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    title="Copiar CNPJ"
                  >
                    {copiedField === 'CNPJ' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Descrição Sugerida */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Descrição do Serviço</span>
                    <span className="text-xs text-slate-600 leading-relaxed font-medium block">
                      {companyData.descricaoServico}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCopy(companyData.descricaoServico, 'Descrição do Serviço')}
                    className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0 mt-1"
                    title="Copiar Descrição"
                  >
                    {copiedField === 'Descrição do Serviço' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Seletor Rápido: Onde emitir (MEI Nacional vs Nota Avulsa Municipal) */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Selecione o seu perfil de emissão:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTaxpayerType('pf')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    taxpayerType === 'pf'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User size={13} /> Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => setTaxpayerType('pj')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    taxpayerType === 'pj'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building size={13} /> MEI / PJ (Nacional)
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Bloco de Roteamento do Portal de Emissão: Cidade vs MEI Nacional */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                {taxpayerType === 'pj' ? <Building size={20} /> : <MapPin size={20} />}
              </div>
              <div>
                <h3 className="text-base font-black text-midnight uppercase tracking-tight">
                  {taxpayerType === 'pj' 
                    ? 'Emissão Nacional para MEI (Receita Federal)' 
                    : `Emissão de Nota Avulsa: ${fiscalPortal.cityName} - ${fiscalPortal.state || 'BA'}`}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {taxpayerType === 'pj'
                    ? 'Todo MEI do Brasil emite pelo Portal Nacional unificado da NFS-e.'
                    : 'Pessoas físicas emitem a Nota Fiscal Avulsa pelo sistema municipal do seu domicílio.'}
                </p>
              </div>
            </div>

            {/* Botão de Alterar Cidade (apenas para Pessoa Física) */}
            {taxpayerType === 'pf' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCity(!isEditingCity)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  {isEditingCity ? 'Cancelar' : 'Alterar Cidade'}
                </button>
              </div>
            )}
          </div>

          {/* Formulário de alteração de cidade se solicitado */}
          {taxpayerType === 'pf' && isEditingCity && (
            <form onSubmit={handleSaveCustomCity} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Sua Cidade Fiscal
                </label>
                <input
                  type="text"
                  placeholder="Ex: Salvador, Feira de Santana, São Paulo..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="w-24">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  UF
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="BA"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-midnight uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Confirmar Cidade
                </button>
              </div>
            </form>
          )}

          {/* Links de Acesso aos Portais Oficiais */}
          {taxpayerType === 'pj' ? (
            /* Card MEI Nacional */
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1 max-w-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  Padrão Obrigatório Nacional
                </span>
                <h4 className="text-base font-black text-white uppercase tracking-tight mt-2">
                  Portal Nacional de Emissão de NFS-e do MEI
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {NATIONAL_MEI_PORTAL.description} Acesse com sua conta Gov.br (nível Prata ou Ouro) e emita informando o CNPJ da Serviços Urbanos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a
                  href={NATIONAL_MEI_PORTAL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <ExternalLink size={14} />
                  Acessar Emissor Nacional Gov.br
                </a>
              </div>
            </div>
          ) : (
            /* Card Pessoa Física (Municipal) */
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1 max-w-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {fiscalPortal.portalName}
                </span>
                <h4 className="text-base font-black text-midnight uppercase tracking-tight mt-2">
                  {fiscalPortal.cityName} - {fiscalPortal.state || 'BA'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {fiscalPortal.instructions}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Botão Direto da Nota Avulsa */}
                {fiscalPortal.directAvulsaUrl && (
                  <a
                    href={fiscalPortal.directAvulsaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    {normalizeCity(fiscalPortal.cityName) === 'salvador' 
                      ? 'Acessar Sistema Nota Avulsa Salvador' 
                      : 'Emitir Nota Avulsa Municipal'}
                  </a>
                )}
                {/* Link Secundário do Portal da Cidade */}
                {fiscalPortal.portalUrl && fiscalPortal.portalUrl !== fiscalPortal.directAvulsaUrl && (
                  <a
                    href={fiscalPortal.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    Portal Sefaz
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Guia Rápido de 4 Passos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="size-6 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mb-2">1</span>
              <h5 className="font-black text-midnight uppercase text-[10px] mb-1">Acesse o Portal</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {taxpayerType === 'pj' 
                  ? 'Acesse o Emissor Nacional Gov.br com seu login Gov.br.' 
                  : `Acesse o sistema de Nota Avulsa de ${fiscalPortal.cityName}.`}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="size-6 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mb-2">2</span>
              <h5 className="font-black text-midnight uppercase text-[10px] mb-1">Preencha o Tomador</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Copie o CNPJ da Serviços Urbanos Tecnologia acima e cole no campo Tomador.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="size-6 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mb-2">3</span>
              <h5 className="font-black text-midnight uppercase text-[10px] mb-1">Valor Exato da Nota</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Informe o valor exato apurado: <strong>R$ {(summary?.totalGross || 0).toFixed(2).replace('.', ',')}</strong>.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="size-6 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mb-2">4</span>
              <h5 className="font-black text-midnight uppercase text-[10px] mb-1">Baixe e Envie o PDF</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Baixe o arquivo PDF oficial emitido e faça o upload no formulário de auditoria abaixo.
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de Envio com Auditoria e Validação de Valores */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                Enviar Nota Fiscal para Conferência Automática
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                O sistema confere se o valor do PDF anexado corresponde exatamente ao seu saldo liberado para pagamento.
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo 1: Valor Declarado da Nota (com validação em tempo real) */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-indigo-600" />
                  Valor da Nota Fiscal Emitida (R$) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Valor exigido no mês: <strong className="text-midnight font-mono">R$ {expectedTotal.toFixed(2).replace('.', ',')}</strong>
                </span>
              </div>
              <input
                type="text"
                placeholder="Ex: 20,00"
                value={declaredAmount}
                onChange={(e) => setDeclaredAmount(e.target.value)}
                className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-base font-mono font-bold text-midnight focus:outline-none focus:ring-2 ${
                  isDeclaredValueMatching 
                    ? 'border-emerald-300 focus:ring-emerald-500/20' 
                    : 'border-rose-300 focus:ring-rose-500/20'
                }`}
              />
              {!isDeclaredValueMatching && declaredNumeric > 0 && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold pt-1">
                  <AlertCircle size={14} />
                  <span>
                    Divergência: O valor digitado (R$ {declaredNumeric.toFixed(2).replace('.', ',')}) é diferente do valor apurado (R$ {expectedTotal.toFixed(2).replace('.', ',')}).
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opção Link Direto */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Link da Nota Fiscal da Prefeitura (Opcional)
                </label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={invoiceLink}
                    onChange={(e) => setInvoiceLink(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Link de autenticidade ou consulta da nota, caso fornecido pelo portal.
                </p>
              </div>

              {/* Número da NF */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Número da Nota Fiscal (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 000123"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400">
                  Facilita a identificação rápida pelo setor financeiro da empresa.
                </p>
              </div>
            </div>

            {/* Opção Upload do Arquivo com Leitor e Auditor Automático */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Upload do Arquivo Oficial da Nota (PDF Recomendado) <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500/40 rounded-3xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="invoice-file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="invoice-file" className="cursor-pointer block">
                  <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    {isAuditing ? <Loader2 size={22} className="animate-spin text-indigo-600" /> : <Upload size={22} />}
                  </div>

                  {isAuditing ? (
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                        Auditando arquivo PDF em tempo real...
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Conferindo valores fiscais e CNPJ tomador</p>
                    </div>
                  ) : invoiceFile ? (
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                        Arquivo selecionado: {invoiceFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Clique para trocar de arquivo</p>
                    </div>
                  ) : summary?.currentInvoice?.file_url ? (
                    <div>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                        Arquivo já enviado anteriormente
                      </p>
                      <a 
                        href={summary.currentInvoice.file_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] text-indigo-600 underline font-bold inline-block mt-1"
                      >
                        Visualizar arquivo atual
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Clique aqui para selecionar o arquivo PDF da nota
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Formatos aceitos: PDF (vetorial recomendado), PNG, JPG (máx. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Banner de Feedback da Auditoria Automática do PDF */}
            {auditResult && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                auditResult.isValid 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}>
                <div className="shrink-0 mt-0.5">
                  {auditResult.isValid ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-rose-600" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-black uppercase tracking-wider text-[10px]">
                    {auditResult.isValid ? 'Resultado da Auditoria: Conforme' : 'Resultado da Auditoria: Inconformidade Detectada'}
                  </p>
                  <p className="leading-relaxed font-medium">
                    {auditResult.message}
                  </p>
                  {auditResult.extractedAmount !== null && (
                    <p className="text-[11px] font-mono font-bold">
                      Valor extraído do documento: R$ {auditResult.extractedAmount.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botão de Envio com Bloqueio de Segurança */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center sm:text-left">
                Ao enviar, sua nota será validada pela auditoria contábil da Serviços Urbanos.
              </p>
              <button
                type="submit"
                disabled={submitting || isAuditing || (auditResult !== null && !auditResult.isValid) || !isDeclaredValueMatching}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {summary?.currentInvoice ? 'Atualizar Nota Fiscal' : 'Enviar Nota Fiscal'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal de Solicitação de Adiantamento PJ */}
        {isAdvanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Solicitar Adiantamento / Saque PJ
                    </h3>
                    <p className="text-xs text-slate-400">
                      Competência: {summary?.monthLabel || monthLabel}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleRequestAdvance} className="p-6 space-y-5">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                      Saldo Disponível Acumulado (PJ):
                    </span>
                    <span className="text-[10px] font-bold text-amber-400/80 uppercase">
                      Isenção de Retenção
                    </span>
                  </div>
                  <span className="text-2xl font-mono font-black text-amber-200 block">
                    R$ {(summary?.totalGross || summary?.monthlyGross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-[10px] text-amber-200/70 mt-1">
                    Como Pessoa Jurídica (PJ/MEI), não há retenções na fonte de INSS ou IRPF. O adiantamento será transferido via PIX para a conta da sua empresa e abatido na apuração do dia 10.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Valor Integral a Antecipar:
                    </label>
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                      100% do Saldo Disponível
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      R$
                    </span>
                    <input 
                      type="text"
                      readOnly
                      value={advanceAmountInput}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-amber-500/40 rounded-2xl text-amber-300 font-mono font-black text-xl cursor-not-allowed select-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    🔒 <strong>Regra de Antecipação Integral:</strong> O adiantamento é sempre pelo valor total disponível da empresa naquele momento. Não são permitidos valores picados.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Chave PIX Cadastrada da Empresa:
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 block truncate">
                    {profile?.pix_key || 'Chave PIX não cadastrada no perfil'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Tipo: {profile?.pix_type || 'CNPJ'} • Empresa: {profile?.company_name || profile?.full_name || 'Afiliado PJ'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Observações / Justificativa (Opcional):
                  </label>
                  <textarea 
                    rows={2}
                    value={advanceNotesInput}
                    onChange={(e) => setAdvanceNotesInput(e.target.value)}
                    placeholder="Ex: Solicitação de antecipação referente às vendas da 1ª quinzena."
                    className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdvanceModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdvance}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAdvance ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                    Confirmar Solicitação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </AffiliateLayout>
  );
}
