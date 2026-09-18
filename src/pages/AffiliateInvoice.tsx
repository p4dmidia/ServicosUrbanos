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

  // Navegação e Filtro por Mês da Competência do RPA
  const defaultClosedDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
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

  // Inicializa a cidade e o tipo tributário com base no perfil do afiliado
  useEffect(() => {
    if (profile) {
      const city = profile.city || 'Salvador';
      const state = profile.state || 'BA';
      setSelectedCity(city);
      setSelectedState(state);
      setCityInput(city);
      setStateInput(state);

      if (profile.cnpj || (profile.cpf && profile.cpf.replace(/\D/g, '').length === 14)) {
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
      const isPJUser = Boolean(profile?.cnpj && profile.cnpj.replace(/\D/g, '').length > 11);

      if (isPJUser) {
        const res = await businessRules.getAffiliateInvoiceSummary(user.id);
        setSummary(res);
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
        // Pessoa Física: Carrega Recibo RPA para o mês selecionado
        const [currentRpa, rpasList] = await Promise.all([
          businessRules.generateMonthlyRPAReceipt(user.id, activeRefMonth),
          businessRules.getAffiliateRPAReceipts(user.id)
        ]);

        setRpaReceipt(currentRpa);
        setAllUserRpas(rpasList || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados fiscais:', error);
      toast.error('Erro ao carregar resumo contábil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(refMonthStr);
  }, [user, profile, refMonthStr]);

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
                  Como empresa de intermediação de negócios, a plataforma transfere <strong>100% dos seus repasses sem retenções na fonte de INSS (0%)</strong>. O recolhimento de suas contribuições previdenciárias é individual por conta própria.
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
                  <div className="text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Comissões de Rede MMN:</span>
                      <span className="font-mono font-bold text-midnight">
                        R$ {(rpaReceipt?.financial.rede_mmn || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {/* Detalhamento de Níveis G1, G2, G3 */}
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500 font-medium pl-2 border-l-2 border-slate-200">
                      <span>Nível G1: <strong className="font-mono text-slate-700">R$ {(rpaReceipt?.financial.rede_g1 || 0).toFixed(2).replace('.', ',')}</strong></span>
                      <span>•</span>
                      <span>Nível G2: <strong className="font-mono text-slate-700">R$ {(rpaReceipt?.financial.rede_g2 || 0).toFixed(2).replace('.', ',')}</strong></span>
                      <span>•</span>
                      <span>Nível G3: <strong className="font-mono text-slate-700">R$ {(rpaReceipt?.financial.rede_g3 || 0).toFixed(2).replace('.', ',')}</strong></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Vendas Diretas / Polo:</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.vendas_revendedor || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Cashback Mensal (5% - G0 Titular):</span>
                    <span className="font-mono font-bold text-midnight">
                      R$ {(rpaReceipt?.financial.cashback_mensal || 0).toFixed(2).replace('.', ',')}
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
                    <span>Desconto de INSS na Fonte (0%):</span>
                    <span className="font-mono font-bold text-emerald-600">
                      R$ 0,00 (Isento na Fonte)
                    </span>
                  </div>
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

            {/* Tabela de Pedidos */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Nº do Pedido</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Origem / Regra</th>
                    <th className="py-3 px-4 text-right">Valor do Pedido</th>
                    <th className="py-3 px-4 text-center">Alíquota (%)</th>
                    <th className="py-3 px-4 text-right">Valor Creditado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rpaReceipt?.ordersBreakdown && rpaReceipt.ordersBreakdown.length > 0 ? (
                    rpaReceipt.ordersBreakdown.map((order, idx) => (
                      <tr key={order.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-midnight">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {order.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                            {order.origin}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                          R$ {order.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-600">
                          <span className="bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {order.rate}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                          R$ {order.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} />
                            {order.status || 'Apurado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhum pedido individual detalhado nesta competência.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-black text-midnight bg-slate-50/50">
                    <td colSpan={3} className="py-4 px-4 uppercase text-[11px] tracking-wider text-slate-500">
                      Totalizador dos Pedidos do Recibo
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700">
                      R$ {(rpaReceipt?.ordersBreakdown?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">
                      —
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 text-sm">
                      R$ {(rpaReceipt?.ordersBreakdown?.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0) || rpaReceipt?.financial.liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center text-[10px] uppercase font-bold text-emerald-700">
                      100% Repasse
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

      </div>
    </AffiliateLayout>
  );
}
