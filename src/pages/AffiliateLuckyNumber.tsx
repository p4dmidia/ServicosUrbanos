import React from 'react';
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
  ExternalLink
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AffiliateLuckyNumber() {
  const { user } = useAuth();

  // Gerar um número da sorte pseudo-randômico consistente a partir do ID do usuário (6 dígitos)
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

  // Próximo sorteio: realizado nos 4 últimos domingos de cada mês.
  // Em meses que tiverem 5 domingos, desconsidera o primeiro domingo.
  const getNextDrawDate = () => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const getDrawingSundays = (year: number, month: number): Date[] => {
      const sundays: Date[] = [];
      const dateRef = new Date(year, month, 1);
      while (dateRef.getMonth() === month) {
        if (dateRef.getDay() === 0) { // 0 = Domingo
          sundays.push(new Date(dateRef));
        }
        dateRef.setDate(dateRef.getDate() + 1);
      }
      
      // Meses que tiverem 5 domingos desconsidera o primeiro domingo
      if (sundays.length === 5) {
        return sundays.slice(1);
      }
      return sundays;
    };

    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();

    // Busca o primeiro domingo de sorteio válido a partir de hoje
    for (let i = 0; i < 6; i++) {
      const monthSundays = getDrawingSundays(currentYear, currentMonth);
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

    // Fallback para o próximo domingo
    const resultDate = new Date(today);
    const dayOfWeek = today.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
    resultDate.setDate(today.getDate() + daysUntilSunday);
    return resultDate.toLocaleDateString('pt-BR');
  };

  const nextDrawDate = getNextDrawDate();

  return (
    <AffiliateLayout title="Seu Número da Sorte">
      <div className="max-w-4xl mx-auto p-6 md:p-10 lg:p-12 space-y-10">
        
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
                <Ticket size={22} />
              </div>
              Número da Sorte
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-1">
              Sorteios Vida Light R$ 5.000,00 – Informativo Oficial MBM Seguradora
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl">
            <Trophy className="text-amber-600 shrink-0" size={18} />
            <span className="text-xs font-black text-amber-900 uppercase tracking-tight">
              Prêmio: R$ 5.000,00 Bruto
            </span>
          </div>
        </div>

        {/* Cupom / Bilhete Digital Premium */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-midnight to-slate-950 text-white rounded-[2.5rem] p-8 md:p-10 overflow-hidden shadow-2xl shadow-indigo-950/20 border border-indigo-500/10">
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
                <h2 className="text-3xl font-black italic uppercase text-white mt-4 tracking-tight">NÚMERO DA SORTE</h2>
                <p className="text-slate-400 font-medium text-xs">Serviços Urbanos tecnologia Ltda.</p>
              </div>

              <div className="flex flex-wrap gap-8 border-t border-white/10 pt-6">
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
              <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-wider">Número gerado pela MBM SEGURADORA S/A</p>
            </div>

          </div>
        </div>

        {/* 🔔 Informativo Oficial: Sorteios Vida Light */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-[2.5rem] p-8 md:p-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary-blue text-white flex items-center justify-center shadow-md shadow-primary-blue/20">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-midnight tracking-tight uppercase italic">
                🔔 Sorteios Vida Light R$ 5.000,00 – Informativo
              </h3>
              <p className="text-xs text-primary-blue font-black uppercase tracking-widest">
                Regra de Coincidência Exata dos Dígitos
              </p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
            O Número da Sorte do segurado deve coincidir exatamente com o número formado pelos dígitos dos prêmios da extração:
          </p>

          <blockquote className="bg-white/90 border-l-4 border-primary-blue p-4 rounded-2xl text-xs md:text-sm text-slate-800 font-bold italic shadow-xs">
            “O Título será contemplado quando o seu número para sorteio coincidir, da esquerda para a direita, com os dígitos do número formado com os algarismos… da dezena simples e unidade simples do 1º prêmio… e pelas unidades simples do segundo ao quinto prêmio.”
          </blockquote>
        </div>

        {/* 📌 Exemplo Oficial do Documento com Destaque Visual */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📌</span>
              <h3 className="text-base font-black text-midnight uppercase tracking-tight italic">
                Exemplo Oficial do Documento (Composição dos Dígitos)
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Loteria Federal
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Tabela de Extração */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans block mb-1">
                Resultados da Loteria Federal
              </span>

              {/* 1º Prêmio (Dezena e Unidade) */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl">
                <span className="text-slate-700 font-sans font-bold flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  1º Prêmio:
                </span>
                <div className="text-right">
                  <span className="text-slate-400 font-bold">15.9</span>
                  <span className="text-amber-600 font-black text-base bg-amber-200/60 px-1.5 py-0.5 rounded ml-0.5">45</span>
                  <span className="text-[9px] text-amber-700 block font-sans font-black uppercase mt-0.5">Dezena + Unidade</span>
                </div>
              </div>

              {/* 2º Prêmio (Unidade) */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-slate-700 font-sans font-medium flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400"></span>
                  2º Prêmio:
                </span>
                <div className="text-right">
                  <span className="text-slate-400 font-bold">46.72</span>
                  <span className="text-indigo-600 font-black text-base bg-indigo-100 px-1.5 py-0.5 rounded ml-0.5">9</span>
                  <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase">Unidade simples</span>
                </div>
              </div>

              {/* 3º Prêmio (Unidade) */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-slate-700 font-sans font-medium flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400"></span>
                  3º Prêmio:
                </span>
                <div className="text-right">
                  <span className="text-slate-400 font-bold">53.00</span>
                  <span className="text-indigo-600 font-black text-base bg-indigo-100 px-1.5 py-0.5 rounded ml-0.5">8</span>
                  <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase">Unidade simples</span>
                </div>
              </div>

              {/* 4º Prêmio (Unidade) */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-slate-700 font-sans font-medium flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400"></span>
                  4º Prêmio:
                </span>
                <div className="text-right">
                  <span className="text-slate-400 font-bold">40.14</span>
                  <span className="text-indigo-600 font-black text-base bg-indigo-100 px-1.5 py-0.5 rounded ml-0.5">3</span>
                  <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase">Unidade simples</span>
                </div>
              </div>

              {/* 5º Prêmio (Unidade) */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-slate-700 font-sans font-medium flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400"></span>
                  5º Prêmio:
                </span>
                <div className="text-right">
                  <span className="text-slate-400 font-bold">30.12</span>
                  <span className="text-indigo-600 font-black text-base bg-indigo-100 px-1.5 py-0.5 rounded ml-0.5">3</span>
                  <span className="text-[8px] text-indigo-500 block font-sans font-bold uppercase">Unidade simples</span>
                </div>
              </div>
            </div>

            {/* Número Sorteado Final Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-3xl text-white text-center space-y-5 border border-white/10 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                <span>🎯</span> Número Sorteado Final
              </span>
              
              <div className="flex items-center justify-center gap-2 font-mono">
                <span className="size-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  4
                </span>
                <span className="size-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  5
                </span>
                <span className="size-11 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  9
                </span>
                <span className="size-11 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  8
                </span>
                <span className="size-11 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  3
                </span>
                <span className="size-11 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  3
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs text-slate-300 font-medium">
                <p>
                  Resultado final: <strong className="text-amber-300 font-mono text-sm">459.833</strong>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Coincidência da esquerda para a direita com o número da sorte do afiliado.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 📅 Informações Operacionais e Quantidade de Sorteios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Como Funcionam os Sorteios */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-primary-blue">
              <div className="size-10 rounded-2xl bg-primary-blue/10 flex items-center justify-center font-black">
                <Calendar size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Como Funcionam os Sorteios
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Os sorteios acontecem sempre nos <strong>4 últimos domingos de cada mês</strong>, usando os resultados da Loteria Federal. Se o mês tiver 5 domingos, o primeiro é desconsiderado.
            </p>
          </div>

          {/* Quantidade de Sorteios por Plano */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black">
                <Layers size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Quantidade de Sorteios por Plano
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[10px] uppercase">1 Mês</span>
                <span className="text-midnight font-black text-sm">4 sorteios</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[10px] uppercase">3 Meses</span>
                <span className="text-midnight font-black text-sm">12 sorteios</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                <span className="text-slate-400 block text-[10px] uppercase">6 Meses</span>
                <span className="text-midnight font-black text-sm">24 sorteios</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-emerald-800">
                <span className="text-emerald-600 block text-[10px] uppercase">12 Meses</span>
                <span className="font-black text-sm">48 sorteios</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              O segurado concorre durante todo o período contratado, desde que a apólice esteja ativa e adimplente.
            </p>
          </div>

          {/* 🚫 Inadimplência */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Inadimplência
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Se houver atraso no pagamento, o segurado perde o direito de participar dos sorteios até regularizar todas as parcelas.
            </p>
          </div>

          {/* 📣 Resultados e Comunicação */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black">
                <Megaphone size={20} />
              </div>
              <h4 className="font-black text-midnight uppercase text-sm tracking-tight">
                Resultados e Comunicação
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Os resultados ficam disponíveis no site da Caixa Econômica Federal. O ganhador é avisado pela <strong>MBM Seguradora</strong> por e-mail, telefone ou endereço cadastrado.
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
              Valor de <strong>R$ 5.000,00 bruto</strong>, terá o desconto de Imposto de Renda conforme legislação vigente, pago em <strong>até 15 dias</strong> após envio da documentação.
            </p>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
