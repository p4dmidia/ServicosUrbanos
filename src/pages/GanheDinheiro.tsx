import {
    LayoutGrid,
    CheckCircle,
    Users,
    Wallet,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    Globe,
    Instagram,
    Twitter,
    Linkedin
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function GanheDinheiro() {
    const steps = [
        {
            icon: <CheckCircle className="text-emerald-500" size={32} />,
            title: "Consuma no Ecossistema",
            description: "Consuma pelo menos 1 serviço/compra por mês para se manter ativo e qualificado."
        },
        {
            icon: <Users className="text-primary-blue" size={32} />,
            title: "Compartilhe seu Link",
            description: "Convide amigos para a rede e construa sua base de usuários."
        },
        {
            icon: <Wallet className="text-emerald-500" size={32} />,
            title: "Receba em PIX",
            description: "Ganhe percentuais sobre tudo que sua rede G1 a G4 consumir."
        }
    ];

    const simulationData = [
        { level: "G1 (Pessoal)", bonus: "Percentual de Cashback Corrente" },
        { level: "G2 (10 pessoas)", bonus: "Bônus de Grupo Nível 2" },
        { level: "G3 (100 pessoas)", bonus: "Bônus de Grupo Nível 3" },
        { level: "G4 (1.000 pessoas)", bonus: "Renda Recorrente Vitalícia" }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans bg-midnight">
            <Header />

            <main>
                {/* Hero Section */}
                <section className="relative w-full bg-midnight py-20 lg:py-32 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-blue rounded-full blur-[150px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight mb-6 max-w-5xl mx-auto">
                                Transforme suas indicações em uma <span className="text-emerald-500">renda recorrente vitalícia.</span>
                            </h1>
                            <p className="text-lg md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto">
                                Indique pessoas, amigos e familiares e ganhe bônus diários, mensais e anuais direto no seu PIX.
                            </p>
                            <Link to="/cadastro" className="bg-emerald-500 hover:bg-emerald-600 text-midnight px-12 py-5 rounded-2xl text-xl font-black transition-transform active:scale-95 shadow-2xl shadow-emerald-500/30 flex items-center gap-3 mx-auto uppercase tracking-tighter w-fit">
                                Quero ser um Titular do Cashback
                                <ChevronRight size={24} />
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Como Funciona - Fundo Branco */}
                <section className="py-24 bg-white text-midnight">
                    <div className="max-w-7xl mx-auto px-6 lg:px-20">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Como Funciona</h2>
                            <div className="w-20 h-2 bg-emerald-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center p-8 border border-slate-100 rounded-3xl hover:shadow-xl transition-shadow">
                                    <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                                        {step.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{idx + 1}. {step.title}</h3>
                                    <p className="text-slate-600 leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Simulação de Ganhos - Fundo Azul Escuro */}
                <section className="py-24 bg-midnight text-white border-y border-slate-800">
                    <div className="max-w-7xl mx-auto px-6 lg:px-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter leading-none">
                                    Simulação de <br />
                                    <span className="text-emerald-500">Ganhos em Rede</span>
                                </h2>
                                <p className="text-slate-400 text-lg mb-8">
                                    O nosso programa de Cashback recompensa seu empenho em expandir nossa rede. Quanto maior seu grupo, maiores seus bônus diretos no PIX.
                                </p>
                                <div className="space-y-4">
                                    {simulationData.map((item, idx) => (
                                        <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                                            <span className="font-bold text-slate-300">{item.level}</span>
                                            <span className="font-black text-emerald-500">{item.bonus}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[100px]"></div>
                                <div className="relative bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center text-midnight">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-black">Meta Nível 4</p>
                                            <p className="text-2xl font-black text-white">Independência Financeira</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-3/4 bg-emerald-500 rounded-full"></div>
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium">
                                            Com 1.000 pessoas consumindo em sua rede, você atinge o topo do programa de Cashback com rendimentos crescentes e vitalícios.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Garantia e Prova Social - Fundo Branco */}
                <section className="py-24 bg-white text-midnight">
                    <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-3xl mb-8">
                            <ShieldCheck className="text-emerald-600" size={48} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter">Sistema 100% transparente.</h2>
                        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium">
                            Ganhos baseados em consumo real de serviços. Sem taxas ocultas, sem promessas vazias. Economia compartilhada de verdade.
                        </p>

                        <Link to="/cadastro" className="bg-emerald-500 hover:bg-emerald-600 text-midnight px-16 py-6 rounded-2xl text-2xl font-black transition-transform hover:scale-105 shadow-2xl shadow-emerald-500/40 uppercase tracking-tighter inline-block">
                            Cadastre-se e Pegue seu Link
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer simples reutilizado do padrão */}
            <footer className="bg-midnight text-slate-500 py-16 px-6 lg:px-20 border-t border-slate-900 mt-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                        <div className="flex items-center gap-2 text-white">
                            <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                                <LayoutGrid size={14} />
                            </div>
                            <span className="text-lg font-bold">Serviços Urbanos</span>
                        </div>

                        <div className="flex gap-8 items-center">
                            <Link to="/marketplace" className="text-xs font-bold hover:text-white transition-colors">Marketplace</Link>
                            <Link to="/ecossistema" className="text-xs font-bold hover:text-white transition-colors">Ecossistema</Link>
                            <div className="flex gap-6 border-l border-slate-800 pl-6">
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Linkedin size={20} /></a>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
                        <p>© 2026 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
                        <div className="flex gap-8">
                            <span className="flex items-center gap-1">
                                <Globe size={12} />
                                Brasil - Português
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
