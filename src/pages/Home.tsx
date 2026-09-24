import {
  LayoutGrid,
  ExternalLink,
  TrendingUp,
  Globe,
  Twitter,
  Linkedin,
  Instagram,
  Smartphone,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Gift,
  Activity,
  Users2,
  Heart,
  Award,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Ticket,
  PiggyBank,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-midnight text-slate-100 overflow-x-hidden">
      <Header />
      <PWAInstallPrompt />

      <main className="flex-grow">
        {/* HERO SECTION - Balanced Reference Banner Layout */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#061e5e] via-[#051747] to-midnight pt-8 pb-0 sm:pt-12 sm:pb-0 lg:py-16 border-b border-white/10">
          {/* Ambient Glows & Circular Orbs (matching brand identity) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 left-1/3 size-[500px] bg-primary-blue/30 rounded-full blur-[140px]"></div>
            <div className="absolute top-1/3 -right-20 size-[450px] bg-accent/20 rounded-full blur-[130px]"></div>
            <div className="absolute -bottom-20 left-10 size-[400px] bg-[#0756DB]/25 rounded-full blur-[120px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end lg:items-center lg:min-h-[580px]">
              
              {/* Left Column - Perfectly Proportioned Copy & CTAs */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:col-span-6 flex flex-col gap-5 text-left z-20 pt-2 pb-4 lg:py-4"
              >
                {/* Brand Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider w-fit">
                  <Award size={14} className="text-accent" />
                  <span>CaZa dos Sorteios</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.9rem] font-black text-white leading-[1.12] tracking-tight">
                  Concorra a <br />
                  <span className="text-accent drop-shadow-[0_0_20px_rgba(25,203,133,0.4)]">
                    prêmios incríveis
                  </span> <br />
                  e aproveite diversos benefícios!
                </h1>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-base text-slate-200 max-w-lg leading-relaxed font-medium">
                  A união perfeita entre proteção pessoal, sorteios oficiais pela Loteria Federal, telemedicina 24/7 e construção de renda recorrente com indicação.
                </p>

                {/* 5 Icons Row from Reference */}
                <div className="flex items-center gap-3 sm:gap-5 py-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-sm">
                      <Ticket size={18} className="text-accent" />
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold tracking-tight">Sorteios</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-sm">
                      <ShieldCheck size={18} className="text-accent" />
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold tracking-tight">Proteção</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-sm">
                      <Heart size={18} className="text-accent" />
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold tracking-tight">Saúde</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-sm">
                      <PiggyBank size={18} className="text-accent" />
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold tracking-tight">Benefícios</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-sm">
                      <Star size={18} className="text-accent" />
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold tracking-tight">Oportunidades</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/cadastro"
                    className="bg-accent hover:bg-emerald-400 text-midnight px-8 py-4 rounded-2xl text-base sm:text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/30 flex items-center gap-2 group"
                  >
                    <span>Participe agora!</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <a
                    href="#detalhes"
                    className="bg-white/10 hover:bg-white/15 text-white px-7 py-4 rounded-2xl text-base font-bold transition-all border border-white/10 hover:border-white/25 flex items-center gap-2"
                  >
                    Conhecer Benefícios
                  </a>
                </div>
              </motion.div>

              {/* Right Column - Gentleman Visual Image in Harmony with Background */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="lg:col-span-6 relative flex items-end justify-center lg:justify-end self-stretch mt-6 sm:mt-8 lg:mt-0 -mx-2 sm:mx-0 overflow-visible"
              >
                {/* Background aura behind the man */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="size-[340px] sm:size-[480px] lg:size-[680px] bg-gradient-to-tr from-primary-blue/50 via-accent/25 to-transparent rounded-full blur-[90px] sm:blur-[110px]"></div>
                </div>

                {/* Slogan Badge Callout next to image */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="hidden md:flex flex-col absolute top-0 left-0 lg:-left-6 z-30 bg-midnight/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-xl transform -rotate-3"
                >
                  <p className="font-extrabold italic text-sm text-white">
                    Aqui você ganha <br />
                    <span className="text-accent">toda hora!</span>
                  </p>
                </motion.div>

                {/* Sorteio Badge */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="hidden sm:flex items-center gap-2.5 absolute bottom-2 left-0 lg:-left-2 z-30 bg-midnight/85 backdrop-blur-md border border-accent/30 px-3.5 py-2 rounded-2xl shadow-xl"
                >
                  <div className="size-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                    <Gift size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Loteria Federal</p>
                    <p className="text-xs font-black text-white">R$ 5.000 / semana</p>
                  </div>
                </motion.div>

                {/* Hero Illustration - Optically centered on mobile and expanded on desktop */}
                <div className="relative z-10 w-full flex justify-center lg:justify-end items-end overflow-visible">
                  <img
                    src="/hero-person.png"
                    alt="CaZa dos Sorteios"
                    className="w-[125%] sm:w-[110%] max-w-[500px] sm:max-w-[540px] lg:max-w-none lg:w-[138%] xl:w-[148%] 2xl:w-[155%] h-auto object-contain object-bottom drop-shadow-[0_20px_50px_rgba(3,29,110,0.65)] transform -translate-x-6 sm:-translate-x-4 lg:translate-x-8 lg:-translate-y-2 block"
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* 5-PILLARS BRAND ECOSYSTEM BAR (Anexo 2) */}
        <section className="py-14 bg-midnight-card/50 border-y border-white/5 relative z-10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-3 text-left">
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                  Mais do que sorteios, um <span className="text-accent">ecossistema de benefícios.</span>
                </h3>
              </div>
              <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {/* 1. Sorteios */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="size-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                    <Ticket size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Sorteios</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">Concorra a prêmios incríveis.</span>
                </div>

                {/* 2. Proteção */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="size-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Proteção</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">Mais segurança para você e sua família.</span>
                </div>

                {/* 3. Saúde */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="size-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                    <Heart size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Saúde</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">Bem-estar no seu dia a dia.</span>
                </div>

                {/* 4. Benefícios */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="size-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                    <PiggyBank size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Benefícios</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">Descontos e vantagens exclusivas.</span>
                </div>

                {/* 5. Oportunidades */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group col-span-2 sm:col-span-1">
                  <div className="size-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                    <Star size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Oportunidades</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">Mais chances de conquistar seus sonhos.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS SECTIONS */}
        <div id="detalhes" className="py-12 bg-midnight">
          {/* SECTION 1: Seguro de Acidentes Pessoais */}
          <section className="py-14 sm:py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Visual block - Free-standing Family Protection Illustration */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7 }}
                  className="relative flex items-center justify-center lg:justify-start order-2 lg:order-1 overflow-visible mt-6 lg:mt-0"
                >
                  {/* Background Aura */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-[260px] sm:size-[380px] lg:size-[560px] bg-gradient-to-tr from-primary-blue/40 via-accent/25 to-transparent rounded-full blur-[80px] sm:blur-[100px]"></div>
                  </div>

                  {/* Free-standing Transparent PNG - Mobile centered and desktop offset */}
                  <div className="relative z-10 w-full flex justify-center lg:justify-start items-center">
                    <img
                      src="/seguro-protecao-familia.png"
                      alt="Seguro de Acidentes Pessoais e Proteção Familiar CaZa dos Sorteios"
                      className="w-full max-w-[310px] sm:max-w-[400px] lg:max-w-none lg:w-[106%] xl:w-[112%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(3,29,110,0.65)] transform translate-x-0 lg:-translate-x-12 xl:-translate-x-16"
                    />
                  </div>
                </motion.div>

                {/* Copy block */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col gap-6 text-left order-1 lg:order-2"
                >
                  <span className="text-accent font-black uppercase text-sm tracking-widest">01. Seguro de Acidentes Pessoais e Invalidez</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                    “Proteção imediata para o que mais importa: você.”
                  </h2>
                  
                  <div className="h-1 w-20 bg-accent rounded-full mb-2"></div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Cobertura contra morte acidental e invalidez permanente (total ou parcial).
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Adesão simplificada: sem carência e sem análise prévia de saúde.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Segurança individual, sem burocracia.
                      </span>
                    </li>
                  </ul>

                  <div className="pt-4">
                    <Link
                      to="/cadastro"
                      className="bg-accent hover:bg-emerald-500 text-midnight px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                    >
                      Ative sua proteção agora
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Sorteios pela Loteria Federal */}
          <section className="py-14 sm:py-20 lg:py-28 border-y border-white/5 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-blue/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Copy block */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col gap-6 text-left"
                >
                  <span className="text-accent font-black uppercase text-sm tracking-widest">02. Sorteios pela Loteria Federal</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                    “Chances semanais de ganhar R$ 5.000,00.”
                  </h2>
                  
                  <div className="h-1 w-20 bg-accent rounded-full mb-2"></div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Sorteios semanais de R$ 5.000,00.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Transparência garantida pela Loteria Federal.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Regra de participação: o segurado começa a concorrer a partir do 2º domingo do mês subsequente à adesão ao plano.
                      </span>
                    </li>
                  </ul>

                  <div className="pt-4">
                    <Link
                      to="/cadastro"
                      className="bg-accent hover:bg-emerald-500 text-midnight px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                    >
                      Participe dos sorteios oficiais
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </motion.div>

                {/* Visual block - Free-standing Illustration with Transparent Background */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7 }}
                  className="relative flex items-center justify-center lg:justify-end overflow-visible mt-6 lg:mt-0"
                >
                  {/* Background Aura */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-[260px] sm:size-[380px] lg:size-[560px] bg-gradient-to-tr from-primary-blue/40 via-accent/25 to-transparent rounded-full blur-[80px] sm:blur-[100px]"></div>
                  </div>

                  {/* Illustration - Shifted right on desktop, centered on mobile */}
                  <div className="relative z-10 w-full flex justify-center lg:justify-end items-center">
                    <img
                      src="/sorteio-ganhadora.png"
                      alt="Sorteios Loteria Federal CaZa dos Sorteios"
                      className="w-full max-w-[310px] sm:max-w-[400px] lg:max-w-none lg:w-[120%] xl:w-[128%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(3,29,110,0.65)] transform translate-x-0 lg:translate-x-14 xl:translate-x-16"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Telemedicina 24/7 */}
          <section className="py-14 sm:py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Visual block - Free-standing Telemedicine Consultation Illustration */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7 }}
                  className="relative flex items-center justify-center lg:justify-start order-2 lg:order-1 overflow-visible mt-6 lg:mt-0"
                >
                  {/* Background Aura */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-[260px] sm:size-[380px] lg:size-[560px] bg-gradient-to-tr from-primary-blue/40 via-accent/25 to-transparent rounded-full blur-[80px] sm:blur-[100px]"></div>
                  </div>

                  {/* Free-standing Transparent PNG - Shifted left on desktop, centered on mobile */}
                  <div className="relative z-10 w-full flex justify-center lg:justify-start items-center">
                    <img
                      src="/telemedicina-consulta.png"
                      alt="Telemedicina 24/7 e Consultas Online CaZa dos Sorteios"
                      className="w-full max-w-[310px] sm:max-w-[400px] lg:max-w-none lg:w-[108%] xl:w-[115%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(3,29,110,0.65)] transform translate-x-0 lg:-translate-x-16 xl:-translate-x-20"
                    />
                  </div>
                </motion.div>

                {/* Copy block */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col gap-6 text-left order-1 lg:order-2"
                >
                  <span className="text-accent font-black uppercase text-sm tracking-widest">03. Telemedicina</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                    “Saúde acessível, sempre ao seu lado.”
                  </h2>
                  
                  <div className="h-1 w-20 bg-accent rounded-full mb-2"></div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Pronto atendimento com clínico geral 24 horas por dia, 7 dias por semana (sem agendamento).
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Consultas com médicos especialistas com hora marcada.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Atendimento rápido e sem burocracia.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Pagamento direto ao parceiro comercial, sem cashback.
                      </span>
                    </li>
                  </ul>

                  <div className="pt-4">
                    <Link
                      to="/cadastro"
                      className="bg-accent hover:bg-emerald-500 text-midnight px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                    >
                      Tenha acesso imediato à telemedicina
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Ganhos Financeiros – Indique e Ganhe */}
          <section className="py-14 sm:py-20 lg:py-28 border-t border-white/5 bg-slate-950/20">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Copy block */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col gap-6 text-left"
                >
                  <span className="text-accent font-black uppercase text-sm tracking-widest">04. Ganhos Financeiros – Indique e Ganhe</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                    “Ganhe protegendo e convidando.”
                  </h2>
                  
                  <div className="h-1 w-20 bg-accent rounded-full mb-2"></div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Todo segurado recebe um link exclusivo de convite.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Ao compartilhar, você pode convidar novas pessoas para aderirem ao plano.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Cada novo segurado que adquirir nosso seguro terá a mesma oportunidade de proteção, sorteios e ganhos financeiros.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="size-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-300 font-medium text-base">
                        Expanda sua rede e aumente seus resultados com transparência total no painel financeiro.
                      </span>
                    </li>
                  </ul>

                  <div className="pt-4">
                    <Link
                      to="/cadastro"
                      className="bg-accent hover:bg-emerald-500 text-midnight px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                    >
                      Ative seu plano e comece a indicar hoje mesmo
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </motion.div>

                {/* Visual block - Free-standing Affiliate & Network Earnings Illustration */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7 }}
                  className="relative flex items-center justify-center lg:justify-end overflow-visible mt-6 lg:mt-0"
                >
                  {/* Background Aura */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-[260px] sm:size-[380px] lg:size-[560px] bg-gradient-to-tr from-primary-blue/40 via-accent/25 to-transparent rounded-full blur-[80px] sm:blur-[100px]"></div>
                  </div>

                  {/* Free-standing Transparent PNG - Shifted right on desktop, centered on mobile */}
                  <div className="relative z-10 w-full flex justify-center lg:justify-end items-center">
                    <img
                      src="/indique-ganhe-rede.png"
                      alt="Ganhos Financeiros e Indique e Ganhe CaZa dos Sorteios"
                      className="w-full max-w-[310px] sm:max-w-[400px] lg:max-w-none lg:w-[114%] xl:w-[122%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(3,29,110,0.65)] transform translate-x-0 lg:translate-x-14 xl:translate-x-18"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* FINAL CTA SECTION */}
          <section className="py-24 relative overflow-hidden text-center border-t border-white/5">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/20 rounded-full blur-[150px]"></div>
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-8">
              <span className="text-accent font-black uppercase tracking-widest text-sm bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
                Ativação Simplificada
              </span>

              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                Proteção, prêmios e ganhos reais em um só plano.
              </h2>

              <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
                Adquira o Seguro Premiável hoje mesmo por um valor acessível e destrave todos os benefícios, sorteios semanais e o seu link de indicações instantaneamente.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  to="/cadastro"
                  className="bg-accent hover:bg-emerald-500 text-midnight px-12 py-5 rounded-2xl text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/30 w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
                >
                  Ative seu plano e comece a indicar hoje mesmo
                  <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider pt-4">
                Seguro de Acidentes Pessoais garantido pela MBM Seguradora. Sorteios homologados via Loteria Federal.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-slate-500 py-16 px-6 lg:px-20 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img 
                  src="/logo.png" 
                  alt="CaZa dos Sorteios" 
                  className="h-10 w-auto object-contain" 
                />
              </div>
              <p className="text-sm leading-relaxed mb-6 text-slate-400">
                A união perfeita entre proteção pessoal, benefícios exclusivos e sorteios oficiais pela Loteria Federal.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-accent transition-colors"><Instagram size={20} /></a>
                <a href="#" className="hover:text-accent transition-colors"><Twitter size={20} /></a>
                <a href="#" className="hover:text-accent transition-colors"><Linkedin size={20} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Plataforma</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#detalhes" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><Link to="/ecossistema" className="hover:text-white transition-colors">Ecossistema</Link></li>
                <li><Link to="/ganhe-dinheiro" className="hover:text-white transition-colors">Ganhe Dinheiro</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Ativar Seguro</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Suporte</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ouvidoria</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><Link to="/termos-uso" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link to="/termos-privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link to="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p>© 2026 SIC COMÉRCIO DE PRODUTOS ALIMENTICIOS E SERVIÇOS LTDA CNPJ nº 54.795.377/0001-03. Todos os direitos reservados. Operação: CaZa dos Sorteios.</p>
              <p className="opacity-50 lowercase font-medium">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">P4D Mídia</a></p>
            </div>
            <div className="flex gap-8">
              <span>Brasil</span>
              <span className="flex items-center gap-1">
                <Globe size={12} />
                Português
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
