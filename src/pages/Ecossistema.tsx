import React from 'react';
import {
  ShieldCheck,
  Gift,
  Activity,
  Users2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
  CheckCircle2,
  Instagram,
  Twitter,
  Linkedin,
  LayoutGrid,
  Heart,
  Award,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

export default function Ecossistema() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-midnight text-slate-100 overflow-x-hidden">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-6 lg:px-20 relative overflow-hidden border-b border-white/5">
          {/* Ambient Glows */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary-blue rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent rounded-full blur-[150px]"></div>
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-accent/10 border border-accent/20 text-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Tecnologia & Proteção Integrada
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-7xl font-black tracking-tighter leading-tight text-white"
            >
              Um ecossistema completo <br className="hidden lg:block" />
              para <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">gerar valor e segurança</span> para você.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg lg:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
            >
              Muito além de um simples seguro. A Serviços Urbanos desenvolveu um ecossistema inovador focado no Seguro Premiável, onde a sua proteção individual se conecta a prêmios mensais, telemedicina e ganhos recorrentes por indicações.
            </motion.p>

            {/* Connection Diagram (Seguro Premiável version) */}
            <div className="relative py-16 max-w-4xl mx-auto">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <div className="w-[600px] h-[600px] border border-dashed border-white rounded-full animate-[spin_60s_linear_infinite]"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-center gap-8 md:gap-12 relative z-10">
                {/* Seguro MBM */}
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-slate-900 shadow-2xl rounded-3xl flex items-center justify-center text-accent border border-white/10">
                    <ShieldCheck size={32} />
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguro MBM</span>
                </div>

                {/* Sorteios */}
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-slate-900 shadow-2xl rounded-3xl flex items-center justify-center text-accent border border-white/10">
                    <Gift size={32} />
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sorteios R$ 5k</span>
                </div>

                {/* Central User */}
                <div className="flex flex-col items-center gap-5 relative col-span-2 md:col-span-1 py-6 md:py-0">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="size-20 lg:size-24 bg-accent text-midnight shadow-xl shadow-accent/20 rounded-[2rem] flex items-center justify-center"
                  >
                    <Users2 size={36} />
                  </motion.div>
                  <span className="text-xs font-black uppercase tracking-widest text-white">Você no Centro</span>
                </div>

                {/* Telemedicina */}
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-slate-900 shadow-2xl rounded-3xl flex items-center justify-center text-accent border border-white/10">
                    <Activity size={32} />
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telemedicina</span>
                </div>

                {/* Indicação */}
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-slate-900 shadow-2xl rounded-3xl flex items-center justify-center text-accent border border-white/10">
                    <TrendingUp size={32} />
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Indique & Ganhe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="py-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto space-y-16">
            <div>
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter text-white">Os Quatro Pilares do Ecossistema</h2>
              <p className="text-slate-400 font-medium mt-2">Uma infraestrutura desenhada para proteger e rentabilizar a sua rede.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1: Seguro de Acidentes Pessoais */}
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="size-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">1. Proteção Individual MBM</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    Cobertura contra morte acidental e invalidez permanente (total/parcial). Adesão instantânea via painel de forma simplificada, sem carências e sem necessidade de exames de saúde.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/5 mt-6 text-xs text-slate-500 font-bold uppercase flex justify-between">
                  <span>MBM Seguradora</span>
                  <span className="text-accent flex items-center gap-0.5">Ativação Imediata <ArrowUpRight size={12} /></span>
                </div>
              </motion.div>

              {/* Card 2: Sorteios pela Loteria Federal */}
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="size-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <Gift size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">2. Sorteios Oficiais</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    Concorra a sorteios semanais no valor de R$ 5.000,00 cada. A apuração é baseada nas extrações oficiais da Loteria Federal, garantindo lisura e transparência total a todos os segurados.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/5 mt-6 text-xs text-slate-500 font-bold uppercase flex justify-between">
                  <span>Loteria Federal</span>
                  <span className="text-accent">Chances Semanais</span>
                </div>
              </motion.div>

              {/* Card 3: Telemedicina 24/7 */}
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="size-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">3. Telemedicina 24/7</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    Consultas online com clínicos gerais e especialistas a qualquer hora do dia ou da noite, 7 dias por semana. Um canal médico direto por videochamada, com pagamento simplificado e sem burocracias.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/5 mt-6 text-xs text-slate-500 font-bold uppercase flex justify-between">
                  <span>Saúde Online</span>
                  <span className="text-accent">Sem Agendamento</span>
                </div>
              </motion.div>

              {/* Card 4: Ganhos Financeiros – Indique e Ganhe */}
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="size-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">4. Indique e Ganhe</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    Convide novos segurados através de seu link exclusivo de afiliado. Cada nova adesão expande sua rede de indicações, gerando bonificações financeiras recorrentes e vitalícias pagas diretamente na sua conta.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/5 mt-6 text-xs text-slate-500 font-bold uppercase flex justify-between">
                  <span>Afiliação MMN</span>
                  <span className="text-accent flex items-center gap-0.5">Renda Vitalícia <ArrowUpRight size={12} /></span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Fluxo Section */}
        <section className="py-24 px-6 lg:px-20 bg-slate-950/20 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter text-white">Como a Roda Gira</h2>
              <p className="text-slate-400 font-medium mt-2">O ciclo simplificado de proteção e ganhos da sua rede de afiliados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector lines (Desktop) */}
              <div className="hidden md:block absolute top-[20%] left-[25%] right-[25%] h-px bg-white/10 border-t border-dashed border-white/20 pointer-events-none"></div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-20 bg-slate-900 rounded-3xl flex items-center justify-center text-accent mb-8 group-hover:bg-accent group-hover:text-midnight border border-white/10 transition-all transform group-hover:rotate-6 shadow-2xl">
                  <ShieldCheck size={32} />
                </div>
                <div className="text-xs font-black text-accent uppercase tracking-widest mb-4">Passo 01</div>
                <h4 className="text-xl font-black text-white mb-4">Ative seu Plano & Indique</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Adquira o Seguro Premiável para garantir sua cobertura e destrave seu link exclusivo de afiliado para começar a indicar imediatamente.
                </p>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-20 bg-slate-900 rounded-3xl flex items-center justify-center text-accent mb-8 group-hover:bg-accent group-hover:text-midnight border border-white/10 transition-all transform group-hover:rotate-6 shadow-2xl">
                  <Users2 size={32} />
                </div>
                <div className="text-xs font-black text-accent uppercase tracking-widest mb-4">Passo 02</div>
                <h4 className="text-xl font-black text-white mb-4">Sua Rede se Protege</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Seus convidados ativam os planos de seguro, passando a usufruir de segurança, sorteios mensais da loteria e acesso à telemedicina.
                </p>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-20 bg-slate-900 rounded-3xl flex items-center justify-center text-accent mb-8 group-hover:bg-accent group-hover:text-midnight border border-white/10 transition-all transform group-hover:rotate-6 shadow-2xl">
                  <DollarSign size={32} />
                </div>
                <div className="text-xs font-black text-accent uppercase tracking-widest mb-4">Passo 03</div>
                <h4 className="text-xl font-black text-white mb-4">Você Recebe os Ganhos</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Ganho Mensal pago via Pix todo dia 10, Ganho Semanal pago toda sexta-feira e o bônus anual pago em dezembro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="px-6 lg:px-20 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto bg-slate-900 border border-white/10 rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-blue/10 via-transparent to-transparent opacity-50"></div>

            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
                Pronto para fazer parte <br /> dessa rede de proteção?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
                Ative seu Seguro Premiável e garanta assistência médica 24h, sorteios da Loteria Federal e bônus recorrentes hoje mesmo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <Link
                  to="/cadastro"
                  className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20"
                >
                  Ative seu plano agora mesmo
                </Link>
                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 size={16} className="text-accent" />
                  Sem carência de adesão
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-slate-500 py-16 px-6 lg:px-20 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 text-left">
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

            <div className="text-left">
              <h4 className="text-white font-bold mb-6">Plataforma</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><Link to="/ecossistema" className="hover:text-white transition-colors">Ecossistema</Link></li>
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Seja um parceiro</Link></li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="text-white font-bold mb-6">Suporte</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ouvidoria</a></li>
              </ul>
            </div>

            <div className="text-left">
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
