import React, { useState, useEffect } from 'react';
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
import { businessRules } from '../lib/businessRules';

export default function GanheDinheiro() {
    const [mmnConfig, setMmnConfig] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;
        businessRules.getMMNConfig()
            .then(config => {
                if (isMounted && config) {
                    setMmnConfig(config);
                }
            })
            .catch(err => {
                console.error("Error loading MMN config in GanheDinheiro:", err);
            });
        return () => {
            isMounted = false;
        };
    }, []);

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
            description: "Ganhe percentuais sobre tudo que sua rede G0 a G5 consumir."
        }
    ];

    const [indicadosStr, setIndicadosStr] = useState("5");
    const [precoStr, setPrecoStr] = useState("7,00");
    const [quantidadeStr, setQuantidadeStr] = useState("4");

    const parseDecimal = (val: string) => {
        if (!val) return 0;
        const normalized = val.replace(',', '.');
        const num = Number(normalized);
        return isNaN(num) ? 0 : num;
    };

    const indicados = Number(indicadosStr) || 0;
    const preco = parseDecimal(precoStr);
    const quantidade = Number(quantidadeStr) || 0;

    // MMN Network Growth Math
    const g0 = 1; // G0 - Você
    const g2 = indicados; // G1
    const g3 = indicados * indicados; // G2
    const g4 = indicados * indicados * indicados; // G3
    const g5 = indicados * indicados * indicados * indicados; // G4
    const g6 = indicados * indicados * indicados * indicados * indicados; // G5

    const totalRede = g2 + g3 + g4 + g5 + g6; // Apenas indicados
    const totalPessoas = totalRede + g0; // Com G0 (Você)
    const totalCompras = totalPessoas * quantidade;
    const arrecadacao = totalCompras * preco;

    const pMensal = mmnConfig ? mmnConfig.cashbackMensal : 2.75;
    const pDigital = mmnConfig ? mmnConfig.cashbackDigital : 1.00;
    const pAnual = mmnConfig ? mmnConfig.cashbackAnual : 0.75;

    const cashMensal = arrecadacao * (pMensal / 100);
    const cashDigital = arrecadacao * (pDigital / 100);
    const cashAnual = arrecadacao * (pAnual / 100);
    const cashTotal = cashMensal + cashDigital + cashAnual;

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
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter leading-none">
                                Simulador de <span className="text-emerald-500">Ganhos em Rede</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium">
                                Ajuste os parâmetros abaixo para calcular em tempo real quanto você pode acumular de cashback mensal, digital e anual através do consumo da sua rede.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            {/* Inputs & Parameters */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 space-y-6">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Simulador de Ganhos</h3>

                                    {/* Indicados input */}
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Indicados por pessoa (G1 a G5)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Ex: 5"
                                            value={indicadosStr}
                                            onChange={(e) => setIndicadosStr(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-700 transition-all"
                                        />
                                        <p className="text-[12px] text-slate-500 font-medium italic">Insira a quantidade média de pessoas que cada membro indicará.</p>
                                    </div>

                                    {/* Consumo input */}
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Unidades compradas por pessoa / mês</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Ex: 4"
                                            value={quantidadeStr}
                                            onChange={(e) => setQuantidadeStr(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-700 transition-all"
                                        />
                                        <p className="text-[12px] text-slate-500 font-medium italic">Insira a quantidade de unidades compradas mensalmente por cada membro.</p>
                                    </div>

                                    {/* Preço input */}
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Preço Unitário do Produto</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-6 font-black text-slate-500 text-sm">R$</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Ex: 7,00"
                                                value={precoStr}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                                                    setPrecoStr(val);
                                                }}
                                                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-700 transition-all"
                                            />
                                        </div>
                                        <p className="text-[12px] text-slate-500 font-medium italic">Insira o preço unitário do produto ou serviço simulado.</p>
                                    </div>
                                </div>

                                {/* Rede População por Geração */}
                                <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 space-y-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Crescimento de Membros por Nível</h3>
                                    <div className="grid grid-cols-6 gap-2">
                                        {[
                                            { label: 'G0 (Você)', val: g0 },
                                            { label: 'G1 (Direto)', val: g2 },
                                            { label: 'G2 (Ind.)', val: g3 },
                                            { label: 'G3 (Ind.)', val: g4 },
                                            { label: 'G4 (Ind.)', val: g5 },
                                            { label: 'G5 (Ind.)', val: g6 }
                                        ].map((g, idx) => (
                                            <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{g.label}</span>
                                                <span className="text-xs font-black text-white">{g.val.toLocaleString('pt-BR')}</span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter mt-1">Afiliado(s)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Results Display */}
                            <div className="lg:col-span-5 relative lg:h-full">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                                <div className="relative bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">

                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Simulação Ativa</p>
                                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Resultados Estimados</h4>
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Rede Total (com você)</p>
                                            <p className="text-xl font-black text-white tracking-tighter">{totalPessoas.toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-bold uppercase">Membros</span></p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Arrecadação Rede</p>
                                            <p className="text-xl font-black text-emerald-400 tracking-tighter">R$ {arrecadacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    {/* Main Profit display */}
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl text-midnight shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Wallet size={80} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-emerald-100">Rendimento Mensal Estimado</p>
                                        <h2 className="text-4xl font-black italic tracking-tighter leading-none text-white">
                                            R$ {(cashMensal + cashDigital).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                        <p className="text-[8px] font-bold text-emerald-200 uppercase tracking-wider mt-3">Soma do Cashback Mensal (PIX) + Cashback Digital (Carteira)</p>
                                    </div>

                                    {/* Detailed breakdown list */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-xs font-black text-white">Cashback Mensal ({pMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Depósito automático via PIX</p>
                                            </div>
                                            <span className="text-sm font-black text-white">R$ {cashMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-xs font-black text-white">Cashback Digital ({pDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Saldo livre na carteira virtual</p>
                                            </div>
                                            <span className="text-sm font-black text-white">R$ {cashDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-xs font-black text-white">Cashback Anual ({pAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Acúmulo pago em 10 de Dezembro</p>
                                            </div>
                                            <span className="text-sm font-black text-indigo-400">R$ {cashAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    {/* Goal progress */}
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        {(() => {
                                            const progress = Math.min(100, (totalPessoas / 1000) * 100);
                                            const isGoalAchieved = totalPessoas >= 1000;
                                            return (
                                                <>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Progresso para Independência (G5)</span>
                                                        <span className="font-black text-white">{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 0.8 }}
                                                            className={`h-full rounded-full ${isGoalAchieved ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-emerald-500'}`}
                                                        />
                                                    </div>
                                                    <p className="text-[15px] text-slate-400 font-medium leading-relaxed">
                                                        {isGoalAchieved
                                                            ? 'Parabéns! Sua rede ultrapassou 1.000 membros, atingindo o topo da meta de independência financeira.'
                                                            : `Com ${totalPessoas.toLocaleString('pt-BR')} pessoas consumindo na sua rede, você está no caminho da meta de Independência Financeira (1.000 membros).`
                                                        }
                                                    </p>
                                                </>
                                            );
                                        })()}
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
                            <Link to="/termos-uso" className="text-xs font-bold hover:text-white transition-colors">Termos de Uso</Link>
                            <Link to="/termos-privacidade" className="text-xs font-bold hover:text-white transition-colors">Privacidade</Link>
                            <Link to="/politica-cookies" className="text-xs font-bold hover:text-white transition-colors">Cookies</Link>
                            <div className="flex gap-6 border-l border-slate-800 pl-6">
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
                                <a href="#" className="hover:text-emerald-500 transition-colors"><Linkedin size={20} /></a>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
                        <div className="flex flex-col items-center md:items-start gap-1">
                            <p>© 2026 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
                            <p className="opacity-50 lowercase font-medium tracking-normal">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">P4D Mídia</a> | <Link to="/termos-uso" className="hover:text-emerald-500 transition-colors">Termos de Uso</Link> | <Link to="/termos-privacidade" className="hover:text-emerald-500 transition-colors">Termos de Privacidade</Link> | <Link to="/politica-cookies" className="hover:text-emerald-500 transition-colors">Política de Cookies</Link></p>
                        </div>
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
