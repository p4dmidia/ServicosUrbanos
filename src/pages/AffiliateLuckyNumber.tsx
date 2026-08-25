import React from 'react';
import { Ticket, Calendar, Trophy, AlertCircle, Info, Sparkles } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AffiliateLuckyNumber() {
  const { user } = useAuth();

  // Gerar um número da sorte pseudo-randômico consistente a partir do ID do usuário
  const getLuckyNumber = (userId: string) => {
    if (!userId) return '000.000';
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const num = Math.abs(hash % 999999).toString().padStart(6, '0');
    return `${num.slice(0, 3)}.${num.slice(3, 6)}`;
  };

  const luckyNumber = getLuckyNumber(user?.id || '');

  // Próximo sábado
  const getNextSaturdayDate = () => {
    const today = new Date();
    const resultDate = new Date(today.getTime());
    resultDate.setDate(today.getDate() + (6 + 7 - today.getDay()) % 7);
    if (resultDate.toDateString() === today.toDateString()) {
      resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate.toLocaleDateString('pt-BR');
  };

  const nextDrawDate = getNextSaturdayDate();

  return (
    <AffiliateLayout title="Seu Número da Sorte">
      <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
            <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
              <Ticket size={22} />
            </div>
            Número da Sorte
          </h1>
          <p className="text-slate-500 font-medium mt-1">Concorra a prêmios mensais e semanais baseados na Loteria Federal.</p>
        </div>

        {/* Cupom / Bilhete Digital Premium */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-midnight to-slate-950 text-white rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-indigo-950/20 border border-indigo-500/10">
          {/* Decorações do Bilhete */}
          <div className="absolute top-[-40%] right-[-20%] w-[400px] h-[400px] bg-primary-blue/30 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 size-10 bg-[#F8FAFC] rounded-full z-20 hidden md:block"></div>
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 size-10 bg-[#F8FAFC] rounded-full z-20 hidden md:block"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-center">
            
            {/* Esquerda: Detalhes do Bilhete */}
            <div className="space-y-6">
              <div>
                <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 w-fit">
                  <Sparkles size={12} />
                  Bilhete Ativo
                </span>
                <h2 className="text-3xl font-black italic uppercase text-white mt-4 tracking-tight">CUPOM DA SORTE</h2>
                <p className="text-slate-400 font-medium text-xs">Ecosystem Services Urbanos S.A.</p>
              </div>

              <div className="flex gap-8 border-t border-white/10 pt-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Próximo Sorteio</p>
                  <p className="text-sm font-black flex items-center gap-2">
                    <Calendar size={16} className="text-primary-blue" />
                    {nextDrawDate}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Prêmio Principal</p>
                  <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                    <Trophy size={16} />
                    R$ 5.000,00
                  </p>
                </div>
              </div>
            </div>

            {/* Linha Divisória de Cupom em MD+ */}
            <div className="hidden md:block h-32 border-l-2 border-dashed border-white/20 mx-4"></div>

            {/* Direita: O Número da Sorte Gigante */}
            <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-8 min-w-[240px] text-center">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-3">Seu Número Exclusivo</span>
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                className="text-4xl lg:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 font-mono"
              >
                {luckyNumber}
              </motion.div>
              <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-wider">Número gerado eletronicamente</p>
            </div>

          </div>
        </div>

        {/* Como Funciona */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic flex items-center gap-2">
            <Info size={20} className="text-primary-blue" />
            Regras de Participação
          </h3>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
            <div className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-midnight shrink-0">1</div>
              <div>
                <h4 className="font-black text-midnight mb-1 uppercase text-xs tracking-wider">Como concorrer?</h4>
                <p className="text-xs">Para manter seu bilhete ativo para os sorteios semanais e mensais, você só precisa manter sua assinatura mensal de licenciado em dia. Bilhetes de afiliados suspensos ou inadimplentes são desconsiderados no sorteio.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-midnight shrink-0">2</div>
              <div>
                <h4 className="font-black text-midnight mb-1 uppercase text-xs tracking-wider">Como é feito o sorteio?</h4>
                <p className="text-xs">O sorteio baseia-se nos números oficiais extraídos do primeiro prêmio da Loteria Federal efetuada no último sábado de cada ciclo de premiação. Caso o número exato não tenha correspondência ativa, o algoritmo de aproximação estabelecido no regulamento definirá o ganhador.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-midnight shrink-0">3</div>
              <div>
                <h4 className="font-black text-midnight mb-1 uppercase text-xs tracking-wider">Recebimento do Prêmio</h4>
                <p className="text-xs">Os vencedores são notificados diretamente no painel e via e-mail corporativo. O valor correspondente à premiação é depositado diretamente em saldo líquido no financeiro da conta do afiliado em até 48 horas úteis após o sorteio.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Central de Ajuda */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex items-start gap-5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-midnight text-sm uppercase">Nota Fiscal e Regulamentação</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A promoção comercial "Cupom da Sorte" é vinculada ao plano de incentivo comercial do ecossistema e atende a toda a legislação federal de distribuição gratuita de prêmios vigente no Brasil.
            </p>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
