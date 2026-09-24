import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Ticket, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Download, 
  Eye, 
  Users, 
  Clock, 
  Sparkles, 
  Check, 
  X,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Filter
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { 
  extractMBMCertificatesFromPdf, 
  MBMCertificateItem, 
  sanitizeCpf, 
  formatCpf 
} from '../lib/mbmPdfParser';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  cnpj?: string;
  role: string;
  status: string;
  description?: string;
  lucky_number?: string;
  certificate_number?: string;
  policy_number?: string;
  created_at?: string;
}

export default function AdminMBMLuckyNumbers() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [extractedCertificates, setExtractedCertificates] = useState<MBMCertificateItem[]>([]);
  
  // Upload & parsing state
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ current: 0, total: 0 });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Selection & Saving
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'import' | 'affiliates_list' | 'history'>('import');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'pj_matched' | 'not_found'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega todos os perfis do banco
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar afiliados:', err);
      toast.error('Erro ao carregar lista de afiliados do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Mapas para busca rápida
  const { cpfToProfileMap, nameToProfileMap } = useMemo(() => {
    const cpfMap = new Map<string, ProfileData>();
    const nameMap = new Map<string, ProfileData>();

    profiles.forEach(p => {
      // 1. Mapeia por CPF direto
      if (p.cpf) {
        const clean = sanitizeCpf(p.cpf);
        if (clean) cpfMap.set(clean, p);
      }

      // 2. Mapeia por CPF contido na descrição (empresas PJ com titular segurado)
      if (p.description) {
        const cpfMatch = p.description.match(/CPF Segurado:\s*([0-9.\-]+)/i);
        if (cpfMatch && cpfMatch[1]) {
          const cleanPjCpf = sanitizeCpf(cpfMatch[1]);
          if (cleanPjCpf) cpfMap.set(cleanPjCpf, p);
        }
      }

      // 3. Mapeia por nome normalizado
      if (p.full_name) {
        const norm = p.full_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        nameMap.set(norm, p);
      }
    });

    return { cpfToProfileMap: cpfMap, nameToProfileMap: nameMap };
  }, [profiles]);

  // Função para processar e associar certificados extraídos com os perfis do banco
  const matchCertificatesWithProfiles = (items: MBMCertificateItem[]) => {
    const updated = items.map(cert => {
      const cleanCpf = sanitizeCpf(cert.cpf);
      let matched = cpfToProfileMap.get(cleanCpf);

      // Fallback: busca por nome caso CPF falhe
      if (!matched && cert.fullName) {
        const normName = cert.fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        matched = nameToProfileMap.get(normName);
      }

      if (matched) {
        const isPj = !!matched.cnpj || !!matched.description?.includes('[PJ]');
        return {
          ...cert,
          cleanCpf,
          matchedProfileId: matched.id,
          matchedProfileName: matched.full_name,
          matchedProfileEmail: matched.email,
          matchedProfileRole: matched.role,
          status: isPj ? ('pj_matched' as const) : ('matched' as const)
        };
      }

      return {
        ...cert,
        cleanCpf,
        status: 'not_found' as const
      };
    });

    setExtractedCertificates(updated);

    // Seleciona automaticamente todos os matched e pj_matched
    const validIndices = new Set<number>();
    updated.forEach((item, index) => {
      if (item.status === 'matched' || item.status === 'pj_matched') {
        validIndices.add(index);
      }
    });
    setSelectedIndices(validIndices);
  };

  // Handler de Upload do PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Por favor, selecione um arquivo no formato PDF (.pdf).');
      return;
    }

    setUploadedFileName(file.name);
    setIsParsing(true);
    setParseProgress({ current: 0, total: 0 });

    try {
      const toastId = toast.loading('Processando arquivo PDF da MBM Seguradora...');
      const items = await extractMBMCertificatesFromPdf(file, (current, total) => {
        setParseProgress({ current, total });
      });

      toast.dismiss(toastId);

      if (items.length === 0) {
        toast.error('Nenhum certificado reconhecido no PDF selecionado.');
        return;
      }

      matchCertificatesWithProfiles(items);
      toast.success(`${items.length} páginas/certificados extraídos com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      toast.error('Falha ao processar PDF: ' + (err.message || 'Verifique o arquivo'));
    } finally {
      setIsParsing(false);
    }
  };

  // Toggle de seleção
  const handleToggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const handleSelectAllValid = () => {
    const next = new Set<number>();
    filteredExtractedCertificates.forEach((item) => {
      const origIndex = extractedCertificates.indexOf(item);
      if (item.status === 'matched' || item.status === 'pj_matched') {
        next.add(origIndex);
      }
    });
    setSelectedIndices(next);
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  // Edição manual de número da sorte na tabela de pré-visualização
  const handleUpdateLuckyNumberManual = (index: number, newLucky: string) => {
    const updated = [...extractedCertificates];
    updated[index] = { ...updated[index], luckyNumber: newLucky.trim() };
    setExtractedCertificates(updated);
  };

  // Salvar / Aplicar números da sorte no banco de dados e perfis
  const handleSaveAndSync = async () => {
    if (selectedIndices.size === 0) {
      toast.error('Selecione ao menos um certificado para aplicar.');
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Vinculando ${selectedIndices.size} Números da Sorte aos afiliados...`);

    try {
      for (const index of Array.from(selectedIndices)) {
        const item = extractedCertificates[index];
        if (!item || !item.matchedProfileId || !item.luckyNumber) continue;

        const userId = item.matchedProfileId;

        // 1. Atualiza colunas diretas em profiles (com fallback caso colunas específicas não existam)
        try {
          await supabase
            .from('profiles')
            .update({
              lucky_number: item.luckyNumber,
              certificate_number: item.certificateNumber,
              policy_number: item.policyNumber,
            })
            .eq('id', userId);
        } catch (colErr) {
          console.warn('Atualização direta em colunas profiles em fallback:', colErr);
        }

        // 2. Persistência de alta resiliência na coluna description com tags oficiais
        try {
          const { data: p } = await supabase.from('profiles').select('description').eq('id', userId).single();
          let desc = p?.description || '';
          
          // Remove tags anteriores
          desc = desc.replace(/\[MBM_LUCKY_NUMBER:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_CERTIFICATE:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_POLICY:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_VALIDITY:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_SYNCED_AT:[^\]]*\]/g, '');

          // Anexa novas tags
          const tags = `[MBM_LUCKY_NUMBER:${item.luckyNumber}] [MBM_CERTIFICATE:${item.certificateNumber}] [MBM_POLICY:${item.policyNumber}] [MBM_VALIDITY:${item.validityStart || '31/08/2026'}-${item.validityEnd || '31/08/2027'}] [MBM_SYNCED_AT:${new Date().toISOString()}]`;
          desc = `${desc.trim()} ${tags}`.trim();

          await supabase.from('profiles').update({ description: desc }).eq('id', userId);
          successCount++;
        } catch (descErr) {
          console.error(`Erro ao salvar tags no perfil ${userId}:`, descErr);
          failCount++;
        }
      }

      toast.dismiss(toastId);

      if (successCount > 0) {
        toast.success(`🎉 ${successCount} Números da Sorte vinculados com sucesso ao Escritório Virtual!`);
        // Recarrega perfis
        await fetchProfiles();
      }

      if (failCount > 0) {
        toast.error(`${failCount} certificados falharam ao vincular.`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Erro ao sincronizar certificados:', err);
      toast.error('Erro na sincronização: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Exportar lista do Dia 20 para envio à MBM (CSV / Excel)
  const handleExportMBMList = () => {
    // Filtra afiliados ativos para envio à seguradora
    const activeAffiliates = profiles.filter(p => p.status === 'active' || p.role === 'affiliate' || p.role === 'regional_reseller');
    
    if (activeAffiliates.length === 0) {
      toast.error('Nenhum afiliado ativo encontrado para exportação.');
      return;
    }

    const headers = ['Nome Completo', 'CPF', 'Email', 'Cargo', 'Empresa / CNPJ', 'Nº da Sorte Atual', 'Status'];
    const rows = activeAffiliates.map(p => {
      // Extrai CPF real (ou de titular se for PJ)
      let cpf = p.cpf || '';
      if (!cpf && p.description?.includes('CPF Segurado:')) {
        const match = p.description.match(/CPF Segurado:\s*([0-9.\-]+)/i);
        if (match) cpf = match[1];
      }

      // Extrai número da sorte atual
      let lucky = p.lucky_number || '';
      if (!lucky && p.description?.includes('[MBM_LUCKY_NUMBER:')) {
        const match = p.description.match(/\[MBM_LUCKY_NUMBER:([^\]]+)\]/);
        if (match) lucky = match[1];
      }

      return [
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        `"${formatCpf(cpf)}"`,
        `"${p.email || ''}"`,
        `"${p.role}"`,
        `"${p.cnpj || p.store_name || ''}"`,
        `"${lucky}"`,
        `"${p.status}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `remessa_segurados_mbm_dia_20_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Lista de segurados para a MBM baixada com sucesso!');
  };

  // Filtragem dos certificados extraídos
  const filteredExtractedCertificates = useMemo(() => {
    return extractedCertificates.filter(item => {
      // Filtro de status
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Filtro de texto
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesName = item.fullName.toLowerCase().includes(q);
        const matchesCpf = item.cleanCpf.includes(q) || item.cpf.includes(q);
        const matchesLucky = item.luckyNumber.includes(q);
        const matchesMatchedName = item.matchedProfileName?.toLowerCase().includes(q);
        return matchesName || matchesCpf || matchesLucky || matchesMatchedName;
      }
      return true;
    });
  }, [extractedCertificates, statusFilter, searchFilter]);

  // Estatísticas gerais dos afiliados
  const stats = useMemo(() => {
    const total = profiles.length;
    let withLucky = 0;
    let pendingLucky = 0;

    profiles.forEach(p => {
      const lucky = p.lucky_number || p.description?.match(/\[MBM_LUCKY_NUMBER:([^\]]+)\]/)?.[1];
      if (lucky) withLucky++;
      else pendingLucky++;
    });

    return { total, withLucky, pendingLucky };
  }, [profiles]);

  return (
    <AdminLayout 
      title="Sorteios & Certificados MBM" 
      subtitle="Importação de apólices, extração de Números da Sorte e integração com Escritório Virtual"
    >
      <div className="p-8 lg:p-12 space-y-10">

        {/* Header com Ações Rápidas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles size={12} />
              Regra Oficial: Fechamento MBM Dia 20
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <div className="size-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
                <Ticket size={24} />
              </div>
              Importador de Números da Sorte MBM
            </h1>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Faça upload do PDF de certificados recebido da MBM Seguradora para vincular os números automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportMBMList}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-2.5 transition-all shadow-md"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              Exportar Lista Dia 20 (Para MBM)
            </button>

            <button
              onClick={fetchProfiles}
              className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl border border-white/10 transition-all"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid de Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#0a0e17] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total de Afiliados</p>
                <p className="text-3xl font-black text-white font-mono">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                <Users size={22} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={13} className="text-indigo-400" />
              Base total cadastrada no ecossistema
            </p>
          </div>

          <div className="bg-[#0a0e17] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Com Número da Sorte Ativo</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">{stats.withLucky}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <Ticket size={22} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-emerald-400" />
              Concorrendo aos sorteios semanais de R$ 5k
            </p>
          </div>

          <div className="bg-[#0a0e17] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Aguardando Emissão MBM</p>
                <p className="text-3xl font-black text-amber-400 font-mono">{stats.pendingLucky}</p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Clock size={22} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5 font-medium">
              <AlertTriangle size={13} className="text-amber-400" />
              Aguardando envio do dia 20 ou retorno do PDF
            </p>
          </div>
        </div>

        {/* Zona de Upload e Leitura de PDF MBM */}
        <div className="bg-gradient-to-br from-[#0c1222] to-[#0a0e17] border border-indigo-500/20 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            <div className="size-16 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                Importar Apólices e Certificados da MBM (.PDF)
              </h2>
              <p className="text-slate-400 text-xs max-w-xl mx-auto mt-2 leading-relaxed">
                Envie o arquivo PDF com as páginas dos certificados individuais. O sistema extrairá automaticamente o <strong>Nome</strong>, <strong>CPF</strong>, <strong>Nº do Certificado</strong> e <strong>Nº da Sorte</strong> de cada afiliado.
              </p>
            </div>

            {/* Input escondido */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Botão de seleção */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-3 disabled:opacity-50 group cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Lendo Páginas do PDF ({parseProgress.current} / {parseProgress.total})...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    Selecionar Arquivo PDF da MBM
                  </>
                )}
              </button>

              {uploadedFileName && (
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-300 font-mono">
                  <FileText size={15} className="text-indigo-400" />
                  <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                </div>
              )}
            </div>

            {/* Barra de Progresso de Leitura */}
            {isParsing && parseProgress.total > 0 && (
              <div className="space-y-2 max-w-md mx-auto pt-4">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                  <span>Processando páginas...</span>
                  <span>{Math.round((parseProgress.current / parseProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(parseProgress.current / parseProgress.total) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Tabela de Pré-visualização e Conferência dos Certificados */}
        {extractedCertificates.length > 0 && (
          <div className="space-y-6">
            
            {/* Header da Tabela */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0e17] border border-white/5 p-6 rounded-3xl">
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2.5">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  Certificados Extraídos ({extractedCertificates.length} páginas)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confira o cruzamento de CPF com o banco de dados antes de confirmar a gravação.
                </p>
              </div>

              {/* Botão de Aplicação em Lote */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllValid}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/10"
                >
                  Selecionar Todos Válidos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all border border-white/10"
                >
                  Desmarcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  disabled={isSaving || selectedIndices.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Gravando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Vincular {selectedIndices.size} Selecionados ao Painel
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Tabs de Status */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0a0e17] border border-white/5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Todos ({extractedCertificates.length})
                </button>
                <button
                  onClick={() => setStatusFilter('matched')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    statusFilter === 'matched' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span className="size-2 rounded-full bg-emerald-400"></span>
                  Identificados ({extractedCertificates.filter(c => c.status === 'matched').length})
                </button>
                <button
                  onClick={() => setStatusFilter('pj_matched')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    statusFilter === 'pj_matched' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span className="size-2 rounded-full bg-purple-400"></span>
                  Titular PJ ({extractedCertificates.filter(c => c.status === 'pj_matched').length})
                </button>
                <button
                  onClick={() => setStatusFilter('not_found')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    statusFilter === 'not_found' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span className="size-2 rounded-full bg-amber-400"></span>
                  Não Encontrados ({extractedCertificates.filter(c => c.status === 'not_found').length})
                </button>
              </div>

              {/* Busca Textual */}
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por Nome, CPF ou Nº da Sorte..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

            </div>

            {/* Tabela de Registros */}
            <div className="bg-[#0a0e17] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="p-5 w-12 text-center">Sel.</th>
                      <th className="p-5">Pág.</th>
                      <th className="p-5">Segurado no PDF</th>
                      <th className="p-5">CPF Extraído</th>
                      <th className="p-5">Nº da Sorte MBM</th>
                      <th className="p-5">Certificado</th>
                      <th className="p-5">Correspondência no Sistema</th>
                      <th className="p-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredExtractedCertificates.map((item, idx) => {
                      const origIndex = extractedCertificates.indexOf(item);
                      const isSelected = selectedIndices.has(origIndex);

                      return (
                        <tr 
                          key={origIndex}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isSelected ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(origIndex)}
                              disabled={item.status === 'not_found' || !item.luckyNumber}
                              className="size-4 rounded accent-indigo-600 bg-white/5 border-white/20 cursor-pointer disabled:opacity-30"
                            />
                          </td>

                          {/* Página */}
                          <td className="p-5 font-mono text-slate-400">
                            #{item.pageNumber}
                          </td>

                          {/* Segurado no PDF */}
                          <td className="p-5">
                            <p className="font-bold text-white uppercase tracking-tight">{item.fullName || '---'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {item.birthDate ? `Nasc: ${item.birthDate}` : ''} {item.matricula ? `• Matr: ${item.matricula}` : ''}
                            </p>
                          </td>

                          {/* CPF */}
                          <td className="p-5 font-mono font-medium text-slate-300">
                            {formatCpf(item.cpf)}
                          </td>

                          {/* Número da Sorte Extraído */}
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-mono font-black text-sm tracking-widest">
                                {item.luckyNumber || 'NÃO IDENTIFICADO'}
                              </span>
                            </div>
                          </td>

                          {/* Certificado e Apólice */}
                          <td className="p-5">
                            <p className="font-mono font-bold text-slate-200">Cert: #{item.certificateNumber || '---'}</p>
                            <p className="text-[10px] font-mono text-slate-500">Apólice: {item.policyNumber}</p>
                          </td>

                          {/* Correspondência no Sistema */}
                          <td className="p-5">
                            {item.matchedProfileName ? (
                              <div>
                                <p className="font-bold text-emerald-400">{item.matchedProfileName}</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">{item.matchedProfileEmail}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Nenhum usuário com este CPF</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-5">
                            {item.status === 'matched' && (
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <Check size={11} /> Pronto
                              </span>
                            )}
                            {item.status === 'pj_matched' && (
                              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <Sparkles size={11} /> Titular PJ
                              </span>
                            )}
                            {item.status === 'not_found' && (
                              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <AlertTriangle size={11} /> Não Localizado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
