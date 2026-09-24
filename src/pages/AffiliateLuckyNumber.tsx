import React, { useState, useMemo } from 'react';
import { 
  Ticket, 
  Calendar, 
  Trophy, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Bell, 
  Layers, 
  AlertTriangle, 
  Megaphone, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Clock,
  ShieldCheck,
  Check,
  Search,
  RefreshCw,
  Dices,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AffiliateLuckyNumber() {
  const { user, profile } = useAuth();

  // O número da sorte oficial é definido e emitido diretamente pela MBM Seguradora.
  const luckyNumber = useMemo(() => {
    if ((profile as any)?.lucky_number) return (profile as any).lucky_number;
    if (profile?.description) {
      const match = profile.description.match(/\[MBM_LUCKY_NUMBER:([^\]]+)\]/);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }, [profile]);

  // Certificado e Apólice da MBM
  const mbmCertificate = useMemo(() => {
    let cert = (profile as any)?.certificate_number || null;
    let policy = (profile as any)?.policy_number || '11-0982-000058940-0001';
    if (profile?.description) {
      const certMatch = profile.description.match(/\[MBM_CERTIFICATE:([^\]]+)\]/);
      if (certMatch && certMatch[1]) cert = certMatch[1].trim();
      const policyMatch = profile.description.match(/\[MBM_POLICY:([^\]]+)\]/);
      if (policyMatch && policyMatch[1]) policy = policyMatch[1].trim();
    }
    return { cert, policy };
  }, [profile]);

  // Data de adesão / início da assinatura do segurado
  const userJoinDate = useMemo(() => {
    if (profile?.created_at) {
      return new Date(profile.created_at);
    }
    return new Date(); // Fallback para data atual
  }, [profile]);

  // Função para obter os 4 domingos válidos de sorteio para qualquer ano/mês
  // REGRA MBM: Em meses com 5 domingos, desconsidera o primeiro domingo.
  const getDrawingSundaysForMonth = (year: number, month: number): Date[] => {
    const sundays: Date[] = [];
    const dateRef = new Date(year, month, 1);
    while (dateRef.getMonth() === month) {
      if (dateRef.getDay() === 0) { // 0 = Domingo
        sundays.push(new Date(dateRef));
      }
      dateRef.setDate(dateRef.getDate() + 1);
    }
    
    // Meses com 5 domingos desconsideram o 1º domingo (concorrem nos 4 últimos)
    if (sundays.length === 5) {
      return sundays.slice(1);
    }
    return sundays;
  };

  // Cálculo do Ciclo MBM & Linha do Tempo de Elegibilidade
  // Regra: Fechamento com a MBM todo dia 20.
  // Adesões de 21/M a 20/(M+1) -> Fecham em 20/(M+1) -> Bilhete emitido no início de (M+2) -> Concorre a partir do 1º domingo de (M+2).
  const mbmSchedule = useMemo(() => {
    const joinDate = new Date(userJoinDate);
    const day = joinDate.getDate();
    const month = joinDate.getMonth();
    const year = joinDate.getFullYear();

    let batchClosingDate: Date;
    let issuanceMonth: number;
    let issuanceYear: number;
    let competitionMonth: number;
    let competitionYear: number;

    if (day <= 20) {
      // Entrou até dia 20 do mês M -> Fecha dia 20 do mês M
      batchClosingDate = new Date(year, month, 20);
      
      issuanceMonth = month + 1;
      issuanceYear = year;
      if (issuanceMonth > 11) {
        issuanceMonth = 0;
        issuanceYear++;
      }

      competitionMonth = issuanceMonth;
      competitionYear = issuanceYear;
    } else {
      // Entrou a partir do dia 21 do mês M -> Fecha dia 20 do mês M+1
      let closingMonth = month + 1;
      let closingYear = year;
      if (closingMonth > 11) {
        closingMonth = 0;
        closingYear++;
      }
      batchClosingDate = new Date(closingYear, closingMonth, 20);

      // Emissão e concorrência no mês M+2
      issuanceMonth = closingMonth + 1;
      issuanceYear = closingYear;
      if (issuanceMonth > 11) {
        issuanceMonth = 0;
        issuanceYear++;
      }

      competitionMonth = issuanceMonth;
      competitionYear = issuanceYear;
    }

    // Primeiro sorteio elegível no mês de concorrência (respeitando regra dos 5 domingos)
    const competitionSundays = getDrawingSundaysForMonth(competitionYear, competitionMonth);
    const firstEligibleDraw = competitionSundays.length > 0 ? competitionSundays[0] : null;

    // Próximos sorteios do ciclo
    const allDrawsFormatted = competitionSundays.map(d => d.toLocaleDateString('pt-BR'));

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Status do ciclo do usuário
    let currentStep = 1;
    if (todayZero > batchClosingDate) {
      currentStep = 2;
    }
    const issuanceStartDate = new Date(issuanceYear, issuanceMonth, 1);
    if (todayZero >= issuanceStartDate) {
      currentStep = 3;
    }
    if (firstEligibleDraw && todayZero >= firstEligibleDraw) {
      currentStep = 4;
    }

    return {
      joinDateFormatted: joinDate.toLocaleDateString('pt-BR'),
      batchClosingFormatted: batchClosingDate.toLocaleDateString('pt-BR'),
      issuanceMonthLabel: `${monthNames[issuanceMonth]} de ${issuanceYear}`,
      firstDrawFormatted: firstEligibleDraw ? firstEligibleDraw.toLocaleDateString('pt-BR') : 'A definir',
      competitionSundaysFormatted: allDrawsFormatted,
      currentStep,
      isCompetingNow: currentStep === 4,
      totalSundaysInMonth: new Date(competitionYear, competitionMonth + 1, 0).getDate() // aux
    };
  }, [userJoinDate]);

  // Próximo sorteio geral válido
  const nextGeneralDrawDate = useMemo(() => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();

    for (let i = 0; i < 6; i++) {
      const monthSundays = getDrawingSundaysForMonth(currentYear, currentMonth);
      const validSundays = monthSundays.filter(sun => {
        const sunZero = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate());
        return sunZero >= todayZero;
      });

      if (validSundays.length > 0) {
        return validSundays[0].toLocaleDateString('pt-BR');
      }

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    return 'Em breve';
  }, []);

  // Estados para o Simulador / Conferência Interativa de Sorteio
  const [activeTab, setActiveTab] = useState<'oficial' | 'simulador'>('oficial');
  const [selectedDrawDate, setSelectedDrawDate] = useState('20/09/2026');

  // Prêmios Oficiais da Extração (Exemplo Real da Loteria Federal)
  const [prizes, setPrizes] = useState({
    p1: '15945', // 1º Prêmio -> Dezena e Unidade: 45
    p2: '46729', // 2º Prêmio -> Unidade: 9
    p3: '53008', // 3º Prêmio -> Unidade: 8
    p4: '40143', // 4º Prêmio -> Unidade: 3
    p5: '30123'  // 5º Prêmio -> Unidade: 3
  });

  // Cálculo da extração automática dos 6 dígitos do Número da Sorte
  const calculatedDrawnNumber = useMemo(() => {
    const clean = (val: string) => (val || '').replace(/\D/g, '');
    const p1 = clean(prizes.p1);
    const p2 = clean(prizes.p2);
    const p3 = clean(prizes.p3);
    const p4 = clean(prizes.p4);
    const p5 = clean(prizes.p5);

    // 1º Prêmio: pega a dezena e unidade (os 2 últimos dígitos)
    const d1 = p1.length >= 2 ? p1.slice(-2) : p1.padStart(2, '0');
    // 2º ao 5º Prêmio: pega a unidade simples (último dígito)
    const d2 = p2.length >= 1 ? p2.slice(-1) : '0';
    const d3 = p3.length >= 1 ? p3.slice(-1) : '0';
    const d4 = p4.length >= 1 ? p4.slice(-1) : '0';
    const d5 = p5.length >= 1 ? p5.slice(-1) : '0';

    const fullNumber = `${d1}${d2}${d3}${d4}${d5}`;
    const formattedNumber = `${d1}${d2}.${d3}${d4}${d5}`;

    return {
      d1,
      d2,
      d3,
      d4,
      d5,
      fullNumber,
      formattedNumber,
      digits: [d1[0] || '0', d1[1] || '0', d2, d3, d4, d5]
    };
  }, [prizes]);

  // Checagem de contemplação
  const isWinner = useMemo(() => {
    if (!luckyNumber) return false;
    const cleanUserLucky = String(luckyNumber).replace(/\D/g, '');
    return cleanUserLucky === calculatedDrawnNumber.fullNumber;
  }, [luckyNumber, calculatedDrawnNumber]);

  return (
    <AffiliateLayout title="Seu Número da Sorte">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 space-y-8 pb-20">
        
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-11 bg-primary-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
                <Ticket size={24} />
              </div>
              Número da Sorte
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-1">
              Sorteios Semanais Vida Light R$ 5.000,00 – Parceria Oficial MBM Seguradora S/A
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl shadow-xs">
            <Trophy className="text-amber-600 shrink-0" size={20} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block leading-tight">
                Prêmio por Sorteio
              </span>
              <span className="text-sm font-black text-amber-950 font-mono">
                R$ 5.000,00 Bruto
              </span>
            </div>
          </div>
        </div>

        {/* Cupom / Bilhete Digital Premium */}
        <div className="relative bg-gradient-to-br from-indigo-950 via-midnight to-slate-950 text-white rounded-[2.5rem] p-8 md:p-10 overflow-hidden shadow-2xl shadow-indigo-950/20 border border-indigo-500/20">
          {/* Efeitos de Fundo */}
          <div className="absolute top-[-30%] right-[-15%] w-[450px] h-[450px] bg-primary-blue/25 rounded-full blur-[110px] pointer-events-none animate-pulse"></div>
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 size-10 bg-[#F8FAFC] rounded-full z-20 hidden md:block border-r border-indigo-900/30"></div>
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 size-10 bg-[#F8FAFC] rounded-full z-20 hidden md:block border-l border-indigo-900/30"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-center">
            
            {/* Esquerda: Detalhes do Bilhete */}
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 w-fit ${
                    luckyNumber 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    <Sparkles size={12} />
                    {luckyNumber ? 'Bilhete Ativo na Seguradora' : 'Aguardando Emissão MBM'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Apólice: {mbmCertificate.policy} {mbmCertificate.cert ? `• Certificado #${mbmCertificate.cert}` : ''}
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white mt-3.5 tracking-tight">
                  NÚMERO DA SORTE
                </h2>
                <p className="text-slate-400 font-medium text-xs">
                  Serviços Urbanos Intermediação & Tecnologia Ltda.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-white/10 pt-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                    Próximo Sorteio Geral
                  </p>
                  <p className="text-sm font-black flex items-center gap-1.5 text-white">
                    <Calendar size={15} className="text-primary-blue" />
                    {nextGeneralDrawDate}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                    1º Sorteio Elegível
                  </p>
                  <p className="text-sm font-black flex items-center gap-1.5 text-indigo-300">
                    <Clock size={15} />
                    {mbmSchedule.firstDrawFormatted}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                    Premiação Principal
                  </p>
                  <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                    <Trophy size={15} />
                    R$ 5.000,00
                  </p>
                </div>
              </div>
            </div>

            {/* Linha Divisória de Cupom em MD+ */}
            <div className="hidden md:block h-36 border-l-2 border-dashed border-white/20 mx-4"></div>

            {/* Direita: O Número da Sorte ou Status */}
            <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 min-w-[280px] max-w-sm text-center shadow-inner">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-3">
                {luckyNumber ? 'Seu Número Oficial de Sorteio' : 'Status do Seu Bilhete'}
              </span>

              {luckyNumber ? (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                  className="text-4xl lg:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 font-mono my-2"
                >
                  {luckyNumber}
                </motion.div>
              ) : (
                <div className="space-y-2 py-2">
                  <span className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-tight block leading-snug">
                    Lote em Processamento
                  </span>
                  <span className="text-[11px] text-slate-300 block font-medium leading-relaxed">
                    Seu bilhete será liberado pela MBM no início de <strong>{mbmSchedule.issuanceMonthLabel}</strong>.
                  </span>
                </div>
              )}

              <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                {luckyNumber ? 'Emitido pela MBM SEGURADORA S/A' : 'Fechamento Oficial dia 20 de cada mês'}
              </p>
            </div>

          </div>
        </div>

        {/* 🗓️ LINHA DO TEMPO: Cronograma Oficial de Fechamento MBM e Elegibilidade */}
        <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-midnight uppercase tracking-tight italic">
                  Cronograma de Vigência & Início dos Sorteios MBM
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regra oficial de fechamento no dia 20 e início de concorrência
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
              Fechamento: Todo dia 20
            </span>
          </div>

          {/* Cards de Etapas do Ciclo (Timeline) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Etapa 1: Adesão */}
            <div className={`p-5 rounded-2xl border transition-all ${
              mbmSchedule.currentStep >= 1 
                ? 'bg-slate-50/80 border-slate-200' 
                : 'bg-slate-50/40 border-slate-100 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="size-7 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Realizado
                </span>
              </div>
              <h4 className="font-black text-midnight text-xs uppercase tracking-tight">
                Sua Adesão ao Plano
              </h4>
              <p className="font-mono text-xs font-bold text-slate-700 mt-1">
                {mbmSchedule.joinDateFormatted}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Data em que sua assinatura foi confirmada no sistema.
              </p>
            </div>

            {/* Etapa 2: Fechamento com a MBM */}
            <div className={`p-5 rounded-2xl border transition-all ${
              mbmSchedule.currentStep >= 2 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`size-7 rounded-xl font-black text-xs flex items-center justify-center ${
                  mbmSchedule.currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  2
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  mbmSchedule.currentStep >= 2 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {mbmSchedule.currentStep >= 2 ? 'Concluído' : 'Próximo Lote'}
                </span>
              </div>
              <h4 className="font-black text-midnight text-xs uppercase tracking-tight">
                Fechamento do Lote MBM
              </h4>
              <p className="font-mono text-xs font-bold text-indigo-700 mt-1">
                {mbmSchedule.batchClosingFormatted}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Envio do lote de segurados cadastrados para emissão da apólice.
              </p>
            </div>

            {/* Etapa 3: Emissão do Número da Sorte */}
            <div className={`p-5 rounded-2xl border transition-all ${
              mbmSchedule.currentStep >= 3 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`size-7 rounded-xl font-black text-xs flex items-center justify-center ${
                  mbmSchedule.currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  3
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  luckyNumber ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {luckyNumber ? 'Emitido' : 'Início do Mês'}
                </span>
              </div>
              <h4 className="font-black text-midnight text-xs uppercase tracking-tight">
                Emissão do Número
              </h4>
              <p className="font-mono text-xs font-bold text-slate-800 mt-1">
                Início de {mbmSchedule.issuanceMonthLabel}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                A MBM gera e atribui o seu bilhete eletrônico exclusivo.
              </p>
            </div>

            {/* Etapa 4: Início dos Sorteios */}
            <div className={`p-5 rounded-2xl border transition-all ${
              mbmSchedule.currentStep >= 4 
                ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`size-7 rounded-xl font-black text-xs flex items-center justify-center ${
                  mbmSchedule.currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  4
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  mbmSchedule.currentStep >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {mbmSchedule.currentStep >= 4 ? 'Concorrendo' : 'Data de Início'}
                </span>
              </div>
              <h4 className="font-black text-midnight text-xs uppercase tracking-tight">
                1º Sorteio Concorrido
              </h4>
              <p className="font-mono text-xs font-black text-emerald-700 mt-1">
                {mbmSchedule.firstDrawFormatted}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Concorre a todos os 4 sorteios mensais da Loteria Federal.
              </p>
            </div>

          </div>

          {/* Destaque Didático com Exemplo Oficial */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-start gap-3.5 text-xs text-slate-600">
            <Info size={20} className="text-primary-blue shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-midnight block">
                Como funciona a regra do fechamento dia 20:
              </span>
              <p className="leading-relaxed">
                Adesões realizadas entre <strong>21/09 e 20/10</strong> têm fechamento de lote em <strong>20/10</strong>, recebem o número da sorte no início de novembro e começam a concorrer no sorteio de <strong>08/11/2026</strong>. O mesmo fluxo se repete sucessivamente nos meses seguintes.
              </p>
            </div>
          </div>
        </div>

        {/* 🎲 PAINEL INTERATIVO DE EXTRAÇÃO & CONFERÊNCIA DOS PRÊMIOS */}
        <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Dices size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-midnight uppercase tracking-tight italic flex items-center gap-2">
                  <span>Conferência de Sorteio & Composição dos Dígitos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extração oficial da Loteria Federal (Dezena/Unidade do 1º + Unidades do 2º ao 5º prêmio)
                </p>
              </div>
            </div>

            {/* Seletor de Modo */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab('oficial');
                  setPrizes({
                    p1: '15945',
                    p2: '46729',
                    p3: '53008',
                    p4: '40143',
                    p5: '30123'
                  });
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'oficial'
                    ? 'bg-white text-midnight shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Exemplo Oficial (20/09)
              </button>
              <button
                onClick={() => setActiveTab('simulador')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'simulador'
                    ? 'bg-white text-primary-blue shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Simular Resultados
              </button>
            </div>
          </div>

          {/* Grid de Extração */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Tabela dos 5 Prêmios (7 Colunas) */}
            <div className="lg:col-span-7 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans px-1">
                <span>Resultados dos 5 Prêmios da Loteria Federal</span>
                <span>Dígito Extraído</span>
              </div>

              {/* 1º Prêmio */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-bold text-slate-800">
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  <span>1º Prêmio:</span>
                </div>
                {activeTab === 'simulador' ? (
                  <input
                    type="text"
                    maxLength={5}
                    value={prizes.p1}
                    onChange={(e) => setPrizes(prev => ({ ...prev, p1: e.target.value }))}
                    className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 font-mono font-bold text-right text-midnight w-24 text-sm"
                  />
                ) : (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold">15.9</span>
                    <span className="text-amber-700 font-black text-base bg-amber-200/80 px-2 py-0.5 rounded-lg ml-1 shadow-xs">
                      {calculatedDrawnNumber.d1}
                    </span>
                    <span className="text-[9px] text-amber-700 block font-sans font-black uppercase mt-0.5">
                      Dezena + Unidade
                    </span>
                  </div>
                )}
              </div>

              {/* 2º Prêmio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-medium text-slate-700">
                  <span className="size-2 rounded-full bg-indigo-500"></span>
                  <span>2º Prêmio:</span>
                </div>
                {activeTab === 'simulador' ? (
                  <input
                    type="text"
                    maxLength={5}
                    value={prizes.p2}
                    onChange={(e) => setPrizes(prev => ({ ...prev, p2: e.target.value }))}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 font-mono font-bold text-right text-midnight w-24 text-sm"
                  />
                ) : (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold">46.72</span>
                    <span className="text-indigo-700 font-black text-base bg-indigo-100 px-2 py-0.5 rounded-lg ml-1">
                      {calculatedDrawnNumber.d2}
                    </span>
                    <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase mt-0.5">
                      Unidade simples
                    </span>
                  </div>
                )}
              </div>

              {/* 3º Prêmio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-medium text-slate-700">
                  <span className="size-2 rounded-full bg-indigo-500"></span>
                  <span>3º Prêmio:</span>
                </div>
                {activeTab === 'simulador' ? (
                  <input
                    type="text"
                    maxLength={5}
                    value={prizes.p3}
                    onChange={(e) => setPrizes(prev => ({ ...prev, p3: e.target.value }))}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 font-mono font-bold text-right text-midnight w-24 text-sm"
                  />
                ) : (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold">53.00</span>
                    <span className="text-indigo-700 font-black text-base bg-indigo-100 px-2 py-0.5 rounded-lg ml-1">
                      {calculatedDrawnNumber.d3}
                    </span>
                    <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase mt-0.5">
                      Unidade simples
                    </span>
                  </div>
                )}
              </div>

              {/* 4º Prêmio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-medium text-slate-700">
                  <span className="size-2 rounded-full bg-indigo-500"></span>
                  <span>4º Prêmio:</span>
                </div>
                {activeTab === 'simulador' ? (
                  <input
                    type="text"
                    maxLength={5}
                    value={prizes.p4}
                    onChange={(e) => setPrizes(prev => ({ ...prev, p4: e.target.value }))}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 font-mono font-bold text-right text-midnight w-24 text-sm"
                  />
                ) : (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold">40.14</span>
                    <span className="text-indigo-700 font-black text-base bg-indigo-100 px-2 py-0.5 rounded-lg ml-1">
                      {calculatedDrawnNumber.d4}
                    </span>
                    <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase mt-0.5">
                      Unidade simples
                    </span>
                  </div>
                )}
              </div>

              {/* 5º Prêmio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2 font-sans font-medium text-slate-700">
                  <span className="size-2 rounded-full bg-indigo-500"></span>
                  <span>5º Prêmio:</span>
                </div>
                {activeTab === 'simulador' ? (
                  <input
                    type="text"
                    maxLength={5}
                    value={prizes.p5}
                    onChange={(e) => setPrizes(prev => ({ ...prev, p5: e.target.value }))}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 font-mono font-bold text-right text-midnight w-24 text-sm"
                  />
                ) : (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold">30.12</span>
                    <span className="text-indigo-700 font-black text-base bg-indigo-100 px-2 py-0.5 rounded-lg ml-1">
                      {calculatedDrawnNumber.d5}
                    </span>
                    <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase mt-0.5">
                      Unidade simples
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Número Sorteado Final Card (5 Colunas) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-midnight p-7 rounded-3xl text-white text-center space-y-5 border border-white/10 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                <span>🎯</span> Número Sorteado Final
              </span>
              
              {/* Dígitos Visuais */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono">
                {calculatedDrawnNumber.digits.map((digit, idx) => (
                  <span 
                    key={idx}
                    className={`size-10 sm:size-11 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center shadow-lg ${
                      idx < 2 
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' 
                        : 'bg-indigo-600 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {digit}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 text-xs text-slate-300 font-medium space-y-1">
                <p>
                  Resultado apurado: <strong className="text-amber-300 font-mono text-base">{calculatedDrawnNumber.formattedNumber}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  Coincidência da esquerda para a direita com o bilhete oficial MBM.
                </p>
              </div>

              {/* Status de Conferência com o Usuário */}
              <div className="pt-3 border-t border-white/10">
                {luckyNumber ? (
                  isWinner ? (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                      <Trophy size={18} className="text-emerald-400" />
                      <span>PARABÉNS! Seu bilhete foi contemplado!</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 text-xs">
                      Seu bilhete: <strong className="font-mono text-amber-300">{luckyNumber}</strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Não contemplado nesta extração. Você continua concorrendo!
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-300 text-xs font-medium">
                    Seu bilhete estará ativo a partir de <strong>{mbmSchedule.firstDrawFormatted}</strong>.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 📅 Informações Operacionais e Quantidade de Sorteios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Como Funcionam os Sorteios */}
          <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-7 md:p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-primary-blue">
              <div className="size-10 rounded-2xl bg-primary-blue/10 flex items-center justify-center font-black">
                <Calendar size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Como Funcionam os Sorteios Semanais
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Os sorteios acontecem sempre nos <strong>4 últimos domingos de cada mês</strong>, utilizando a extração oficial da Loteria Federal. Se o mês tiver 5 domingos, o primeiro é desconsiderado automaticamente.
            </p>
          </div>

          {/* Quantidade de Sorteios por Plano */}
          <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-7 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black">
                <Layers size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Quantidade de Sorteios Concorridos
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[9px] uppercase">1 Mês</span>
                <span className="text-midnight font-black text-sm">4 sorteios</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[9px] uppercase">3 Meses</span>
                <span className="text-midnight font-black text-sm">12 sorteios</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[9px] uppercase">6 Meses</span>
                <span className="text-midnight font-black text-sm">24 sorteios</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-emerald-800">
                <span className="text-emerald-600 block text-[9px] uppercase">12 Meses (Anual)</span>
                <span className="font-black text-sm">48 sorteios anuais</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              O segurado concorre durante toda a vigência contratada com o plano ativo e adimplente.
            </p>
          </div>

          {/* 🚫 Inadimplência */}
          <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-7 md:p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Regra de Inadimplência
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Em caso de atraso na renovação ou pagamento, o segurado deixa temporariamente de participar dos sorteios semanais até a regularização da assinatura.
            </p>
          </div>

          {/* 📣 Resultados e Comunicação */}
          <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-7 md:p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black">
                <Megaphone size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Resultados & Notificação de Ganhadores
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Os resultados oficiais são auditados pela Caixa Econômica Federal. Havendo contemplação, a <strong>MBM Seguradora</strong> entra em contato por e-mail e telefone cadastrados.
            </p>
          </div>

        </div>

        {/* 💰 Prêmio e Liquidação */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 text-emerald-950">
          <div className="size-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <DollarSign size={32} />
          </div>
          <div className="space-y-1.5 flex-1 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Premiação em Dinheiro
            </span>
            <h4 className="text-2xl font-black tracking-tight text-emerald-900 mt-2">
              Prêmio de R$ 5.000,00 Bruto
            </h4>
            <p className="text-xs md:text-sm text-emerald-800 leading-relaxed font-medium">
              Valor de <strong>R$ 5.000,00 bruto</strong> (com dedução de IR conforme legislação federal), pago diretamente ao segurado contemplado em <strong>até 15 dias úteis</strong> após validação dos documentos pela MBM.
            </p>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
