import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  UserPlus,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateNetwork() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [network, setNetwork] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);
  const [comissoesData, setComissoesData] = useState<any>(null);
  const [levelFilter, setLevelFilter] = useState<number>(0);
  const [regularizing, setRegularizing] = useState(false);

  const handleInvite = () => {
    if (!user) return;
    
    const code = profile?.referral_code || user.id;
    const inviteLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link de convite do Microfranqueado copiado!', {
      style: {
        borderRadius: '16px',
        background: '#0a0e17',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      },
      iconTheme: {
        primary: '#0f49bd',
        secondary: '#fff',
      },
    });
  };

  const handleRegularizeLicense = async () => {
    if (!microfranqueadoData?.microfranqueado?.id) return;
    try {
      setRegularizing(true);
      const res = await businessRules.regularizarLicencaMicrofranqueado(microfranqueadoData.microfranqueado.id);
      if (res?.success) {
        toast.success('Licença regularizada e rede desbloqueada com sucesso!');
        loadNetworkData();
      } else {
        toast.error(res?.error || 'Erro ao regularizar licença.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha ao regularizar.');
    } finally {
      setRegularizing(false);
    }
  };

  const loadNetworkData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [networkData, statsData, mfRes] = await Promise.all([
        businessRules.getAffiliateNetwork(user.id),
        businessRules.getAffiliateStats(user.id),
        businessRules.getMicrofranqueadoData(user.id)
      ]);

      setMicrofranqueadoData(mfRes);

      let comissoesRes = null;
      if (mfRes?.microfranqueado?.id) {
        comissoesRes = await businessRules.getComissoesMicrofranqueado(mfRes.microfranqueado.id);
        setComissoesData(comissoesRes);
      }

      // Add G0 (Você) to the network list
      const g0User = {
        id: user.id,
        name: profile?.full_name || 'Você',
        referralCode: profile?.referral_code || '',
        whatsapp: profile?.whatsapp || '',
        level: 0,
        joinedDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '---',
        status: mfRes?.isLicenseActive ? 'Ativo' : 'Pendente',
        earnings: comissoesRes?.totalBrutoG0 || statsData?.totalEarnings || 0,
        spillover: false
      };

      const filteredNetworkData = (networkData || []).filter(item => Number(item.level) <= 2);
      setNetwork([g0User, ...filteredNetworkData]);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading network:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, [user, profile]);

  if (loading) {
    return (
      <AffiliateLayout title="Rede MMN">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-12 text-primary-blue animate-spin" />
        </div>
      </AffiliateLayout>
    );
  }

  const isMicrofranqueado = microfranqueadoData?.isMicrofranqueado;
  const isLicenseActive = microfranqueadoData?.isLicenseActive;
  const isPrimeiros100 = microfranqueadoData?.isPrimeiros100;

  // Se o usuário NÃO for Microfranqueado, mostrar a tela informativa de que comissão MMN é exclusiva de Microfranqueados
  if (!isMicrofranqueado) {
    return (
      <AffiliateLayout title="Rede MMN">
        <div className="p-8 lg:p-12 min-h-[75vh] flex items-center justify-center">
          <div className="max-w-2xl bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl text-center space-y-8 relative overflow-hidden">
            <div className="size-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/10 mx-auto">
              <Briefcase size={36} />
            </div>

            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                Exclusivo para Microfranqueados
              </span>
              <h2 className="text-3xl font-black text-midnight tracking-tight uppercase italic">
                Rede MMN & Comissões
              </h2>
              <p className="text-slate-600 leading-relaxed max-w-lg mx-auto text-sm">
                Sua conta atual é de <strong>Afiliado Premium (Seguro Vida Light)</strong>, que dá direito a apólice MBM R$ 5.000, telemedicina 24h e sorteios da Loteria Federal. A formação de rede e recebimento de comissões (<strong>33% no split 80/20</strong>) é restrita aos Microfranqueados.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6 text-center">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">G0 Direto</span>
                <span className="text-xl font-black text-midnight font-mono">27%</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">G1 Indireto</span>
                <span className="text-xl font-black text-midnight font-mono">3%</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">G2 Indireto</span>
                <span className="text-xl font-black text-midnight font-mono">3%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/afiliado/renovacoes"
                className="w-full sm:w-auto bg-midnight hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-midnight/10 flex items-center justify-center gap-2"
              >
                Tornar-se Microfranqueado (R$ 150/ano)
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </AffiliateLayout>
    );
  }

  const filteredNetwork = network.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.referralCode || item.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 0 || 
      (levelFilter === -1 ? item.level === 0 : Number(item.level) === levelFilter);
    
    return matchesSearch && matchesLevel;
  });

  const levels = [
    {
      label: 'G0 (Vendas Diretas)',
      count: network.filter(item => item.level === 1).length, // Diretos
      rate: '27%',
      splitDesc: '80% terça / 20% dez',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200'
    },
    {
      label: 'G1 (Indiretos 2º Nível)',
      count: network.filter(item => item.level === 2).length,
      rate: '3%',
      splitDesc: '80% terça / 20% dez',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      label: 'G2 (Indiretos 3º Nível)',
      count: 0,
      rate: '3%',
      splitDesc: '80% terça / 20% dez',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      label: 'Comissão Total Rede',
      count: network.filter(item => item.level > 0).length,
      rate: '33%',
      splitDesc: 'Teto Comissional Oficial',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    }
  ];

  return (
    <AffiliateLayout title="Rede MMN">
      <div className="p-4 sm:p-6 md:p-10 space-y-8">
        
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100/50 shrink-0">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Microfranqueado MMN
                </span>
                {isPrimeiros100 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                    100 Primeiros
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-midnight tracking-tighter italic uppercase mt-1">
                Gerenciamento de Rede
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                {network.filter(item => item.level > 0).length} afiliados cadastrados na sua rede comissional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleInvite}
              className="bg-primary-blue hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-primary-blue/20 transition-all uppercase tracking-widest flex items-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} />
              Copiar Link de Convite
            </button>
          </div>
        </div>

        {/* Alerta de Inadimplência da Licença se houver */}
        {!isLicenseActive && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-black text-rose-950 text-xs uppercase">
                  Comissões de Rede Retidas por Inadimplência da Licença
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Regularize sua anuidade de Microfranqueado (R$ 150,00) para desbloquear seus recebimentos de G0, G1 e G2.
                </p>
              </div>
            </div>
            <button
              onClick={handleRegularizeLicense}
              disabled={regularizing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap shadow-md cursor-pointer disabled:opacity-50"
            >
              {regularizing ? 'Processando...' : 'Regularizar Agora'}
            </button>
          </div>
        )}

        {/* Calendário Operacional de Repasses: Terça-feira e Dezembro */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-midnight rounded-3xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
              <Calendar size={14} /> Repasses Semanais (80%)
            </span>
            <p className="text-lg font-black text-white">
              Toda Terça-Feira
            </p>
            <p className="text-[11px] text-slate-300">
              Vendas realizadas de Segunda a Sábado.
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Sparkles size={14} /> Bônus Anual (20%)
            </span>
            <p className="text-lg font-black text-amber-400">
              10 de Dezembro
            </p>
            <p className="text-[11px] text-slate-300">
              Ciclo acumulado anual (01.11 a 30.11).
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
              <Clock size={14} /> Próxima Terça-Feira
            </span>
            <p className="text-lg font-black text-emerald-400 font-mono">
              {comissoesData?.proximaTerca || 'Próxima Terça'}
            </p>
            <p className="text-[11px] text-slate-300">
              Próximo ciclo semanal de pagamento.
            </p>
          </div>
        </div>

        {/* Network Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {levels.map((level, i) => (
            <div
              key={i}
              className={`bg-white p-6 rounded-3xl border ${level.border} shadow-sm space-y-3 relative overflow-hidden`}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {level.label}
              </span>
              <div className="flex items-baseline justify-between">
                <span className={`text-3xl font-black font-mono ${level.color}`}>
                  {level.rate}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {level.count} {level.count === 1 ? 'membro' : 'membros'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2">
                {level.splitDesc}
              </p>
            </div>
          ))}
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou código..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:outline-hidden focus:border-primary-blue text-xs font-bold"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer focus:outline-hidden"
              >
                <option value={0}>Todos os Níveis (G0, G1, G2)</option>
                <option value={-1}>G0 (Você)</option>
                <option value={1}>G1 (Diretos - 27%)</option>
                <option value={2}>G2 (Indiretos - 3%)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Membros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="pb-3 px-2">Membro</th>
                  <th className="pb-3 px-2">Nível</th>
                  <th className="pb-3 px-2">Data Adesão</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Comissões Geradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredNetwork.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <p className="font-black text-midnight">{member.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">ID: {member.referralCode || member.id.substring(0, 8)}</p>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                        member.level === 0 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : member.level === 1 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        {member.level === 0 ? 'G0 (Titular)' : `G${member.level}`}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-500 font-medium">
                      {member.joinedDate}
                    </td>
                    <td className="py-4 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-mono font-black text-slate-800">
                      R$ {Number(member.earnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
