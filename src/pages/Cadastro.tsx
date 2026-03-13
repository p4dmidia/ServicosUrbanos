import { useState } from 'react';
import {
    CheckCircle,
    User,
    Car,
    Store,
    Smartphone,
    TrendingUp,
    Wallet,
    ArrowRight,
    Globe,
    Instagram,
    Twitter,
    Linkedin,
    LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Cadastro() {
    const [userType, setUserType] = useState('user');

    const benefits = [
        "Acesso a todos os apps",
        "Participe do programa de Cashback",
        "Saques automáticos via PIX"
    ];

    const types = [
        { id: 'user', icon: <User />, label: 'Sou Usuário/Passageiro' },
        { id: 'driver', icon: <Car />, label: 'Sou Condutor/Entregador' },
        { id: 'store', icon: <Store />, label: 'Sou Lojista' }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans bg-white">
            <Header />

            <main className="flex-1 flex flex-col lg:flex-row">
                {/* Coluna da Esquerda (Informativa) */}
                <div className="lg:w-1/2 bg-midnight p-12 lg:p-24 flex flex-col justify-center text-white relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-blue rounded-full blur-[100px]"></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">
                            Junte-se à <br />
                            <span className="text-emerald-500">revolução urbana.</span>
                        </h2>

                        <div className="space-y-6">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={20} />
                                    </div>
                                    <span className="text-lg lg:text-xl font-medium text-slate-300">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm max-w-md">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="size-12 rounded-2xl bg-primary-blue/20 flex items-center justify-center text-primary-blue">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Programa de Cashback</p>
                                    <p className="font-bold text-white">Cashback em cada serviço</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Cada indicação e cada uso gera bônus reais. O ecossistema que valoriza quem faz a cidade girar.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Coluna da Direita (Formulário) */}
                <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center bg-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xl mx-auto w-full"
                    >
                        <div className="mb-10">
                            <h1 className="text-3xl lg:text-4xl font-black text-midnight mb-2">Crie sua Conta Grátis</h1>
                            <p className="text-slate-500">Preencha os dados abaixo para começar.</p>
                        </div>

                        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                            {/* Seletor de Perfil */}
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-4">Como deseja participar?</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {types.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setUserType(type.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${userType === type.id
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                                : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl ${userType === type.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                                                {type.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-center leading-tight">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Campos do Formulário */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-midnight appearance-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="tel"
                                            placeholder="(00) 00000-0000"
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-midnight"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-midnight border-none outline-none ring-0 focus:ring-0 active:ring-0"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                    {/* Note: I added a bit of extra style to ensure a super clean look as requested */}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CPF</label>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-midnight"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chave PIX (Para receber seus ganhos)</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="E-mail, CPF ou Aleatória"
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-midnight"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Termos */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 size-5 rounded-md border-slate-200 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-sm text-slate-500 leading-tight cursor-pointer">
                                    Concordo com os <span className="text-emerald-600 font-bold hover:underline">Termos de Uso</span> e regras do programa de Cashback.
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-midnight px-10 py-5 rounded-2xl text-xl font-black transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-tighter"
                                >
                                    Concluir Cadastro
                                    <ArrowRight size={24} />
                                </button>
                                <p className="text-center mt-6 text-slate-500 font-medium">
                                    Já tem conta? <Link to="/login" className="text-midnight font-bold hover:underline">Faça Login</Link>
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>

            {/* Footer simples reutilizado do padrão */}
            <footer className="bg-midnight text-slate-500 py-12 px-6 lg:px-20 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 text-white">
                        <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                            <LayoutGrid size={14} />
                        </div>
                        <span className="text-lg font-bold">Serviços Urbanos</span>
                    </div>

                    <p className="text-[10px] uppercase tracking-widest font-bold">© 2024 Serviços Urbanos Tecnologia S.A.</p>

                    <div className="flex gap-6">
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-emerald-500 transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
