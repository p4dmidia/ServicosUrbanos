import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
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

  const companyData = {
    razaoSocial: 'Serviços Urbanos Tecnologia Ltda.',
    cnpj: '54.795.377/0001-03',
    descricaoServico: 'Intermediação de negócios, agenciamento e divulgação de planos de benefícios e serviços urbanos.'
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await businessRules.getAffiliateInvoiceSummary(user.id);
      setSummary(res);
      if (res.currentInvoice) {
        setInvoiceLink(res.currentInvoice.invoice_link || '');
        setInvoiceNumber(res.currentInvoice.invoice_number || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !summary) return;

    if (!invoiceLink.trim() && !invoiceFile) {
      toast.error('Por favor, informe o link da Nota Fiscal ou faça upload do PDF/arquivo.');
      return;
    }

    try {
      setSubmitting(true);
      await businessRules.submitAffiliateInvoice({
        profile_id: user.id,
        reference_month: summary.referenceMonth,
        amount_gross: summary.totalGross,
        invoice_number: invoiceNumber,
        invoice_link: invoiceLink.trim() || undefined,
        file: invoiceFile || undefined
      });

      toast.success('Nota Fiscal enviada com sucesso para análise!');
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
      subtitle="Envie sua nota fiscal de serviços para liberação tempestiva do repasse mensal no dia 10."
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
                Período de apuração dos rendimentos: <strong>01 a 30 de cada mês</strong>. A nota fiscal deve ser enviada impreterivelmente <strong>até o dia 05 do mês subsequente</strong> para envio à contabilidade e liberação do seu pagamento no <strong>dia 10</strong>.
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
                Valor Total Bruto a Emitir na NF
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-midnight tracking-tighter mb-4">
                R$ {loading ? '...' : (summary?.totalGross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>

              <p className="text-xs text-slate-500 font-medium mb-6">
                Este é o valor exato que deve constar no campo <strong>Valor dos Serviços</strong> na sua Nota Fiscal Avulsa.
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
                  <span>Soma Total da Nota:</span>
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
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                    <Clock size={12} /> Enviada / Em Análise
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
                  Preenchimento na Prefeitura
                </span>
              </div>

              <h3 className="text-lg font-black text-midnight uppercase tracking-tight mb-2">
                Dados Oficiais da Empresa
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Utilize exatamente os dados abaixo ao preencher o campo do tomador no portal da sua Prefeitura:
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
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Descrição Sugerida do Serviço</span>
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

            <div className="mt-6 pt-4 border-t border-slate-100">
              <a 
                href="https://notasalvador.salvador.ba.gov.br/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-midnight text-white hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <ExternalLink size={14} />
                Acessar Portal Nota Salvador
              </a>
            </div>
          </div>

        </div>

        {/* Guia Passo a Passo Nota Avulsa (Prefeitura de Salvador) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              💡
            </div>
            <div>
              <h3 className="text-base font-black text-midnight uppercase tracking-tight">
                Como emitir a Nota Fiscal Avulsa (Pessoa Física)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Passo a passo rápido para emissão municipal (Sefaz Salvador / Nota Salvador).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Passo 1 */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="size-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3">1</span>
                <h4 className="font-black text-midnight uppercase text-[11px] mb-1">Acesse e faça Login</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Acesse a página de <strong>Nota Avulsa de Salvador</strong> com seu CPF e senha da SenhaWeb. Se não tiver, crie na hora.
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="size-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3">2</span>
                <h4 className="font-black text-midnight uppercase text-[11px] mb-1">Preencha o Tomador</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Informe o CNPJ da <strong>Serviços Urbanos Tecnologia</strong> e cole a descrição recomendada do serviço.
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="size-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3">3</span>
                <h4 className="font-black text-midnight uppercase text-[11px] mb-1">Pague o DAM (ISS)</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  O sistema gerará a guia de pagamento referente ao ISS (5%) do serviço avulso. Pague pelo seu banco ou PIX.
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="size-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3">4</span>
                <h4 className="font-black text-midnight uppercase text-[11px] mb-1">Pegue o Link ou PDF</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Após compensação, a nota é liberada no sistema. Copie o link direto da nota ou baixe o PDF e envie no formulário abaixo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Envio da Nota Fiscal */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-midnight uppercase tracking-tight">
                Enviar Nota Fiscal para Conferência
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Cole o link gerado pela Prefeitura ou faça upload do PDF/imagem da nota.
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opção 1: Link da Nota Fiscal da Prefeitura */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Link Direto da Nota (Recomendado)
                </label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://nfse.salvador.ba.gov.br/notaavulsa/..."
                    value={invoiceLink}
                    onChange={(e) => setInvoiceLink(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-midnight placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Cole o link que a prefeitura fornece para consulta e impressão direta da nota.
                </p>
              </div>

              {/* Número da NF (Opcional) */}
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
                  Facilita a identificação rápida pelo setor financeiro.
                </p>
              </div>

            </div>

            {/* Opção 2: Upload de Arquivo (PDF ou Imagem) */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                OU Faça Upload do Arquivo (PDF ou Imagem)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500/40 rounded-3xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="invoice-file"
                  accept=".pdf,image/*"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="invoice-file" className="cursor-pointer block">
                  <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Upload size={22} />
                  </div>
                  {invoiceFile ? (
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
                      <p className="text-[10px] text-slate-400 mt-1">Formatos aceitos: PDF, PNG, JPG (máx. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>Enviando...</>
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
