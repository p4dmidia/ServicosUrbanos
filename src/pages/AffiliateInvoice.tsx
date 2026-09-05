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
  HelpCircle,
  Link as LinkIcon,
  Check,
  MapPin,
  Building,
  User,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { getFiscalPortalForCity, NATIONAL_MEI_PORTAL, normalizeCity } from '../lib/fiscalPortals';
import { auditInvoicePdf, parseBrazilianCurrency, InvoiceAuditResult } from '../lib/pdfInvoiceParser';
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

  const companyData = {
    razaoSocial: 'Serviços Urbanos Tecnologia Ltda.',
    cnpj: '54.795.377/0001-03',
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

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Erro ao carregar dados da nota fiscal:', error);
      toast.error('Erro ao carregar resumo de faturamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

  return (
    <AffiliateLayout 
      title="Emissão e Envio de Nota Fiscal" 
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
                Regra Oficial de Fechamento & Pagamento
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

              {/* Discriminação Semanal + Mensal */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Cashback Semanal Bruto (CD):</span>
                  <span className="font-mono font-bold text-midnight">
                    R$ {(summary?.weeklyGross || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Cashback Mensal Bruto:</span>
                  <span className="font-mono font-bold text-midnight">
                    R$ {(summary?.monthlyGross || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-midnight">
                  <span>Soma Total Exata da Nota:</span>
                  <span className="font-mono text-indigo-600">
                    R$ {(summary?.totalGross || 0).toFixed(2).replace('.', ',')}
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
