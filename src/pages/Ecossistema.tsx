import React from 'react';
import {
    Car,
    Utensils,
    ShoppingBag,
    ShieldCheck,
    Wallet,
    User,
    DollarSign,
    ArrowRight,
    TrendingUp,
    Zap,
    Globe,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

export default function Ecossistema() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-midnight overflow-x-hidden">
            <Header />

            <main>
                {/* Hero Section */}
                <section className="py-20 px-6 lg:px-20 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto text-center relative z-10">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                        >
                            Tecnologia & Economia
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl lg:text-7xl font-black mb-8 tracking-tighter leading-tight"
                        >
                            Uma cidade inteira conectada <br className="hidden lg:block" />
                            para <span className="text-emerald-500">gerar valor</span> para você.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 text-lg lg:text-xl max-w-3xl mx-auto mb-16 font-medium leading-relaxed"
                        >
                            Diferente de tudo que você já viu. A Serviços Urbanos não é apenas um app, é um ecossistema onde cada ação sua ou da sua rede movimenta a economia e gera Cashback.
                        </motion.p>

                        {/* Connection Diagram */}
                        <div className="relative py-20 max-w-4xl mx-auto">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-[600px] h-[600px] border-2 border-dashed border-midnight rounded-full animate-[spin_60s_linear_infinite]"></div>
                            </div>

                            <div className="grid grid-cols-3 lg:grid-cols-5 items-center gap-12 relative">
                                {/* Connections are implied by proximity and a central focus */}
                                <div className="flex flex-col items-center gap-4">
                                    <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-midnight border border-slate-100">
                                        <Car size={32} />
                                    </motion.div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UrbaMoby</span>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-emerald-500 border border-slate-100">
                                        <Utensils size={32} />
                                    </motion.div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UrbaFood</span>
                                </div>

                                {/* Central User */}
                                <div className="flex flex-col items-center gap-6 relative z-20 col-span-1">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                        className="size-24 lg:size-32 bg-midnight text-white shadow-2xl rounded-[2.5rem] flex items-center justify-center"
                                    >
                                        <User size={48} />
                                    </motion.div>
                                    <span className="text-xs font-black uppercase tracking-widest text-midnight">Você (Centro)</span>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-primary-blue border border-slate-100">
                                        <ShoppingBag size={32} />
                                    </motion.div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UrbaShop</span>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <motion.div whileHover={{ scale: 1.1 }} className="size-16 lg:size-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-orange-500 border border-slate-100">
                                        <DollarSign size={32} />
                                    </motion.div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cashback Direto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bento Grid Section */}
                <section className="py-24 px-6 lg:px-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16">
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-4">Tudo em um só lugar</h2>
                            <p className="text-slate-500 font-medium">Uma infraestrutura robusta para todas as suas necessidades.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 h-auto">
                            {/* Card 1: UrbaShop - Marketplace (Agora em primeiro e destaque) */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-3 lg:col-span-4 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-8 text-slate-100 group-hover:text-primary-blue transition-colors pointer-events-none">
                                    <ShoppingBag size={180} />
                                </div>
                                <div className="relative z-10">
                                    <ShoppingBag className="text-primary-blue mb-6" size={48} />
                                    <h3 className="text-3xl font-black mb-4">UrbaShop - Marketplace</h3>
                                    <p className="text-slate-500 font-medium max-w-xs text-lg">Compre de tudo, venda para todos dentro da nossa rede. O maior ecossistema de varejo local.</p>
                                </div>
                                <Link to="/marketplace" className="inline-flex items-center gap-2 bg-primary-blue text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all w-fit">
                                    Acessar Loja <ArrowRight size={18} />
                                </Link>
                            </motion.div>

                            {/* Card 2: UrbaFood & Delivery */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-1 lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between opacity-80"
                            >
                                <div>
                                    <Utensils className="text-orange-500 mb-6" size={32} />
                                    <h3 className="text-xl font-black mb-2">UrbaFood & Delivery</h3>
                                    <p className="text-slate-500 text-sm font-medium">Seus restaurantes favoritos com entrega sustentável.</p>
                                </div>
                                <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit">
                                    EM BREVE !
                                </div>
                            </motion.div>

                            {/* Card 3: Mobilidade UrbaMoby */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-2 lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between opacity-80"
                            >
                                <div>
                                    <Car className="text-emerald-500 mb-6" size={32} />
                                    <h3 className="text-xl font-black mb-2">Mobilidade UrbaMoby</h3>
                                    <p className="text-slate-500 text-sm font-medium">Motoristas valorizados e viagens seguras para passageiros exigentes.</p>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit">
                                    EM BREVE !
                                </div>
                            </motion.div>

                            {/* Card 4: Saúde & Seguros */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-2 lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between opacity-80"
                            >
                                <div>
                                    <ShieldCheck className="text-indigo-500 mb-6" size={32} />
                                    <h3 className="text-xl font-black mb-2">Saúde & Seguros</h3>
                                    <p className="text-slate-500 text-sm font-medium">Proteção e assistência de qualidade para a família toda.</p>
                                </div>
                                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit">
                                    EM BREVE !
                                </div>
                            </motion.div>

                            {/* Card 5: Carteira Digital */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-4 lg:col-span-2 bg-emerald-500 rounded-[2.5rem] p-10 shadow-xl flex flex-col justify-between text-midnight relative overflow-hidden"
                            >
                                <div className="absolute -bottom-10 -right-10 text-midnight/10 rotate-12">
                                    <Wallet size={200} />
                                </div>
                                <div className="relative z-10">
                                    <div className="size-12 bg-midnight/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Wallet size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Carteira Digital & Pix</h3>
                                    <p className="font-bold opacity-80 text-sm">Onde a mágica acontece. Receba e gaste seus bônus instantaneamente.</p>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="bg-midnight px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14} className="text-emerald-400" />
                                        PIX Instantâneo
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Fluxo Section */}
                <section className="py-24 px-6 lg:px-20 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-4">Como a roda gira</h2>
                            <p className="text-slate-500 font-medium">O ciclo de sustentabilidade do seu patrimônio.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connector lines (Desktop) */}
                            <div className="hidden md:block absolute top-[20%] left-[25%] right-[25%] h-px bg-slate-100 border-t border-dashed border-slate-300 pointer-events-none"></div>

                            <div className="flex flex-col items-center text-center group">
                                <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-midnight mb-8 group-hover:bg-midnight group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm group-hover:shadow-xl">
                                    <ShoppingBag size={32} />
                                </div>
                                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Passo 01</div>
                                <h4 className="text-xl font-black mb-4">Sua rede consome</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">Viagens, compras no marketplace e delivery geram taxas na rede.</p>
                            </div>

                            <div className="flex flex-col items-center text-center group">
                                <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-primary-blue mb-8 group-hover:bg-primary-blue group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm group-hover:shadow-xl">
                                    <TrendingUp size={32} />
                                </div>
                                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Passo 02</div>
                                <h4 className="text-xl font-black mb-4">Divisão de Lucros</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">O sistema automático divide os lucros e gera o Cashback entre os níveis.</p>
                            </div>

                            <div className="flex flex-col items-center text-center group">
                                <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm group-hover:shadow-xl">
                                    <DollarSign size={32} />
                                </div>
                                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Passo 03</div>
                                <h4 className="text-xl font-black mb-4">Você recebe o Pix</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">O saldo cai na sua carteira. Você decide: saca no Pix ou gasta no ecossistema.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Footer */}
                <section className="px-6 lg:px-20 pb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-7xl mx-auto bg-midnight rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-blue/10 via-transparent to-transparent opacity-50"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl lg:text-6xl font-black text-white mb-8 tracking-tighter">Pronto para fazer parte <br /> dessa revolução?</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link
                                    to="/cadastro"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-midnight px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    Criar Conta Gratuita e Entrar
                                </Link>
                                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    Sem taxas de adesão
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Footer minimalista */}
            <footer className="p-12 text-center text-slate-400 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest">© 2026 Serviços Urbanos S.A. • Tecnologia a favor da sua economia.</p>
            </footer>
        </div>
    );
}
