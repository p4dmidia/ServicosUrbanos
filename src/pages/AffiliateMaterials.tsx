import { useState, useEffect, useMemo } from 'react';
import { 
  FolderDown, 
  Search, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  MessageSquare, 
  Cloud, 
  Sparkles, 
  Eye, 
  X, 
  Send, 
  Loader2, 
  FolderOpen, 
  ArrowRight, 
  ChevronRight,
  FileSpreadsheet,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getNormalizedCategory } from './AdminMaterials';

export interface MarketingMaterial {
  id: string;
  title: string;
  description?: string;
  category: 'imagens' | 'videos' | 'pdfs' | 'docs' | 'planilhas' | 'apresentacoes' | 'copys' | 'drive' | string;
  type: 'image' | 'video' | 'pdf' | 'doc' | 'spreadsheet' | 'presentation' | 'link' | 'text' | string;
  file_url?: string;
  thumbnail_url?: string;
  copy_text?: string;
  external_link?: string;
  file_size?: string;
  badge?: string;
  order_index?: number;
  status: 'Ativo' | 'Inativo';
  created_at?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas as Pastas', icon: FolderOpen, desc: 'Todo o acervo de materiais' },
  { id: 'imagens', label: 'Imagens', icon: ImageIcon, desc: 'Artes, banners e posts para redes sociais' },
  { id: 'videos', label: 'Vídeos', icon: Video, desc: 'Vídeos institucionais, reels e chamadas' },
  { id: 'pdfs', label: 'PDFs', icon: FileText, desc: 'Apresentações, guias e documentos em PDF' },
  { id: 'docs', label: 'Docs', icon: FileText, desc: 'Textos e documentos editáveis (Word/TXT)' },
  { id: 'planilhas', label: 'Planilhas', icon: FileSpreadsheet, desc: 'Tabelas e planilhas de controle (Excel/CSV)' },
  { id: 'apresentacoes', label: 'Apresentações (PPTX)', icon: Sliders, desc: 'Slides em PowerPoint (PPTX)' },
];

export default function AffiliateMaterials() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MarketingMaterial | null>(null);

  // Link de indicação do afiliado autenticado
  const affiliateRef = profile?.referral_code || profile?.id || '';
  const affiliateLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/cadastro?ref=${affiliateRef}`
    : `https://cazadossorteios.com.br/cadastro?ref=${affiliateRef}`;

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_materials')
        .select('*')
        .eq('status', 'Ativo')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Erro ao carregar marketing_materials do banco:', error);
        setMaterials([]);
      } else {
        setMaterials(data || []);
      }
    } catch (err) {
      console.error('Erro na requisição de materiais:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Processa o texto da copy substituindo placeholders pelo link e nome do afiliado
  const formatCopyText = (rawText?: string) => {
    if (!rawText) return '';
    return rawText
      .replace(/{link_afiliado}/g, affiliateLink)
      .replace(/{nome_afiliado}/g, profile?.full_name || 'Afiliado')
      .replace(/{codigo_afiliado}/g, affiliateRef);
  };

  const handleCopyText = (id: string, text?: string) => {
    const processed = formatCopyText(text);
    if (!processed) return;
    navigator.clipboard.writeText(processed);
    setCopiedId(id);
    toast.success('Texto copiado com o seu link de afiliado!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (text?: string) => {
    const processed = formatCopyText(text);
    if (!processed) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(processed)}`;
    window.open(url, '_blank');
  };

  const handleShareNative = async (item: MarketingMaterial) => {
    const processedText = formatCopyText(item.copy_text || item.description || item.title);
    const targetUrl = item.file_url || item.external_link || affiliateLink;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: processedText,
          url: targetUrl
        });
        toast.success('Compartilhado com sucesso!');
      } catch (e) {
        // Cancelado pelo usuário
      }
    } else {
      navigator.clipboard.writeText(`${processedText}\n\n${targetUrl}`);
      toast.success('Link e informações copiados!');
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
      const matchCategory = activeCategory === 'all' || normCat === activeCategory || item.category === activeCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        item.title.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.copy_text && item.copy_text.toLowerCase().includes(searchLower));
      return matchCategory && matchSearch;
    });
  }, [materials, activeCategory, searchTerm]);

  // Contagem por categoria normalizada
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: materials.length };
    materials.forEach(m => {
      const normCat = getNormalizedCategory(m.category, m.type, m.file_url || m.thumbnail_url);
      map[normCat] = (map[normCat] || 0) + 1;
    });
    return map;
  }, [materials]);

  // Materiais do Google Drive para o Card Master
  const driveItems = useMemo(() => {
    return materials.filter(m => {
      const normCat = getNormalizedCategory(m.category, m.type, m.file_url || m.thumbnail_url);
      return normCat === 'drive' || m.type === 'link';
    });
  }, [materials]);

  return (
    <AffiliateLayout title="Materiais de Divulgação">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Hero Card com Link de Indicação Rápido e Acesso ao Drive */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-[#0a0e17] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={14} className="text-amber-400" />
                <span>Mídia Kit & Criativos Oficiais</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight italic">
                Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Materiais & Vendas</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Baixe posts, stories, vídeos e copie textos persuasivos de WhatsApp com o seu link de afiliado inserido automaticamente.
              </p>
            </div>

            {/* Link de Afiliado Box */}
            <div className="w-full lg:w-auto shrink-0 bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Seu Link de Indicação Ativo
              </span>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={affiliateLink}
                  className="bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 select-all w-full sm:w-72 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(affiliateLink);
                    toast.success('Link de indicação copiado!');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                  title="Copiar Link"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Destaque Drive Master se existir */}
          {driveItems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{driveItems[0].title}</h4>
                  <p className="text-[11px] text-slate-400">{driveItems[0].description || 'Artes em alta definição e arquivos em lote'}</p>
                </div>
              </div>
              <a 
                href={driveItems[0].external_link || driveItems[0].file_url || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <span>Acessar Pasta no Google Drive</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Barra de Pesquisa e Filtros de Subpastas */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Campo de Pesquisa */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por título, copy ou tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
              />
            </div>

            {/* Contador de Materiais */}
            <div className="text-xs font-bold text-slate-500 self-end md:self-center">
              Mostrando <strong className="text-midnight">{filteredMaterials.length}</strong> de {materials.length} materiais
            </div>
          </div>

          {/* Subpastas em Formato de Abas / Pastas Visuais */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = counts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                    isActive
                      ? 'bg-midnight text-white border-midnight shadow-lg shadow-midnight/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-midnight'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Materiais */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 size={36} className="animate-spin text-primary-blue" />
            <p className="text-xs font-black uppercase tracking-widest">Carregando acervo de criativos...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center space-y-4">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FolderDown size={32} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-midnight">Nenhum material encontrado</h3>
              <p className="text-xs text-slate-500">
                Não encontramos nenhum item correspondente aos filtros selecionados. Tente buscar por outro termo ou limpe a pesquisa.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchTerm('');
              }}
              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Ver Todos os Materiais
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((item) => (
              <MaterialCard 
                key={item.id} 
                item={item} 
                onCopy={handleCopyText} 
                copiedId={copiedId}
                onShareWhatsApp={handleShareWhatsApp}
                onShareNative={handleShareNative}
                onPreview={() => setPreviewItem(item)}
                formatCopyText={formatCopyText}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Pré-visualização Detalhada */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal 
            item={previewItem} 
            onClose={() => setPreviewItem(null)} 
            onCopy={handleCopyText}
            copiedId={copiedId}
            onShareWhatsApp={handleShareWhatsApp}
            onShareNative={handleShareNative}
            formatCopyText={formatCopyText}
          />
        )}
      </AnimatePresence>
    </AffiliateLayout>
  );
}

// Subcomponente: Card de Material Individual
interface MaterialCardProps {
  key?: string;
  item: MarketingMaterial;
  onCopy: (id: string, text?: string) => void;
  copiedId: string | null;
  onShareWhatsApp: (text?: string) => void;
  onShareNative: (item: MarketingMaterial) => void;
  onPreview: () => void;
  formatCopyText: (text?: string) => string;
}

function MaterialCard({ 
  item, 
  onCopy, 
  copiedId, 
  onShareWhatsApp, 
  onShareNative, 
  onPreview,
  formatCopyText 
}: MaterialCardProps) {
  const [imgError, setImgError] = useState(false);

  const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
  const url = item.file_url || item.thumbnail_url || '';

  const isDoc = normCat === 'docs';
  const isPdf = normCat === 'pdfs';
  const isVideo = normCat === 'videos';
  const isSpreadsheet = normCat === 'planilhas';
  const isPresentation = normCat === 'apresentacoes';
  const isCopy = normCat === 'copys' || (!url && Boolean(item.copy_text));
  const isDrive = normCat === 'drive' || (!url && Boolean(item.external_link));
  const isImage = normCat === 'imagens' || (!isDoc && !isPdf && !isVideo && !isSpreadsheet && !isPresentation && !isCopy && !isDrive);

  const processedCopy = formatCopyText(item.copy_text);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {/* Imagem de Capa / Preview Header */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
        {isImage && !imgError && url && (url.startsWith('http') || url.startsWith('data:image/') || url.startsWith('/')) ? (
          <img 
            src={url} 
            alt={item.title} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white space-y-2 relative overflow-hidden">
            {isCopy ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
                <MessageSquare size={36} className="text-emerald-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Copy WhatsApp</span>
              </div>
            ) : isPdf ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-950 to-slate-900">
                <FileText size={36} className="text-rose-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Documento PDF</span>
              </div>
            ) : isDoc ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-slate-900">
                <FileText size={36} className="text-blue-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Documento (Doc)</span>
              </div>
            ) : isSpreadsheet ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
                <FileSpreadsheet size={36} className="text-emerald-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Planilha (Excel / CSV)</span>
              </div>
            ) : isPresentation ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 to-slate-900">
                <Sliders size={36} className="text-amber-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Apresentação (PPTX)</span>
              </div>
            ) : isDrive ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 to-slate-900">
                <Cloud size={36} className="text-amber-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Google Drive / Nuvem</span>
              </div>
            ) : isVideo ? (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 to-slate-900">
                <Video size={36} className="text-purple-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Vídeo / Reels</span>
              </div>
            ) : (
              <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 to-slate-900">
                <ImageIcon size={36} className="text-sky-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">Material Gráfico</span>
              </div>
            )}
          </div>
        )}

        {/* Badge Flutuante */}
        {item.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">
            {item.badge}
          </span>
        )}

        {/* Categoria Tag */}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/90 backdrop-blur-md text-slate-800 uppercase tracking-wider">
          {normCat}
        </span>

        {/* Botão de Preview Rápido */}
        <button
          onClick={onPreview}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs backdrop-blur-[2px] cursor-pointer"
        >
          <Eye size={18} />
          <span>Visualizar</span>
        </button>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-midnight group-hover:text-primary-blue transition-colors line-clamp-1">
              {item.title}
            </h3>
            {item.file_size && (
              <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                {item.file_size}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Preview da Copy (se for texto) */}
          {isCopy && processedCopy && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-700 font-mono line-clamp-3 relative">
              {processedCopy}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          {isCopy ? (
            <>
              <button
                onClick={() => onCopy(item.id, item.copy_text)}
                className="flex-1 flex items-center justify-center gap-2 bg-midnight hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onShareWhatsApp(item.copy_text)}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm cursor-pointer"
                title="Enviar no WhatsApp"
              >
                <Send size={15} />
              </button>
            </>
          ) : isDrive || item.external_link ? (
            <a
              href={item.external_link || item.file_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Abrir na Nuvem</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <>
              <a
                href={item.file_url || '#'}
                target="_blank"
                rel="noreferrer"
                download
                className="flex-1 flex items-center justify-center gap-2 bg-midnight hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download size={14} />
                <span>
                  Baixar {isPdf ? 'PDF' : isSpreadsheet ? 'Planilha' : isPresentation ? 'Slides' : isDoc ? 'Doc' : isVideo ? 'Vídeo' : 'Arte'}
                </span>
              </a>

              <button
                onClick={() => onShareNative(item)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Compartilhar"
              >
                <Share2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Modal de Pré-visualização
interface PreviewModalProps {
  item: MarketingMaterial;
  onClose: () => void;
  onCopy: (id: string, text?: string) => void;
  copiedId: string | null;
  onShareWhatsApp: (text?: string) => void;
  onShareNative: (item: MarketingMaterial) => void;
  formatCopyText: (text?: string) => string;
}

function PreviewModal({
  item,
  onClose,
  onCopy,
  copiedId,
  onShareWhatsApp,
  onShareNative,
  formatCopyText
}: PreviewModalProps) {
  const [imgError, setImgError] = useState(false);

  const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
  const url = item.file_url || item.thumbnail_url || '';

  const isDoc = normCat === 'docs';
  const isPdf = normCat === 'pdfs';
  const isVideo = normCat === 'videos';
  const isSpreadsheet = normCat === 'planilhas';
  const isPresentation = normCat === 'apresentacoes';
  const isCopy = normCat === 'copys' || (!url && Boolean(item.copy_text));
  const isDrive = normCat === 'drive' || (!url && Boolean(item.external_link));
  const isImage = normCat === 'imagens' || (!isDoc && !isPdf && !isVideo && !isSpreadsheet && !isPresentation && !isCopy && !isDrive);

  const processedCopy = formatCopyText(item.copy_text);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 relative"
      >
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-primary-blue uppercase tracking-widest">
              {normCat.toUpperCase()} • {item.type?.toUpperCase()}
            </span>
            <h2 className="text-lg font-bold text-midnight line-clamp-1">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-midnight transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* 1. VÍDEOS */}
          {isVideo && url ? (
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-200">
              <video 
                src={url} 
                controls 
                autoPlay
                className="w-full max-h-[65vh] mx-auto"
                poster={item.thumbnail_url}
              >
                Seu navegador não suporta reprodução direta de vídeo.
              </video>
            </div>
          ) : /* 2. PDFS (VISUALIZADOR DIRETO NA TELA) */
          isPdf && url ? (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 h-[62vh] shadow-inner relative">
                <iframe 
                  src={url.startsWith('data:') ? url : `${url}#toolbar=1&navpanes=0`} 
                  title={item.title}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Visualizador de PDF integrado</span>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary-blue hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Abrir em aba cheia</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ) : /* 3. PLANILHAS */
          isSpreadsheet ? (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 text-center space-y-3">
              <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <FileSpreadsheet size={32} />
              </div>
              <h3 className="font-bold text-midnight text-base">{item.title}</h3>
              <p className="text-xs text-slate-500">Arquivo de Planilha (Excel / CSV / ODS)</p>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : /* 4. APRESENTAÇÕES (PPTX) */
          isPresentation ? (
            <div className="p-8 rounded-3xl bg-amber-50 border border-amber-100 text-center space-y-3">
              <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Sliders size={32} />
              </div>
              <h3 className="font-bold text-midnight text-base">{item.title}</h3>
              <p className="text-xs text-slate-500">Apresentação de Slides (PowerPoint PPTX / ODP)</p>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : /* 5. DOCS */
          isDoc ? (
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 text-center space-y-3">
              <div className="size-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-midnight text-base">{item.title}</h3>
              <p className="text-xs text-slate-500">Documento de Texto (Word DOCX / TXT)</p>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : /* 6. DRIVE / NUVEM */
          isDrive ? (
            <div className="p-8 rounded-3xl bg-amber-50 border border-amber-100 text-center space-y-3">
              <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Cloud size={32} />
              </div>
              <h3 className="font-bold text-midnight text-base">{item.title}</h3>
              <p className="text-xs text-slate-500">Pasta / Arquivo armazenado no Google Drive / Nuvem</p>
            </div>
          ) : /* 7. IMAGENS */
          isImage && !imgError && url && (url.startsWith('http') || url.startsWith('data:image/') || url.startsWith('/')) ? (
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
              <img 
                src={url} 
                alt={item.title} 
                onError={() => setImgError(true)}
                className="w-full max-h-[65vh] object-contain mx-auto"
              />
            </div>
          ) : null}

          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* 8. COPYS / TEXTOS WHATSAPP */}
          {isCopy && processedCopy && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-midnight uppercase tracking-wider block">
                Texto Pronto com seu Link de Afiliado:
              </span>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {processedCopy}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal com Botões */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          {isCopy ? (
            <>
              <button
                onClick={() => onShareWhatsApp(item.copy_text)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Send size={15} />
                <span>Enviar no WhatsApp</span>
              </button>

              <button
                onClick={() => onCopy(item.id, item.copy_text)}
                className="flex items-center gap-2 bg-midnight hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {copiedId === item.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedId === item.id ? 'Copiado!' : 'Copiar Texto Completo'}</span>
              </button>
            </>
          ) : item.external_link ? (
            <a
              href={item.external_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Acessar Link Externo</span>
              <ExternalLink size={16} />
            </a>
          ) : (
            <>
              <button
                onClick={() => onShareNative(item)}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Share2 size={16} />
                <span>Compartilhar</span>
              </button>

              {item.file_url && (
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-2 bg-midnight hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Download size={16} />
                  <span>Baixar Arquivo</span>
                </a>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
