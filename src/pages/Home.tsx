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
  ArrowUpRight
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
        {/* HERO SECTION */}
        <section className="relative w-full py-24 lg:py-36 overflow-hidden border-b border-white/5">
          {/* Ambient Glows */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-primary-blue rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-accent rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="lg:col-span-7 flex flex-col gap-8 text-left"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent text-xs font-bold uppercase tracking-wider w-fit">
                  <Award size={14} className="animate-bounce" />
                  Programa Exclusivo
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                  Serviços Urbanos <br />
                  <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
                    Seguro Premiável
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-medium">
                  A união perfeita entre proteção pessoal e oportunidades reais de ganho. Proteja quem você ama, participe de sorteios pela Loteria Federal, acesse telemedicina 24/7 e construa uma renda recorrente indicando amigos.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to="/cadastro"
                    className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-4.5 rounded-2xl text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20 flex items-center gap-2 group"
                  >
                    Ativar sua proteção agora
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a
                    href="#detalhes"
                    className="bg-white/5 hover:bg-white/10 text-white px-10 py-4.5 rounded-2xl text-lg font-bold transition-all border border-white/10 hover:border-white/20 flex items-center gap-2"
                  >
                    Conhecer Benefícios
                  </a>
                </div>

                {/* Micro Metrics */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-lg">
                  <div>
                    <p className="text-2xl font-extrabold text-white">R$ 5.000</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Sorteios Semanais</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">24/7</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Telemedicina</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">100%</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Sem Carência</p>
                  </div>
                </div>
              </motion.div>

              {/* Visual Interactive Column */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex justify-center lg:justify-end"
              >
                {/* Premium Ticket Card Mockup */}
                <div className="relative w-full max-w-[420px] aspect-[4/5] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col justify-between overflow-hidden group">
                  {/* Internal Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/20 transition-all"></div>

                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-center gap-2">
                      <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Serviços Urbanos</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">Seguro Ativo</p>
                      </div>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-black uppercase tracking-wider">
                      Titular
                    </div>
                  </div>

                  {/* Mid Mockup Detail */}
                  <div className="my-auto py-8 space-y-6 z-10">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                        <span>COBERTURA TOTAL</span>
                        <span className="text-white">R$ 5.000,00</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-accent rounded-full"></div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Proteção contra morte acidental e invalidez permanente (total/parcial) sem análise prévia de saúde.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary-blue/20 flex items-center justify-center text-primary-blue">
                          <Gift size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Loteria Federal</p>
                           <p className="text-[10px] text-slate-400 font-medium">Sorteios semanais de R$ 5.000</p>
                        </div>
                      </div>
                       <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300 font-bold uppercase">Chances Semanais</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5 text-xs text-slate-500 font-bold tracking-wider z-10">
                    <span className="flex items-center gap-1.5 uppercase"><Lock size={12} className="text-accent" /> TLS Seguro</span>
                    <span>SU-2026</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PILLARS SECTIONS */}
        <div id="detalhes" className="py-12 bg-midnight">
          {/* SECTION 1: Seguro de Acidentes Pessoais */}
          <section className="py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Visual block */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex justify-center lg:justify-start order-2 lg:order-1"
                >
                  <div className="relative w-full max-w-[440px] aspect-square rounded-[3rem] bg-gradient-to-br from-primary-blue/20 to-accent/5 p-8 border border-white/10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent pointer-events-none"></div>
                    <div className="size-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-8 shadow-inner">
                      <ShieldCheck size={36} />
                    </div>
                    <div>
                      <span className="text-xs text-accent font-black uppercase tracking-widest">Garantia Seguradora MBM</span>
                      <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-4 leading-tight">Apólice Individual Simplificada</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        Adesão automatizada direto no painel com ativação imediata. Cobertura nacional completa com segurança jurídica respaldada pela MBM Seguradora.
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest mt-6">
                      <span>Sem Burocracia</span>
                      <span className="text-accent flex items-center gap-1">Adesão Rápida <ArrowUpRight size={14} /></span>
                    </div>
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
          <section className="py-20 lg:py-28 border-y border-white/5 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-blue/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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

                {/* Visual block */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex justify-center lg:justify-end"
                >
                  {/* Virtual Lotto ticket mockup */}
                  <div className="relative w-full max-w-[440px] rounded-[2.5rem] bg-slate-900 border border-white/10 p-8 shadow-2xl overflow-hidden flex flex-col justify-between group">
                    <div className="absolute -top-16 -right-16 size-40 bg-accent/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
                    
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Gift size={20} className="text-accent" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Loteria Federal</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-black uppercase">Extração Semanal</span>
                    </div>

                    <div className="py-4 flex flex-col gap-3">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Como funciona o Sorteio (Regra Oficial)</p>
                      
                      {/* Extraction Table */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>1º Prêmio</span>
                          <span className="font-mono text-sm text-slate-500">
                            15.9<strong className="text-accent underline font-extrabold decoration-2">45</strong>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>2º Prêmio</span>
                          <span className="font-mono text-sm text-slate-500">
                            46.72<strong className="text-accent underline font-extrabold decoration-2">9</strong>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>3º Prêmio</span>
                          <span className="font-mono text-sm text-slate-500">
                            53.00<strong className="text-accent underline font-extrabold decoration-2">8</strong>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>4º Prêmio</span>
                          <span className="font-mono text-sm text-slate-500">
                            40.14<strong className="text-accent underline font-extrabold decoration-2">3</strong>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>5º Prêmio</span>
                          <span className="font-mono text-sm text-slate-500">
                            30.12<strong className="text-accent underline font-extrabold decoration-2">3</strong>
                          </span>
                        </div>
                      </div>

                      {/* Resulting Digital Ticket */}
                      <div className="space-y-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Número Sorteado Exemplo</p>
                        <div className="grid grid-cols-6 gap-1.5">
                          {['4', '5', '9', '8', '3', '3'].map((digit, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-xl font-black text-accent shadow-inner shadow-accent/5">
                              {digit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      <span>Início: 2º Domingo Subsequente</span>
                      <span>Sorteios Oficiais</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Telemedicina 24/7 */}
          <section className="py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Visual block */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex justify-center lg:justify-start order-2 lg:order-1"
                >
                  {/* Telemedicine call screen mockup */}
                  <div className="relative w-full max-w-[440px] aspect-[1.1] rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 p-8 shadow-2xl overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary-blue/10 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 z-10">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-accent" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Telemedicina Online</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-[10px] text-emerald-500 font-black uppercase">Médico Online</span>
                      </div>
                    </div>

                    <div className="py-8 text-center flex flex-col items-center justify-center gap-4 z-10">
                      <div className="size-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent relative">
                        <Heart size={36} className="animate-pulse text-accent" />
                        <div className="absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-75"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">Clínico Geral & Especialidades</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Conectando você a médicos credenciados em segundos</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest z-10">
                      <span>Sem Agendamento</span>
                      <span>Disponibilidade 24/7</span>
                    </div>
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
                  <span className="text-accent font-black uppercase text-sm tracking-widest">03. Telemedicina 24/7</span>
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
                        Consultas online disponíveis 24 horas por dia, 7 dias por semana.
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
          <section className="py-20 lg:py-28 border-t border-white/5 bg-slate-950/20">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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

                {/* Visual block */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6 }}
                  className="flex justify-center lg:justify-end"
                >
                  {/* Referral Network Visualization */}
                  <div className="relative w-full max-w-[440px] aspect-[1.1] rounded-[2.5rem] bg-slate-900 border border-white/10 p-8 shadow-2xl overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Users2 size={20} className="text-accent" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Sua Rede de Indicações</span>
                      </div>
                      <span className="text-[10px] text-accent font-black uppercase">Recorrente vitalício</span>
                    </div>

                    {/* Network Nodes Mockup */}
                    <div className="py-6 flex flex-col items-center justify-center gap-4 relative my-auto">
                      {/* Central Node (You) */}
                      <div className="size-16 rounded-full bg-accent/20 border border-accent/40 flex flex-col items-center justify-center text-white relative z-10">
                        <span className="text-xs font-black uppercase">Você</span>
                        <span className="text-[9px] text-accent font-bold mt-0.5">G0</span>
                      </div>

                      {/* Connecting lines SVG */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-accent/20 stroke-2" fill="none">
                        <line x1="50%" y1="50%" x2="25%" y2="78%" />
                        <line x1="50%" y1="50%" x2="50%" y2="82%" />
                        <line x1="50%" y1="50%" x2="75%" y2="78%" />
                      </svg>

                      {/* Level 1 Nodes */}
                      <div className="flex justify-between w-full px-6 mt-4 relative z-10">
                        <div className="size-12 rounded-full bg-slate-800 border border-white/10 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-300">Amigo A</span>
                          <span className="text-[8px] text-slate-500 font-bold">G1</span>
                        </div>
                        <div className="size-12 rounded-full bg-slate-800 border border-white/10 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-300">Amigo B</span>
                          <span className="text-[8px] text-slate-500 font-bold">G1</span>
                        </div>
                        <div className="size-12 rounded-full bg-slate-800 border border-white/10 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-300">Amigo C</span>
                          <span className="text-[8px] text-slate-500 font-bold">G1</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Sua Rede Ativa</span>
                      <span className="text-white flex items-center gap-1">Acessar Painel <ArrowUpRight size={14} /></span>
                    </div>
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
              <div className="flex items-center gap-2 text-white mb-6">
                <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                  <LayoutGrid size={14} />
                </div>
                <span className="text-lg font-bold">Serviços Urbanos</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Transformando a vida nas cidades através de tecnologia e economia compartilhada.
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
                <li><a href="#" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><Link to="/ecossistema" className="hover:text-white transition-colors">Ecossistema</Link></li>
                <li><Link to="/afiliado/renovacoes" className="hover:text-white transition-colors">Planos de Licença</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Seja um parceiro</Link></li>
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
              <p>© 2026 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
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
