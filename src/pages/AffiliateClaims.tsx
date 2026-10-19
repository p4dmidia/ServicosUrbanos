import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  UploadCloud, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Calendar, 
  Download, 
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export default function AffiliateClaims() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seguradoData, setSeguradoData] = useState<any>(null);
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);
  const [sinistros, setSinistros] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State
  const [tipoSinistro, setTipoSinistro] = useState<'morte_acidental' | 'invalidez_permanente_total' | 'invalidez_permanente_parcial'>('morte_acidental');
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [documentos, setDocumentos] = useState<Array<{ tipo_documento: string; arquivo_url: string; nome_arquivo: string }>>([]);
  const [currentDocType, setCurrentDocType] = useState('laudo_medico');

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [segRes, mfRes] = await Promise.all([
        businessRules.getSeguradoData(user.id),
        businessRules.getMicrofranqueadoData(user.id)
      ]);
      setSeguradoData(segRes);
      setMicrofranqueadoData(mfRes);

      if (segRes?.segurado?.id) {
        const claims = await businessRules.getSinistros(segRes.segurado.id);
        setSinistros(claims);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de sinistros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      setDocumentos(prev => [
        ...prev,
        {
          tipo_documento: currentDocType,
          arquivo_url: base64Url,
          nome_arquivo: file.name
        }
      ]);
      toast.success(`Documento "${file.name}" anexado!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeDoc = (index: number) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seguradoData?.segurado?.id || !seguradoData?.apolice?.id) {
      toast.error('Apólice não localizada para envio do sinistro.');
      return;
    }

    if (!dataOcorrencia) {
      toast.error('Informe a data da ocorrência.');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Descreva os fatos da ocorrência.');
      return;
    }

    if (documentos.length === 0) {
      toast.error('Anexe pelo menos 1 documento comprobatório.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await businessRules.abrirSinistro({
        segurado_id: seguradoData.segurado.id,
        apolice_id: seguradoData.apolice.id,
        tipo_sinistro: tipoSinistro,
        data_ocorrencia: dataOcorrencia,
        descricao,
        documentos
      });

      if (res.success) {
        toast.success('Aviso de sinistro registrado com sucesso!');
        setShowNewModal(false);
        setDataOcorrencia('');
        setDescricao('');
        setDocumentos([]);
        await loadData();
      } else {
        toast.error(res.error || 'Erro ao registrar sinistro.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSegurado = seguradoData?.isSegurado;
  const isMicrofranqueado = microfranqueadoData?.isMicrofranqueado;
  const apolice = seguradoData?.apolice;

  const docTypeLabels: Record<string, string> = {
    certidao_obito: 'Certidão de Óbito',
    laudo_medico: 'Laudo Médico / Pericial',
    boletim_ocorrencia: 'Boletim de Ocorrência (B.O.)',
    documento_identificacao: 'Documento de Identificação (RG/CNH)',
    comprovante_residencia: 'Comprovante de Residência',
    declaracao_herdeiros: 'Declaração de Herdeiros / Alvará',
    outro: 'Outro Documento Comprobatório'
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'aberto':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">Aberto</span>;
      case 'em_analise':
        return <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">Em Análise Técnica</span>;
      case 'documentos_pendentes':
        return <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider">Doc. Pendente</span>;
      case 'aprovado':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">Aprovado</span>;
      case 'indenizado':
        return <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">Indenizado R$ 5.000</span>;
      case 'rejeitado':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider">Rejeitado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const tipoSinistroLabel = (tipo: string) => {
    switch (tipo) {
      case 'morte_acidental':
        return 'Morte Acidental (MA)';
      case 'invalidez_permanente_total':
        return 'Invalidez Permanente Total por Acidente (IPTA)';
      case 'invalidez_permanente_parcial':
        return 'Invalidez Permanente Parcial por Acidente (IPPA)';
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <AffiliateLayout title="Sinistros">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Sinistros e Indenizações">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10 space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-11 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <ShieldAlert size={24} />
              </div>
              Aviso de Sinistros & Indenização
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-1">
              Seguro de Vida Light & Acidentes Pessoais R$ 5.000,00 – Parceria MBM Seguradora
            </p>
          </div>

          {isSegurado && (
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-midnight hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-midnight/10 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              Abrir Novo Sinistro
            </button>
          )}
        </div>

        {/* Alerta para Microfranqueado sem apólice ativa */}
        {isMicrofranqueado && !isSegurado && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-amber-500 text-midnight flex items-center justify-center shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-amber-950 uppercase text-sm">
                  Benefício Exclusivo do Afiliado Premium (Seguro Vida Light)
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed max-w-2xl font-medium">
                  Sua conta atual é de <strong>Microfranqueado (MMN)</strong>, focada na expansão da rede e recebimento de comissões (33% no split 80% semanal / 20% anual). A cobertura securitária de R$ 5.000,00, assistência médica e sorteios são exclusivos dos titulares do plano Seguro Vida Light.
                </p>
              </div>
            </div>
            <Link
              to="/afiliado/renovacoes"
              className="bg-amber-500 hover:bg-amber-400 text-midnight font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest shrink-0 transition-all shadow-md flex items-center gap-2"
            >
              Contratar Seguro R$ 5,00/mês
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Card Informativo com Resumo da Apólice Atual */}
        {isSegurado && apolice && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Apólice Seguradora
              </span>
              <p className="font-mono text-sm font-black text-midnight">
                {apolice.numero_apolice}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">MBM Seguradora S/A</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Certificado Individual
              </span>
              <p className="font-mono text-sm font-black text-primary-blue">
                #{apolice.numero_certificado}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Cobertura Vigente</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Capital Segurado (LMI)
              </span>
              <p className="font-mono text-base font-black text-emerald-600">
                R$ 5.000,00
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Morte e Acidentes</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Prazo Médio SUSEP
              </span>
              <p className="text-sm font-black text-midnight flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-600" />
                Até 30 dias úteis
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Após envio de todos os laudos</p>
            </div>
          </div>
        )}

        {/* Lista de Sinistros Registrados */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-midnight tracking-tight uppercase italic flex items-center gap-2">
            <FileText size={20} className="text-primary-blue" />
            Meus Avisos de Sinistro Registrados
          </h2>

          {sinistros.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-10 text-center space-y-4 shadow-sm">
              <div className="size-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-midnight text-base uppercase">Nenhum sinistro em andamento</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  Não consta nenhum registro de sinistro aberto para o seu CPF. Em caso de ocorrência coberta pela apólice MBM, utilize o botão acima para comunicar o evento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sinistros.map((sin) => {
                const isExpanded = expandedId === sin.id;
                return (
                  <div 
                    key={sin.id}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all"
                  >
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : sin.id)}
                      className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-slate-400">
                            Protocolo #{sin.id.substring(0, 8).toUpperCase()}
                          </span>
                          {statusBadge(sin.status)}
                        </div>
                        <h4 className="font-black text-midnight text-sm uppercase">
                          {tipoSinistroLabel(sin.tipo_sinistro)}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <Calendar size={13} />
                          Ocorrência: {new Date(sin.data_ocorrencia).toLocaleDateString('pt-BR')} • Abertura: {new Date(sin.data_abertura).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Indenização Solicitada
                          </span>
                          <span className="font-mono font-black text-emerald-600 text-base">
                            R$ {Number(sin.valor_solicitado || 5000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-100 p-6 bg-slate-50/50 space-y-6"
                        >
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              Relato dos Fatos / Descrição
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
                              {sin.descricao}
                            </p>
                          </div>

                          {sin.observacoes_analise && (
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-1">
                              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                                Parecer da Seguradora / Reguladora
                              </span>
                              <p className="text-xs text-indigo-950 font-medium">
                                {sin.observacoes_analise}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                              Documentos Anexados ({sin.documentos?.length || 0})
                            </span>
                            
                            {(!sin.documentos || sin.documentos.length === 0) ? (
                              <p className="text-xs text-slate-400 italic">Nenhum documento anexado.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {sin.documentos.map((doc: any) => (
                                  <div key={doc.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                      <FileCheck size={16} className="text-emerald-600 shrink-0" />
                                      <div className="truncate">
                                        <p className="font-bold text-slate-800 truncate">{doc.nome_arquivo}</p>
                                        <p className="text-[10px] text-slate-400">{docTypeLabels[doc.tipo_documento] || doc.tipo_documento}</p>
                                      </div>
                                    </div>
                                    <a 
                                      href={doc.arquivo_url} 
                                      download={doc.nome_arquivo} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0"
                                    >
                                      <Download size={14} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informações Oficiais e Suporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-primary-blue">
              <div className="size-10 rounded-2xl bg-primary-blue/10 flex items-center justify-center font-black">
                <HelpCircle size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Documentação Básica Exigida pela SUSEP
              </h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside font-medium leading-relaxed">
              <li><strong>Morte Acidental:</strong> Certidão de óbito, B.O. policial, laudo necroscópico do IML, documentos dos herdeiros e do segurado.</li>
              <li><strong>Invalidez Permanente:</strong> Laudo médico pericial conclusivo com indicação de alta médica definitiva e percentual de limitação funcional segundo a tabela da SUSEP.</li>
              <li><strong>Prazo Legal:</strong> Liquidação em até 30 dias após protocolo integral dos documentos exigidos.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black">
                <PhoneCall size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Canais de Atendimento e Sinistros MBM
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Caso precise de apoio no preenchimento ou queira consultar o andamento diretamente com a seguradora:
            </p>
            <div className="space-y-2 text-xs font-mono">
              <p className="text-slate-800">
                <strong>MBM Sinistros 0800:</strong> 0800 541 2555
              </p>
              <p className="text-slate-800">
                <strong>E-mail Estipulante:</strong> sinistro@cazadossorteios.com.br
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Atendimento de segunda a sexta-feira, das 09h às 18h.
              </p>
            </div>
          </div>
        </div>

        {/* Modal / Formulário de Novo Sinistro */}
        <AnimatePresence>
          {showNewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 sm:p-10 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-midnight uppercase italic tracking-tight">
                      Aviso de Sinistro Digital
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preencha os dados e anexe os laudos para análise da MBM Seguradora
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                      Tipo de Cobertura / Sinistro
                    </label>
                    <select
                      value={tipoSinistro}
                      onChange={(e: any) => setTipoSinistro(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-primary-blue"
                    >
                      <option value="morte_acidental">Morte Acidental (LMI R$ 5.000,00)</option>
                      <option value="invalidez_permanente_total">Invalidez Permanente Total por Acidente (LMI R$ 5.000,00)</option>
                      <option value="invalidez_permanente_parcial">Invalidez Permanente Parcial por Acidente (Até R$ 5.000,00 conforme tabela)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                      Data da Ocorrência / Acidente
                    </label>
                    <input
                      type="date"
                      required
                      value={dataOcorrencia}
                      onChange={(e) => setDataOcorrencia(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-primary-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                      Descrição Detalhada do Acidente
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva o que ocorreu, local, circunstâncias do acidente e consequências..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-primary-blue leading-relaxed"
                    />
                  </div>

                  {/* Upload de Arquivos */}
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Anexar Documentos Comprobatórios (Laudos, B.O., Identificação)
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={currentDocType}
                        onChange={(e) => setCurrentDocType(e.target.value)}
                        className="sm:col-span-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                      >
                        <option value="laudo_medico">Laudo Médico</option>
                        <option value="certidao_obito">Certidão de Óbito</option>
                        <option value="boletim_ocorrencia">Boletim de Ocorrência (B.O.)</option>
                        <option value="documento_identificacao">RG / CNH</option>
                        <option value="comprovante_residencia">Comprovante Residência</option>
                        <option value="declaracao_herdeiros">Declaração Herdeiros</option>
                        <option value="outro">Outro Documento</option>
                      </select>

                      <label className="sm:col-span-2 cursor-pointer border-2 border-dashed border-slate-300 hover:border-primary-blue rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-black text-slate-600 bg-slate-50/50 hover:bg-primary-blue/5 transition-all">
                        <UploadCloud size={16} className="text-primary-blue" />
                        <span>Selecionar Arquivo (PDF, Imagem até 8MB)</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Lista de anexos do formulário */}
                    {documentos.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {documentos.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileCheck size={14} className="text-emerald-600 shrink-0" />
                              <span className="font-bold text-slate-800 truncate">{doc.nome_arquivo}</span>
                              <span className="text-[10px] text-slate-400">({docTypeLabels[doc.tipo_documento]})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDoc(idx)}
                              className="text-rose-500 hover:text-rose-700 font-black text-xs px-2 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Enviando...' : 'Protocolar Sinistro'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AffiliateLayout>
  );
}
