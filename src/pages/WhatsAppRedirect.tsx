import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WhatsAppRedirect() {
  const { referrerId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);

  const rawCode = referrerId || searchParams.get('ref') || searchParams.get('indicador') || location.pathname.replace('/contato/', '').replace('/whatsapp/', '').trim();
  const cleanCode = (rawCode && rawCode !== 'contato' && rawCode !== 'whatsapp') ? rawCode.trim().toUpperCase() : '';

  const supportPhone = '5571992102042';
  const message = cleanCode 
    ? `Olá! Quero conhecer a CaZa dos Sorteios. Código de indicação: ${cleanCode}`
    : 'Olá! Quero conhecer a CaZa dos Sorteios.';

  const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    // Salvar no sessionStorage para preservar o afiliado caso o lead navegue para o cadastro
    if (cleanCode) {
      try {
        sessionStorage.setItem('urba_referral', cleanCode);
      } catch (e) {}

      // Buscar nome do patrocinador
      const fetchSponsor = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, referral_code')
            .or(`referral_code.eq.${cleanCode},cpf.eq.${cleanCode.replace(/\D/g, '') || 'none'},id.eq.${cleanCode}`)
            .limit(1);

          if (data && data.length > 0) {
            setSponsorName(data[0].full_name);
          }
        } catch (e) {}
      };
      fetchSponsor();
    }
  }, [cleanCode]);

  useEffect(() => {
    // Redirecionamento automático suave após contagem regressiva
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = whatsappUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [whatsappUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1528] via-[#0F224A] to-[#0A3275] flex items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-blue/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl text-center space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src="/logo-caza.png" 
            alt="CaZa dos Sorteios" 
            className="h-14 sm:h-16 object-contain drop-shadow-md"
            onError={(e) => {
              // Fallback para texto caso a imagem não carregue
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
          <MessageCircle size={14} className="animate-pulse" />
          Atendimento Oficial WhatsApp
        </div>

        <div>
          <h1 className="text-2xl font-black italic tracking-tight uppercase">
            Conectando ao WhatsApp
          </h1>
          <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
            Você está sendo redirecionado para a nossa equipe oficial no WhatsApp.
          </p>
        </div>

        {/* Card do Código de Indicação */}
        {cleanCode && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              Indicação Registrada
            </span>
            <p className="text-sm font-black text-emerald-400 font-mono tracking-wider">
              {cleanCode} {sponsorName ? `• ${sponsorName}` : ''}
            </p>
            <p className="text-[10px] text-slate-400">
              Seus benefícios e cashback já estão vinculados a este código.
            </p>
          </div>
        )}

        {/* Botão de Ação Imediata */}
        <div className="space-y-3 pt-2">
          <a
            href={whatsappUrl}
            className="w-full inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#25D366]/30 active:scale-95"
          >
            <MessageCircle size={18} />
            Abrir WhatsApp Agora {countdown > 0 ? `(${countdown}s)` : ''}
          </a>

          <Link
            to={cleanCode ? `/cadastro?ref=${cleanCode}` : '/cadastro'}
            className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all"
          >
            Fazer Cadastro Direto no Site
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            Atendimento Seguro &bull; CaZa dos Sorteios
          </p>
        </div>
      </div>
    </div>
  );
}
