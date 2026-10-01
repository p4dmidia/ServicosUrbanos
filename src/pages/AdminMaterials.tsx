import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderDown, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  MessageSquare, 
  Cloud, 
  Loader2, 
  UploadCloud,
  CheckCircle,
  Ban,
  Check,
  FileCheck,
  Link as LinkIcon,
  XCircle,
  Sparkles,
  Eye,
  FileSpreadsheet,
  Sliders,
  Download,
  ExternalLink,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { MarketingMaterial } from './AffiliateMaterials';

export const MATERIAL_CATEGORIES = [
  { id: 'imagens', label: '🖼️ Imagens' },
  { id: 'videos', label: '🎬 Vídeos' },
  { id: 'pdfs', label: '📄 PDFs' },
  { id: 'docs', label: '📝 Docs' },
  { id: 'planilhas', label: '📊 Planilhas' },
  { id: 'apresentacoes', label: '📊 Apresentações (PPTX)' },
];

// Helper seguro de detecção de categoria normalizada
export function getNormalizedCategory(category?: string, type?: string, url?: string): string {
  const cat = (category || '').toLowerCase();
  const typ = (type || '').toLowerCase();
  const fileUrl = (url || '').toLowerCase();

  if (cat === 'planilhas' || typ === 'spreadsheet' || /\.(xls|xlsx|csv|ods)$/i.test(fileUrl)) return 'planilhas';
  if (cat === 'apresentacoes' || typ === 'presentation' || /\.(ppt|pptx|odp|key)$/i.test(fileUrl)) return 'apresentacoes';
  if (cat === 'pdfs' || typ === 'pdf' || fileUrl.endsWith('.pdf') || fileUrl.startsWith('data:application/pdf')) return 'pdfs';
  if (cat === 'docs' || typ === 'doc' || /\.(doc|docx|txt|rtf|odt)$/i.test(fileUrl)) return 'docs';
  if (cat === 'videos' || typ === 'video' || /\.(mp4|mov|webm|mkv|avi)$/i.test(fileUrl) || fileUrl.startsWith('data:video/')) return 'videos';
  if (cat === 'imagens' || cat === 'feed' || cat === 'stories' || typ === 'image' || /\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i.test(fileUrl) || fileUrl.startsWith('data:image/')) return 'imagens';
  if (cat === 'copys' || typ === 'text') return 'copys';
  if (cat === 'drive' || typ === 'link') return 'drive';
  return cat || 'imagens';
}

// Helper seguro de renderização do ícone / miniatura na tabela
function AdminMaterialThumbnail({ item }: { item: MarketingMaterial }) {
  const [imgError, setImgError] = useState(false);

  const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
  const url = item.file_url || item.thumbnail_url || '';

  if (normCat === 'pdfs') {
    return (
      <div className="size-full bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shadow-sm" title="PDF">
        <FileText size={20} />
      </div>
    );
  }

  if (normCat === 'docs') {
    return (
      <div className="size-full bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-sm" title="Documento (Doc/Txt)">
        <FileText size={20} />
      </div>
    );
  }

  if (normCat === 'planilhas') {
    return (
      <div className="size-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm" title="Planilha (XLS/CSV)">
        <FileSpreadsheet size={20} />
      </div>
    );
  }

  if (normCat === 'apresentacoes') {
    return (
      <div className="size-full bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shadow-sm" title="Apresentação (PPTX)">
        <Sliders size={20} />
      </div>
    );
  }

  if (normCat === 'videos') {
    return (
      <div className="size-full bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-sm" title="Vídeo">
        <Video size={20} />
      </div>
    );
  }

  if (normCat === 'copys') {
    return (
      <div className="size-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm" title="Texto / Copy">
        <MessageSquare size={20} />
      </div>
    );
  }

  if (normCat === 'drive') {
    return (
      <div className="size-full bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shadow-sm" title="Link / Nuvem">
        <Cloud size={20} />
      </div>
    );
  }

  // Imagem
  if (!imgError && url && (url.startsWith('http') || url.startsWith('data:image/') || url.startsWith('/'))) {
    return (
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover rounded-xl"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="size-full bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 shadow-sm" title="Imagem">
      <ImageIcon size={20} />
    </div>
  );
}

// Modal de Pré-visualização do Material (Admin)
function AdminPreviewModal({
  item,
  onClose
}: {
  item: MarketingMaterial;
  onClose: () => void;
}) {
  const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
  const url = item.file_url || item.thumbnail_url || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0e131f] rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-white/10 relative text-white"
      >
        {/* Header Modal */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              {normCat.toUpperCase()} • {item.type?.toUpperCase()}
            </span>
            <h2 className="text-base font-bold text-white line-clamp-1">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {normCat === 'videos' && url ? (
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
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
          ) : normCat === 'pdfs' && url ? (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-white border border-white/10 h-[62vh] shadow-inner">
                <iframe 
                  src={url.startsWith('data:') ? url : `${url}#toolbar=1&navpanes=0`} 
                  title={item.title}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>Visualizador de PDF integrado</span>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Abrir em aba cheia</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ) : normCat === 'planilhas' ? (
            <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <FileSpreadsheet size={38} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Arquivo de Planilha (Excel / CSV / ODS)</p>
              </div>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : normCat === 'apresentacoes' ? (
            <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Sliders size={38} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Apresentação de Slides (PowerPoint PPTX / ODP)</p>
              </div>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : normCat === 'docs' ? (
            <div className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
                <FileText size={38} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Documento de Texto (Word DOCX / TXT)</p>
              </div>
              {item.file_size && (
                <span className="inline-block text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  {item.file_size}
                </span>
              )}
            </div>
          ) : normCat === 'copys' && item.copy_text ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Texto / Copy WhatsApp:
              </span>
              <div className="bg-black/50 border border-white/10 p-5 rounded-2xl text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {item.copy_text}
              </div>
            </div>
          ) : url ? (
            <div className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-2">
              <img 
                src={url} 
                alt={item.title} 
                className="w-full max-h-[60vh] object-contain mx-auto rounded-xl"
              />
            </div>
          ) : null}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {item.file_size && <span className="font-mono">Tamanho: {item.file_size}</span>}
          </div>
          <div className="flex items-center gap-3">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Download size={15} />
                <span>Baixar Arquivo</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<MarketingMaterial | null>(null);
  
  // Modo de Entrada: 'upload' | 'link' | 'copy'
  const [entryMode, setEntryMode] = useState<'upload' | 'link' | 'copy'>('upload');
  
  // Estado do formulário inline (sem modal)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('imagens');
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | 'doc' | 'spreadsheet' | 'presentation' | 'text' | 'link'>('image');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [copyText, setCopyText] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_materials')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar materiais:', err);
      toast.error('Erro ao carregar materiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const { error } = await supabase
        .from('marketing_materials')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(newStatus === 'Ativo' ? 'Material ativado!' : 'Material inativado!');
      loadMaterials();
    } catch (err: any) {
      toast.error('Erro ao alterar status: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este material?')) return;
    try {
      const { error } = await supabase
        .from('marketing_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Material excluído com sucesso!');
      if (editingId === id) resetForm();
      loadMaterials();
    } catch (err: any) {
      toast.error('Erro ao excluir material: ' + err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('imagens');
    setFileType('image');
    setFileUrl('');
    setFileSize('');
    setCopyText('');
    setExternalLink('');
    setUploadedFileName(null);
    setEditingId(null);
    setEntryMode('upload');
  };

  // Limpa nome de arquivo para gerar título amigável
  const cleanFileNameToTitle = (filename: string) => {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    return nameWithoutExt
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Processa arquivo selecionado ou arrastado
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    setUploadedFileName(file.name);
    setTitle(cleanFileNameToTitle(file.name));

    // Detectar tamanho formatado
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setFileSize(sizeStr);

    // Detectar tipo e subpasta sugerida
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext) || mime.startsWith('image/')) {
      setFileType('image');
      setCategory('imagens');
    } else if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) {
      setFileType('video');
      setCategory('videos');
    } else if (ext === 'pdf' || mime === 'application/pdf') {
      setFileType('pdf');
      setCategory('pdfs');
    } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext) || mime.includes('word') || mime.includes('text/plain')) {
      setFileType('doc');
      setCategory('docs');
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv')) {
      setFileType('spreadsheet');
      setCategory('planilhas');
    } else if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
      setFileType('presentation');
      setCategory('apresentacoes');
    } else {
      setFileType('image');
      setCategory('imagens');
    }

    // Fazer upload para o Storage
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop() || 'bin';
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `materials/${uniqueName}`;

      let uploadRes = await supabase.storage.from('marketing-materials').upload(filePath, file, { cacheControl: '3600', upsert: true });
      let bucketName = 'marketing-materials';

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from('products').upload(filePath, file, { cacheControl: '3600', upsert: true });
        bucketName = 'products';
      }

      if (uploadRes.error) {
        console.warn('Storage upload error (Bucket may need to be created):', uploadRes.error);
        // Fallback para DataURL para arquivos de até 15MB
        if (file.size <= 15 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setFileUrl(dataUrl);
            toast.success(`"${file.name}" carregado! (Execute o SQL do bucket para armazenamento na nuvem)`);
          };
          reader.readAsDataURL(file);
        } else {
          toast.error('Bucket de armazenamento não encontrado. Crie o bucket no Supabase ou informe a URL direta.');
        }
      } else {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        setFileUrl(publicUrlData.publicUrl);
        toast.success(`"${file.name}" importado com sucesso!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleEditClick = (item: MarketingMaterial) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setFileType((item.type as any) || 'image');
    setFileUrl(item.file_url || '');
    setFileSize(item.file_size || '');
    setCopyText(item.copy_text || '');
    setExternalLink(item.external_link || '');
    setUploadedFileName(item.file_url ? 'Arquivo já anexado' : null);

    if (item.type === 'text' || item.category === 'copys') {
      setEntryMode('copy');
    } else if (item.type === 'link' || item.category === 'drive') {
      setEntryMode('link');
    } else {
      setEntryMode('upload');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Informe o título do material.');
      return;
    }

    if (entryMode === 'upload' && !fileUrl.trim()) {
      toast.error('Por favor, selecione ou arraste um arquivo para fazer o upload.');
      return;
    }

    if (entryMode === 'link' && !externalLink.trim()) {
      toast.error('Informe o link do Google Drive ou Canva.');
      return;
    }

    if (entryMode === 'copy' && !copyText.trim()) {
      toast.error('Digite o texto da mensagem de WhatsApp.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: null,
        category: category,
        type: entryMode === 'copy' ? 'text' : entryMode === 'link' ? 'link' : fileType,
        file_url: entryMode === 'upload' ? fileUrl : (entryMode === 'link' ? externalLink : null),
        thumbnail_url: fileType === 'image' ? fileUrl : null,
        copy_text: entryMode === 'copy' ? copyText : null,
        external_link: entryMode === 'link' ? externalLink : null,
        file_size: fileSize || (entryMode === 'copy' ? 'Texto' : entryMode === 'link' ? 'Nuvem' : null),
        badge: 'Novo',
        order_index: materials.length + 1,
        status: 'Ativo'
      };

      if (editingId) {
        const { error } = await supabase
          .from('marketing_materials')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Material atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('marketing_materials')
          .insert([payload]);

        if (error) throw error;
        toast.success('Novo material publicado no painel do afiliado!');
      }

      resetForm();
      loadMaterials();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar material: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      const normCat = getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url);
      const matchCat = selectedFilterCategory === 'all' || normCat === selectedFilterCategory || item.category === selectedFilterCategory;
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [materials, selectedFilterCategory, searchTerm]);

  return (
    <AdminLayout title="Materiais & Criativos" subtitle="Importe imagens, vídeos, PDFs e documentos para os afiliados baixarem">
      <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">

        {/* Input de arquivo invisível */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.csv,.ods,.ppt,.pptx,.odp"
          className="hidden" 
        />

        {/* ============================================================ */}
        {/* ÁREA ÚNICA DE IMPORTAÇÃO (SEM MODAL) */}
        {/* ============================================================ */}
        <div className="bg-[#0a0e17] p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles size={13} />
                <span>{editingId ? 'Editando Material' : 'Importação Rápida'}</span>
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                {editingId ? 'Editar Material de Divulgação' : 'Adicionar Novo Material'}
              </h2>
            </div>

            {/* Alternador de Modo: Arquivo vs Link vs Copy */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => { setEntryMode('upload'); if (!editingId) setCategory('imagens'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'upload' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud size={15} />
                <span>Upload de Arquivo</span>
              </button>

              <button
                type="button"
                onClick={() => { setEntryMode('link'); setCategory('drive'); setFileType('link'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'link' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LinkIcon size={15} />
                <span>Link do Drive / Canva</span>
              </button>

              <button
                type="button"
                onClick={() => { setEntryMode('copy'); setCategory('copys'); setFileType('text'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'copy' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare size={15} />
                <span>Texto / Copy WhatsApp</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. CAMPO ÚNICO DE UPLOAD (DRAG & DROP) */}
            {entryMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-[2rem] p-8 lg:p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[0.99]'
                    : fileUrl || uploadedFileName
                    ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                    : 'border-white/10 hover:border-indigo-500/40 bg-white/[0.01] hover:bg-white/[0.03]'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="animate-spin text-indigo-400" />
                    <p className="text-sm font-bold text-indigo-300">Enviando arquivo para o servidor...</p>
                    <p className="text-[11px] text-slate-400">Aguarde alguns instantes</p>
                  </div>
                ) : fileUrl || uploadedFileName ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="size-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <FileCheck size={28} />
                    </div>
                    <p className="text-sm font-bold text-white max-w-md truncate">{uploadedFileName || 'Arquivo pronto'}</p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                      <span>✓ Upload concluído</span>
                      {fileSize && <span>• {fileSize}</span>}
                    </div>
                    
                    {/* Botão de Visualização Rápida do Arquivo */}
                    <div className="flex items-center gap-3 pt-2">
                      {fileUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem({
                              id: 'preview_current',
                              title: title || uploadedFileName || 'Arquivo Atual',
                              category: category,
                              type: fileType,
                              file_url: fileUrl,
                              file_size: fileSize,
                              status: 'Ativo'
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Visualizar Arquivo</span>
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400 underline">
                        Clique ou arraste outro para trocar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                      <UploadCloud size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        Arraste e solte o arquivo aqui ou <span className="text-indigo-400 underline">clique para selecionar</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Aceita Imagens, Vídeos, PDFs, Docs, Planilhas e Apresentações (PPTX)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : entryMode === 'link' ? (
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  Link do Google Drive / Canva / Nuvem *
                </label>
                <input
                  type="url"
                  required
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Texto da Copy / Mensagem de WhatsApp *
                  </label>
                  <span className="text-[9px] text-emerald-400 font-mono">Use {'{link_afiliado}'} para link dinâmico</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={copyText}
                  onChange={(e) => setCopyText(e.target.value)}
                  placeholder="Ex: Olá! Já conhece o ecossistema da CaZa dos Sorteios? Cadastre-se pelo meu link: {link_afiliado}"
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
                />
              </div>
            )}

            {/* 2. CAMPOS DE CONFIRMAÇÃO: TÍTULO E SUBPASTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* Título */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Título do Material (Puxado do arquivo ou digite) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Apresentação Oficial do Projeto"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3.5 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Subpasta */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Subpasta de Destino *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 px-4 py-3.5 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  {MATERIAL_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                  <option value="copys">💬 Textos & Copys WhatsApp</option>
                  <option value="drive">☁️ Nuvem & Google Drive</option>
                </select>
              </div>

            </div>

            {/* Botões de Ação */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <XCircle size={15} />
                  <span>Cancelar Edição</span>
                </button>
              )}

              <button
                type="submit"
                disabled={uploading || submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{editingId ? 'Salvar Alterações' : 'Publicar Material'}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* ============================================================ */}
        {/* TABELA DE MATERIAIS SALVOS ABAIXO */}
        {/* ============================================================ */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden space-y-6 p-6 lg:p-8">
          
          {/* Header da Tabela com Filtro e Busca */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">
                Materiais Salvos no Sistema ({filteredMaterials.length})
              </h3>
              <p className="text-xs text-slate-400">Arquivos disponíveis para os afiliados visualizarem e baixarem</p>
            </div>

            {/* Busca */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por nome do material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 py-2.5 pl-11 pr-4 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Filtro de Abas/Categorias */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setSelectedFilterCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedFilterCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Todas ({materials.length})
            </button>
            {MATERIAL_CATEGORIES.map(cat => {
              const count = materials.filter(m => {
                const normCat = getNormalizedCategory(m.category, m.type, m.file_url || m.thumbnail_url);
                return normCat === cat.id || m.category === cat.id;
              }).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilterCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedFilterCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="ml-1 text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-4">Material</th>
                  <th className="py-4 px-4">Subpasta</th>
                  <th className="py-4 px-4">Tipo</th>
                  <th className="py-4 px-4">Tamanho</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <Loader2 className="size-7 text-indigo-500 animate-spin mx-auto mb-2" />
                      Carregando materiais...
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      Nenhum material cadastrado nesta pasta. Use a caixa de upload acima para enviar o primeiro arquivo.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Material Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="size-11 rounded-xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            title="Clique para visualizar"
                          >
                            <AdminMaterialThumbnail item={item} />
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="font-bold text-white text-sm hover:text-indigo-400 text-left transition-colors cursor-pointer"
                            >
                              {item.title}
                            </button>
                            {item.copy_text && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md font-mono">{item.copy_text}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subpasta */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-bold text-[10px] uppercase">
                          {getNormalizedCategory(item.category, item.type, item.file_url || item.thumbnail_url)}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-4 px-4 uppercase text-slate-400 font-mono text-[11px]">
                        {item.type}
                      </td>

                      {/* Tamanho */}
                      <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                        {item.file_size || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(item.id, item.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                            item.status === 'Ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.status === 'Ativo' ? <CheckCircle size={12} /> : <Ban size={12} />}
                          <span>{item.status}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all cursor-pointer"
                          title="Visualizar Arquivo"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Pré-visualização do Material */}
        {previewItem && (
          <AdminPreviewModal 
            item={previewItem} 
            onClose={() => setPreviewItem(null)} 
          />
        )}

      </div>
    </AdminLayout>
  );
}
