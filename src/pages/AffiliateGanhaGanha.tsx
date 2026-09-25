import React, { useEffect, useState } from 'react';
import { 
  Gift, 
  Copy, 
  Share2, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  MessageCircle,
  QrCode,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateGanhaGanha() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const statsData = await businessRules.getAffiliateStats(user.id);
        setStats(statsData);

        const referralCode = profile?.referral_code || user.id;
        const affiliateLinks = businessRules.getAffiliateLinks(referralCode);
        setLinks(affiliateLinks);
      } catch (error) {
        console.error("Erro ao carregar dados do Ganha & Ganha:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, profile]);

  const referralCode = profile?.referral_code || (user?.id ? user.id.substring(0, 6).toUpperCase() : '------');
  const inviteUrl = `${window.location.origin}/invite/${referralCode}`;

  const copyToClipboard = (text: string, label: string = 'Código') => {
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

  const handleShareWhatsApp = () => {
    const text = `🎉 *CONVITE EXCLUSIVO CAZA DOS SORTEIOS* 🎉\n\nProteja sua vida e sua família com o *Seguro Premiável*, concorra a *sorteios semanais de R$ 5.000,00* pela Loteria Federal, use *Telemedicina 24h* e ainda receba *Cashback recorrente*!\n\n👉 Acesse agora pelo meu link *Ganha & Ganha*:\n${inviteUrl}\n\nOu use meu código oficial no cadastro: *${referralCode}*`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Código Ganha & Ganha - CaZa dos Sorteios',
          text: `Cadastre-se na CaZa dos Sorteios usando meu Código Ganha & Ganha: ${referralCode}`,
          url: inviteUrl,
        });
      } catch (err) {
        console.log('Compartilhamento cancelado.');
      }
    } else {
      copyToClipboard(inviteUrl, 'Link Ganha & Ganha');
    }
  };

  return (
    <AffiliateLayout title="Código Ganha & Ganha">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Top Header Hero */}
        <div className="relative bg-gradient-to-br from-[#0B1528] via-[#0F224A] to-[#0A3275] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-blue-900/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-blue/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-10 opacity-5 pointer-events-none">
            <Gift size={320} />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} className="animate-pulse" />
              Programa Ganha & Ganha
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
              Código <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-300">Ganha & Ganha</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed">
              Compartilhe seu código ou link exclusivo. Cada usuário que aderir através de você garante proteção com o Seguro Premiável, e você recebe <strong>Cashback mensal recorrente</strong> + <strong>13º Cashback anual</strong> direto em conta!
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <MessageCircle size={18} />
                Compartilhar no WhatsApp
              </button>

              <button 
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all backdrop-blur-md active:scale-95"
              >
                <Share2 size={16} />
                Compartilhar Link
              </button>
            </div>
          </div>
        </div>

        {/* Main Cards: Código & Link Ganha & Ganha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card Principal: Código Ganha & Ganha (G1) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  <Award size={13} />
                  Seu Código G1 Oficial
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível Direto</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">Código Ganha & Ganha</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Informe este código para que o usuário insira diretamente no campo "Código de Indicação" durante o cadastro.
                </p>
              </div>

              {/* Display do Código */}
              <div className="bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center space-y-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Código Pessoal</span>
                <div className="font-mono text-3xl md:text-4xl font-black text-emerald-700 tracking-widest">
                  {referralCode}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button 
                onClick={() => copyToClipboard(referralCode, 'Código Ganha & Ganha')}
                className="w-full inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Copy size={16} />
                Copiar Código Ganha & Ganha
              </button>
            </div>
          </motion.div>

          {/* Card: Link Geral Ganha & Ganha */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-blue/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary-blue border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  <ExternalLink size={13} />
                  Cadastro Automático
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link Geral</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">Link Geral Ganha & Ganha</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Ao abrir por este link, o seu código é preenchido e vinculado automaticamente na conta do indicado.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">URL de Convite</span>
                <p className="font-mono text-sm text-slate-600 font-bold truncate select-all">
                  {inviteUrl}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 space-y-2.5">
              <button 
                onClick={() => copyToClipboard(inviteUrl, 'Link Ganha & Ganha')}
                className="w-full inline-flex items-center justify-center gap-3 bg-primary-blue hover:bg-primary-blue/90 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-blue/20 active:scale-95"
              >
                <Copy size={16} />
                Copiar Link Ganha & Ganha
              </button>
            </div>
          </motion.div>

        </div>

        {/* Dynamic: Como Funciona o Programa Ganha & Ganha */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary-blue text-xs font-black uppercase tracking-widest mb-1">
                <Sparkles size={14} />
                Regras de Bonificação
              </div>
              <h2 className="text-2xl font-black text-midnight tracking-tight italic uppercase">
                Como Funciona o Código Ganha & Ganha
              </h2>
            </div>
            <Link 
              to="/afiliado/rede"
              className="inline-flex items-center gap-2 text-xs font-black text-primary-blue hover:underline uppercase tracking-widest"
            >
              Ver Minha Rede de Cashback
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base mb-4">
                1
              </div>
              <h4 className="font-black text-midnight text-base uppercase mb-2">Você Compartilha</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Envie seu Código ou Link Ganha & Ganha para amigos, familiares e clientes pelas redes sociais ou WhatsApp.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
              <div className="size-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base mb-4">
                2
              </div>
              <h4 className="font-black text-midnight text-base uppercase mb-2">Seu Convidado Ganha</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Ele ativa a cobertura do Seguro de Acidentes MBM, concorre a sorteios semanais de R$ 5.000 e tem Telemedicina 24h.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="size-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base mb-4">
                3
              </div>
              <h4 className="font-black text-midnight text-base uppercase mb-2">Você Ganha Sempre</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Você recebe comissões mensais recorrentes sobre todas as mensalidades ativas (G1 e G2) + bônus de 13º Cashback no final do ano!
              </p>
            </div>
          </div>
        </div>

        {/* Resumo da Rede Vinculada ao Código */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card Indicados G1 */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-sm">
                <Users size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Nível G1 (Diretos)</span>
                <h3 className="text-2xl font-black text-midnight tracking-tight">
                  {stats?.networkSummary?.g1 || 0} <span className="text-sm font-bold text-slate-400">Usuários Cadastrados</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Cadastrados diretamente pelo seu Código Ganha & Ganha
                </p>
              </div>
            </div>
            <Link 
              to="/afiliado/rede"
              className="size-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-colors"
            >
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Card Indicados G2 */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-[2rem] bg-blue-50 text-primary-blue flex items-center justify-center font-black text-xl shadow-sm">
                <TrendingUp size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black text-primary-blue uppercase tracking-widest">Nível G2 (Indiretos)</span>
                <h3 className="text-2xl font-black text-midnight tracking-tight">
                  {stats?.networkSummary?.g2 || 0} <span className="text-sm font-bold text-slate-400">Usuários na Rede</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Indicados pelos seus parceiros diretos
                </p>
              </div>
            </div>
            <Link 
              to="/afiliado/rede"
              className="size-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-primary-blue flex items-center justify-center transition-colors"
            >
              <ArrowRight size={18} />
            </Link>
          </div>

        </div>

      </div>
    </AffiliateLayout>
  );
}
