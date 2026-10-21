import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  Target, 
  ShoppingBag, 
  Building2, 
  FileText, 
  Lock, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  MessageCircle,
  Shield,
  Ticket,
  HeartPulse,
  AlertCircle,
  Briefcase,
  Calendar,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import RPAReceiptModal from '../components/RPAReceiptModal';
import { businessRules, RPAReceipt } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);
  const [seguradoData, setSeguradoData] = useState<any>(null);
  const [comissoesData, setComissoesData] = useState<any>(null);
  const [pjRequirement, setPjRequirement] = useState<any>(null);
  const [rpaLock, setRpaLock] = useState<{
    isLocked: boolean;
    pendingRpa: RPAReceipt | null;
    isPrevisaoPending: boolean;
  }>({ isLocked: false, pendingRpa: null, isPrevisaoPending: false });
  const [isRPAModalOpen, setIsRPAModalOpen] = useState(false);
  const itemsPerPage = 8;

  async function loadDashboardData() {
    if (!user) return;
    
    try {
      setLoading(true);
      const [statsData, activityData, rpaStatus, mfRes, segRes, pjReq] = await Promise.all([
        businessRules.getAffiliateStats(user.id),
        businessRules.getEcosystemActivity(user.id),
        businessRules.checkAffiliateRPALockStatus(user.id),
        businessRules.getMicrofranqueadoData(user.id),
        businessRules.getSeguradoData(user.id),
        businessRules.checkMicrofranqueadoPjRequirement(user.id)
      ]);
      
      setStats(statsData);
      setActivity(activityData);
      setRpaLock(rpaStatus);
      setMicrofranqueadoData(mfRes);
      setSeguradoData(segRes);
      setPjRequirement(pjReq);

      if (mfRes?.microfranqueado?.id) {
        const comissoesRes = await businessRules.getComissoesMicrofranqueado(mfRes.microfranqueado.id);
        setComissoesData(comissoesRes);
      }

      if (rpaStatus.isLocked && mfRes?.isMicrofranqueado) {
        setIsRPAModalOpen(true);
      }

      const referralCode = profile?.referral_code || user.id;
      setLinks(businessRules.getAffiliateLinks(referralCode));
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLinks(businessRules.getAffiliateLinks(user.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [user, profile]);

  const copyToClipboard = (text: string, label: string = 'Link') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`, {
      style: {
        borderRadius: '16px',
        background: '#0a0e17',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    });
  };

  if (loading) {
    return (
      <AffiliateLayout title="Painel">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  const isMicrofranqueado = !!microfranqueadoData?.isMicrofranqueado;
  const isSegurado = !!seguradoData?.isSegurado;
  const isPolicyActive = !!seguradoData?.isPolicyActive;
  const isLicenseActive = !!microfranqueadoData?.isLicenseActive;
  const isLimit100Free = !!microfranqueadoData?.microfranqueado?.is_primeiros_100;

  // =========================================================================
  // CENÁRIO 1: AFILIADO PREMIUM (CONSUMIDOR DE PROTEÇÃO, TELEMEDICINA E SORTEIOS - ZERO MMN)
  // =========================================================================
  if (!isMicrofranqueado) {
    const apolice = seguradoData?.apolice;
    const numerosSorte = seguradoData?.numerosDaSorte || [];
    const numeroPrincipal = numerosSorte[0]?.numero_sorte || 'Aguardando Sorteio';

    return (
      <AffiliateLayout title="Painel do Segurado">
        <div className="p-8 lg:p-12 space-y-10">
          {/* Header de Boas-Vindas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider mb-2">
                <Shield size={12} className="text-emerald-600" />
                Seguro Vida Light & Assistências
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-midnight tracking-tight italic uppercase">
                Olá, {profile?.full_name?.split(' ')[0] || 'Segurado'}!
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                Acompanhe sua cobertura de seguro MBM R$ 5.000, telemedicina 24h e seus números da sorte.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                to="/afiliado/renovacoes" 
                className="inline-flex items-center gap-2 bg-primary-blue text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-blue/10 hover:bg-primary-blue/90 transition-all group"
              >
                <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
                Gerenciar Meu Plano
              </Link>
            </div>
          </div>

          {/* Alerta de Plano Pendente (se não estiver com apólice ativa) */}
          {!isPolicyActive && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                    Ativação Necessária
                  </div>
                  <h4 className="text-base font-black text-amber-950 uppercase tracking-tight">
                    Sua cobertura do Seguro Vida Light está inativa
                  </h4>
                  <p className="text-xs text-amber-900/80 font-medium">
                    Ative ou renove sua assinatura para ter direito à indenização MBM de R$ 5.000,00, telemedicina 24h sem carência e sorteios semanais.
                  </p>
                </div>
              </div>
              <Link 
                to="/afiliado/renovacoes" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-600/20 whitespace-nowrap active:scale-95 shrink-0"
              >
                Ativar por R$ 5,00/mês
              </Link>
            </div>
          )}

          {/* Grid Principal de 4 Benefícios Exclusivos do Afiliado Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Seguro Vida Light MBM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Shield size={24} />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                    isPolicyActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isPolicyActive ? 'Vigente' : 'Pendente'}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Capital Segurado MBM
                </p>
                <h3 className="text-2xl font-black text-midnight tracking-tighter">
                  R$ 5.000,00
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  Morte Acidental & Invalidez Permanente por Acidente.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <Link 
                  to="/afiliado/apolice" 
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 uppercase tracking-wider"
                >
                  Ver Certificado <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* 2. Telemedicina 24/7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
                    <HeartPulse size={24} />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase bg-sky-50 text-sky-700">
                    24 Horas
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Racca Saúde Online
                </p>
                <h3 className="text-xl font-black text-midnight tracking-tight">
                  Pronto Atendimento
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  Consultas com clínico geral e pediatria sem carência e sem coparticipação.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <Link 
                  to="/afiliado/telemedicina" 
                  className="text-xs font-black text-sky-600 hover:text-sky-700 inline-flex items-center gap-1.5 uppercase tracking-wider"
                >
                  Acessar Consultório <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* 3. Números da Sorte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                    <Ticket size={24} />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase bg-purple-50 text-purple-700">
                    Loteria Federal
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Número da Sorte
                </p>
                <h3 className="text-2xl font-mono font-black text-midnight tracking-wider">
                  {numeroPrincipal}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  4 sorteios por mês aos domingos pela extração oficial da CEF.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <Link 
                  to="/afiliado/numero-sorte" 
                  className="text-xs font-black text-purple-600 hover:text-purple-700 inline-flex items-center gap-1.5 uppercase tracking-wider"
                >
                  Meus Números <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* 4. Central de Sinistros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                    <AlertCircle size={24} />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase bg-amber-50 text-amber-700">
                    Digital
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Atendimento Seguro
                </p>
                <h3 className="text-xl font-black text-midnight tracking-tight">
                  Sinistros MBM
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  Acione o seguro e envie documentos para liquidação da indenização.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <Link 
                  to="/afiliado/sinistros" 
                  className="text-xs font-black text-amber-600 hover:text-amber-700 inline-flex items-center gap-1.5 uppercase tracking-wider"
                >
                  Acionar / Acompanhar <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Seção de 2 Colunas: Informações da Apólice & Oportunidade Microfranqueado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Informações e Vigência da Apólice */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Certificado Individual de Seguro
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-midnight tracking-tight uppercase italic">
                    Dados da Proteção
                  </h2>
                </div>
                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileCheck size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Seguradora Garantidora</p>
                  <p className="font-black text-midnight text-sm">MBM Previdência Complementar</p>
                  <p className="text-xs text-slate-500">Apólice Coletiva Oficial registrada na SUSEP</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Coberturas Inclusas</p>
                  <p className="font-black text-midnight text-sm">Morte Acidental (MA) & Invalidez (IPA)</p>
                  <p className="text-xs text-slate-500">Capital Segurado: R$ 5.000,00</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vigência da Apólice</p>
                  <p className="font-black text-midnight text-sm">
                    {apolice?.vigencia_fim 
                      ? `Até ${new Date(apolice.vigencia_fim).toLocaleDateString('pt-BR')}`
                      : 'Ativação mediante pagamento'}
                  </p>
                  <p className="text-xs text-slate-500">Renovação simples sem reajuste por faixa etária</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Regra dos Sorteios</p>
                  <p className="font-black text-midnight text-sm">4 Últimos Domingos do Mês</p>
                  <p className="text-xs text-slate-500">Apuração através da Loteria Federal do Brasil</p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock size={16} className="text-primary-blue" />
                  <span>Dúvidas sobre sua apólice? Consulte nossos termos oficiais.</span>
                </div>
                <Link
                  to="/afiliado/apolice"
                  className="bg-midnight hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <FileText size={16} />
                  Baixar Certificado Individual
                </Link>
              </div>
            </div>

            {/* Coluna 2: Card de Convite para se Tornar Microfranqueado */}
            <div className="bg-gradient-to-br from-[#0B1528] via-[#0F224A] to-[#0A3275] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-blue-900/30">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                  <Briefcase size={14} />
                  Oportunidade Comercial
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">
                    Seja um <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">Microfranqueado</span>
                  </h3>
                  <p className="text-slate-300 text-xs font-medium mt-3 leading-relaxed">
                    Você sabia que pode montar uma equipe de vendas e ganhar comissões em rede? 
                    Microfranqueados recebem <strong>33% de comissão</strong> (G0 21%+2%, G1 3%+2%, G2 3%+2%) sobre vendas do Seguro Vida Light!
                  </p>
                </div>

                <div className="bg-white/10 border border-white/15 p-4 rounded-2xl space-y-2 backdrop-blur-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Comissão Direta (G0):</span>
                    <span className="font-mono font-black text-emerald-400">21% + 2%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Comissão Indireta (G1 e G2):</span>
                    <span className="font-mono font-black text-sky-300">3%+2% / 3%+2%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
                    <span className="text-slate-300">Pagamento:</span>
                    <span className="font-black text-amber-300">27% Semanal / 6% Anual</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 font-medium">
                  ⭐ <strong>100 Primeiros:</strong> Taxa anual de R$ 150,00 com isenção na entrada e desconto direto do bônus de dezembro!
                </div>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/afiliado/renovacoes"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Sparkles size={16} />
                  Ativar Licença de Franquia
                </Link>
              </div>
            </div>
          </div>

          {/* Histórico Pessoal de Faturas e Pedidos */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">
                  Meus Pedidos & Faturas
                </h3>
                <p className="text-slate-500 font-medium text-xs">
                  Histórico de aquisição e renovação do seu plano Seguro Vida Light.
                </p>
              </div>
              <Link 
                to="/afiliado/pedidos" 
                className="text-xs font-black text-slate-400 hover:text-midnight transition-colors tracking-widest uppercase flex items-center gap-1.5"
              >
                Ver Todos <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Produto</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobertura</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                    <td className="py-5 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Shield size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-midnight">Seguro Vida Light + Telemedicina</p>
                          <p className="text-[10px] text-slate-400">MBM Seguradora & Racca Saúde</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-sm font-bold text-slate-600">
                      R$ 5.000,00
                    </td>
                    <td className="py-5 text-xs text-slate-500 font-medium">
                      {apolice?.created_at ? new Date(apolice.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td className="py-5 text-right font-black text-midnight text-sm">
                      {isPolicyActive ? 'R$ 5,00/mês' : 'Aguardando'}
                    </td>
                    <td className="py-5 text-center pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        isPolicyActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isPolicyActive ? 'Ativo' : 'Pendente'}
                        <CheckCircle2 size={12} />
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </AffiliateLayout>
    );
  }

  // =========================================================================
  // CENÁRIO 2: MICROFRANQUEADO (MMN, GESTÃO DE REDE, COMISSÕES 80/20)
  // =========================================================================
  return (
    <AffiliateLayout title="Escritório Virtual MMN">
      <div className="p-8 lg:p-12 space-y-10">
        {/* Header de Boas-Vindas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary-blue border border-blue-200/80 text-[10px] font-black uppercase tracking-wider">
                <Briefcase size={12} />
                {isLimit100Free ? 'Pioneiro — Primeiros 100 Franqueados' : 'Microfranqueado Licenciado'}
              </div>
              {pjRequirement?.isPJ ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-wider">
                  <Building2 size={12} />
                  Conta PJ Ativa • Isenta de Retenções
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  Pessoa Física (PF)
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-midnight tracking-tight italic uppercase">
              Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Franqueado'}!
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Gerencie sua equipe comercial, comissões semanais (80% na terça-feira) e bônus anual (20% em dezembro).
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/afiliado/renovacoes" 
              className="inline-flex items-center gap-2 bg-midnight text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-midnight/10 hover:bg-slate-800 transition-all group"
            >
              <Target size={16} className="group-hover:scale-110 transition-transform" />
              Licença de Franquia
            </Link>
          </div>
        </div>

        {/* ALERTA: MIGRAÇÃO OBRIGATÓRIA PARA PJ (LIMITE R$ 5.000 ATINGIDO) */}
        {pjRequirement?.isPjRequired && !pjRequirement?.isPJ && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/50 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shrink-0 font-black shadow-md shadow-amber-500/20">
                <Building2 size={28} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-950 border border-amber-500/30 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                  ⚠️ Limite de R$ 5.000,00 Atingido
                </div>
                <h4 className="text-base font-black text-amber-950 uppercase tracking-tight">
                  Migração para PJ / MEI Obrigatória para Liberação de Repasses
                </h4>
                <p className="text-xs text-amber-900/90 font-medium">
                  Seus ganhos acumulados atingiram <strong>R$ {Number(pjRequirement.totalEarnings || 0).toFixed(2)}</strong>. Cadastre seu CNPJ na carteira para receber 100% dos seus repasses semanais sem retenção de impostos.
                </p>
              </div>
            </div>
            <Link
              to="/afiliado/carteira"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-500/20 whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-2"
            >
              <Building2 size={16} /> Cadastrar CNPJ na Carteira
            </Link>
          </div>
        )}

        {/* PROGRESSO REGIME TRIBUTÁRIO PF -> PJ */}
        {!pjRequirement?.isPJ && !pjRequirement?.isPjRequired && (
          <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white border border-indigo-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-midnight uppercase tracking-wide">
                    Regime Tributário PF — R$ {Number(pjRequirement?.totalEarnings || 0).toFixed(2)} / R$ 5.000,00
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    {Math.min(100, Math.round(((pjRequirement?.totalEarnings || 0) / 5000) * 100))}% da meta PF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Ganhos operados via Recibo RPA. Ao atingir R$ 5.000,00, a migração para PJ/MEI será solicitada para emissão de Nota Fiscal.
                </p>
              </div>
            </div>
            <Link
              to="/afiliado/carteira"
              className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest whitespace-nowrap hover:underline flex items-center gap-1"
            >
              Ver na Carteira <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Banner de Bloqueio por Inadimplência da Licença MMN */}
        {!isLicenseActive && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg">
                <Lock size={22} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                  Licença Pendente
                </div>
                <h4 className="text-base font-black text-rose-900 uppercase tracking-tight">
                  Repasses e Comissões Bloqueados
                </h4>
                <p className="text-xs text-rose-700/90 font-medium">
                  Sua taxa anual de microfranquia está pendente. Regularize sua licença para desbloquear os repasses de comissão.
                </p>
              </div>
            </div>
            <Link 
              to="/afiliado/renovacoes" 
              className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-rose-600/20 whitespace-nowrap active:scale-95 shrink-0"
            >
              Regularizar Licença (R$ 150/ano)
            </Link>
          </div>
        )}

        {/* Banner de Aviso sobre Seguro Pessoal do Microfranqueado */}
        {!isPolicyActive ? (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl text-white">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                  Aviso de Proteção Individual
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-tight">
                  Sua microfranquia não inclui seguro nem números da sorte
                </h4>
                <p className="text-xs text-blue-200/80 font-medium">
                  Sua licença confere direito exclusivo à comissão em rede. Para ter cobertura de R$ 5.000, telemedicina 24h e concorrer aos sorteios, assine o Seguro Vida Light a partir de R$ 5,00/mês.
                </p>
              </div>
            </div>
            <Link
              to="/afiliado/renovacoes"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-2"
            >
              <Shield size={16} />
              Contratar por R$ 5,00/mês
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs text-emerald-900 font-bold">
                Você possui Seguro Vida Light ativo (R$ 5.000 + Telemedicina 24h + Números da Sorte).
              </p>
            </div>
            <Link to="/afiliado/apolice" className="text-xs font-black text-emerald-700 hover:underline uppercase tracking-wider shrink-0">
              Ver Apólice
            </Link>
          </div>
        )}

        {/* Banner de Aviso de Previsão de Pagamento RPA (Dias 1 a 9) */}
        {rpaLock.isPrevisaoPending && rpaLock.pendingRpa && !rpaLock.isLocked && (
          <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-950/90 border border-indigo-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl text-white">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg">
                <FileText size={22} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                  Fechamento Contábil {rpaLock.pendingRpa.month_label}
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-tight">
                  Recibo de RPA Gerado: R$ {rpaLock.pendingRpa.financial.liquido_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
                <p className="text-xs text-indigo-200/80 font-medium">
                  Seus repasses do mês passado estão fechados. Depósito programado via PIX.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRPAModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              Visualizar & Confirmar Ciência
            </button>
          </div>
        )}

        {/* Modal Oficial de Recibo RPA */}
        {rpaLock.pendingRpa && (
          <RPAReceiptModal
            isOpen={isRPAModalOpen || rpaLock.isLocked}
            mode={rpaLock.isLocked ? 'quitacao' : 'previsao'}
            rpa={rpaLock.pendingRpa}
            onClose={() => {
              if (!rpaLock.isLocked) setIsRPAModalOpen(false);
            }}
            onSuccess={() => {
              loadDashboardData();
              setIsRPAModalOpen(false);
            }}
          />
        )}

        {/* Top Stats Grid Comercial (Alinhado ao modelo 80% Terça-feira / 20% Dezembro) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Comissão Semanal (80%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                Split 80% Semanal
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Repasse Terça ({comissoesData?.proximaTerca || 'Próxima Terça'})
            </p>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">
              R$ {Number(comissoesData?.semanalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Vendas de Segunda a Sábado.
            </p>
          </motion.div>

          {/* 2. Bônus Anual (20%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <ArrowUpRight size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                Split 20% Anual
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Pagamento em 10/12 ({comissoesData?.proximoDezembro || '10/12'})
            </p>
            <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">
              R$ {Number(comissoesData?.anualAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Acumulado no fundo anual.
            </p>
          </motion.div>

          {/* 3. Rede de Distribuição */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                3 Níveis MMN
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Total na Equipe
            </p>
            <h3 className="text-2xl font-black text-midnight tracking-tighter">
              {stats?.networkSummary?.total || 0} <span className="text-sm font-normal text-slate-400">membros</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              G0: 21%+2% | G1: 3%+2% | G2: 3%+2%
            </p>
          </motion.div>

          {/* 4. Status da Licença de Franquia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white p-6 rounded-3xl border-2 transition-all shadow-sm ${
              isLicenseActive ? 'border-emerald-500 bg-emerald-50/10' : 'border-rose-300 bg-rose-50/10'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${isLicenseActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Target size={22} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                isLicenseActive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                {isLicenseActive ? 'Licença Ativa' : 'Pendente'}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              {isLimit100Free ? '1º Ano Gratuito' : 'Anuidade R$ 150,00'}
            </p>
            <h3 className="text-base font-black text-midnight tracking-tight">
              {isLimit100Free ? 'Licença Ativa (1º Ano Grátis)' : 'Taxa Anual Ativa'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Direito exclusivo a comissões em rede.
            </p>
          </motion.div>
        </div>

        {/* Banner Ganha & Ganha + Desempenho da Rede */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Promocional Ganha & Ganha */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0B1528] via-[#0F224A] to-[#0A3275] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-blue-900/30">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-blue/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none">
              <Gift size={240} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
                <Sparkles size={14} className="animate-pulse" />
                Programa Ganha & Ganha
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight italic uppercase">
                  Compartilhe seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-300">Link Oficial</span>
                </h2>
                <p className="text-slate-300 text-sm font-medium mt-2 max-w-xl leading-relaxed">
                  Indique clientes para o <strong>Seguro Vida Light</strong> (a partir de R$ 5,00/mês) ou recrute novos <strong>Microfranqueados</strong> para expandir sua equipe e maximizar comissões em 3 níveis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="bg-white/10 border border-white/15 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Seu Código:</span>
                  <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                    {profile?.referral_code || (user?.id ? user.id.substring(0, 6).toUpperCase() : '---')}
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(`https://wa.me/5571992102042?text=${encodeURIComponent(`Olá! Quero conhecer a CaZa dos Sorteios. Código de indicação: ${profile?.referral_code || (user?.id ? user.id.substring(0, 6).toUpperCase() : '')}`)}`, 'Link do WhatsApp')}
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
                >
                  <Copy size={16} />
                  Copiar WhatsApp
                </button>

                <Link
                  to="/afiliado/codigo-ganha-ganha"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md active:scale-95"
                >
                  <Gift size={16} />
                  Ver Ferramentas de Divulgação
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Desempenho da Rede */}
          <div className="bg-midnight rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-midnight/20">
             <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-primary-blue/20 rounded-full blur-[80px]"></div>
             
             <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desempenho da Equipe</p>
               <h3 className="text-3xl font-black tracking-tighter mb-8 italic uppercase text-emerald-400">Status Ativo</h3>
               
               <div className="space-y-6">
                 {[
                   { label: 'G0 Direto (21% + 2%)', value: stats?.networkSummary?.g1 || 0, max: 100, color: 'bg-emerald-500' },
                   { label: 'G1 Indireto (3% + 2%)', value: stats?.networkSummary?.g2 || 0, max: 200, color: 'bg-primary-blue' },
                   { label: 'G2 Indireto (3% + 2%)', value: stats?.networkSummary?.g3 || 0, max: 300, color: 'bg-indigo-400' },
                 ].map((item, i) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                       <span className="text-slate-400">{item.label}</span>
                       <span>{item.value}</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                         transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                         className={`h-full ${item.color}`}
                        />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="relative z-10 mt-8 bg-white/5 border border-white/10 rounded-3xl p-5">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-primary-blue flex items-center justify-center text-white">
                     <Users size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400">Total na Rede</p>
                     <p className="text-xl font-black">{stats?.networkSummary?.total || 0} <span className="text-[10px] text-emerald-500">pessoas</span></p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tabela de Atividade Comercial */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-black text-midnight tracking-tight italic uppercase">Atividade no Ecossistema</h2>
              <p className="text-slate-500 font-medium text-xs">Histórico de comissões geradas pela sua rede de vendas.</p>
            </div>
            <Link 
              to="/afiliado/financeiro" 
              className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-midnight transition-colors tracking-widest uppercase"
            >
              Ver Carteira Completa
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Tipo</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center pr-4">Nível</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Nenhuma atividade recente na rede. Divulgue seu link para começar a faturar!
                    </td>
                  </tr>
                ) : (
                  activity.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, i: number) => {
                    const isWithdrawal = item.originalType === 'withdrawal' || item.category === 'withdrawal';
                    const typeLabel = isWithdrawal ? 'Resgate' : 'Comissão MMN';

                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                      >
                        <td className="py-6 pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              isWithdrawal 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {isWithdrawal ? <Wallet size={18} /> : <TrendingUp size={18} />}
                            </div>
                            <span className="font-bold text-sm tracking-tight text-midnight whitespace-nowrap">
                              {typeLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-6">
                          <p className="font-bold text-midnight text-sm max-w-xs truncate" title={item.description}>
                            {item.description}
                          </p>
                        </td>
                        <td className="py-6">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={14} />
                            <span className="text-xs font-bold">{item.date}</span>
                          </div>
                        </td>
                        <td className="py-6 text-right font-black text-midnight text-sm">
                          <span className={item.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}>
                            {item.amount > 0 ? '+' : ''}{Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>
                        <td className="py-6 text-center pr-4">
                          {item.level === '0' || item.level === 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200" title="G0 Direto (21% + 2%)">
                              🟢 G0 (21% + 2%)
                            </span>
                          ) : item.level === '1' || item.level === 1 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200" title="G1 Indireto (3% + 2%)">
                              🔵 G1 (3% + 2%)
                            </span>
                          ) : item.level === '2' || item.level === 2 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200" title="G2 Indireto (3% + 2%)">
                              🟣 G2 (3% + 2%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                              {item.status || 'Confirmado'}
                              <CheckCircle2 size={12} />
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {activity.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-4 mt-10 pt-10 border-t border-slate-50">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="size-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary-blue hover:text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(activity.length / itemsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-10 rounded-xl font-black text-xs transition-all ${
                      currentPage === i + 1 
                        ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(activity.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(activity.length / itemsPerPage)}
                className="size-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary-blue hover:text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

        </div>

      </div>
    </AffiliateLayout>
  );
}
