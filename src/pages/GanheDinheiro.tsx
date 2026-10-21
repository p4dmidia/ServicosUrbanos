import React, { useState } from 'react';
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
  Linkedin,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Calculator,
  UserCheck,
  Building,
  Briefcase,
  Sparkles,
  Calendar,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { calculateTaxDeductions } from '../lib/businessRules';

export default function GanheDinheiro() {
  // Planos oficiais do Seguro Vida Light (Produto B)
  const [selectedPlanValue, setSelectedPlanValue] = useState<number>(5.00); // 5, 15, 30, 48
  const [g0MembersStr, setG0MembersStr] = useState('20'); // Clientes Diretos (G0)
  const [g1MembersStr, setG1MembersStr] = useState('100'); // Clientes Nível 1 (G1)
  const [g2MembersStr, setG2MembersStr] = useState('300'); // Clientes Nível 2 (G2)

  const g0 = Math.max(0, Number(g0MembersStr) || 0);
  const g1 = Math.max(0, Number(g1MembersStr) || 0);
  const g2 = Math.max(0, Number(g2MembersStr) || 0);

  const totalVendasRede = g0 + g1 + g2;
  const faturamentoTotalRede = totalVendasRede * selectedPlanValue;

  // Regra Oficial de Comissionamento Microfranqueado (33% no total)
  // G0 (Direto): 21% Semanal + 2% Anual = 23% Total
  // G1 (Indireto 1): 3% Semanal + 2% Anual = 5% Total
  // G2 (Indireto 2): 3% Semanal + 2% Anual = 5% Total
  const semanalG0 = g0 * selectedPlanValue * 0.21;
  const anualG0 = g0 * selectedPlanValue * 0.02;
  const comissaoBrutaG0 = semanalG0 + anualG0;

  const semanalG1 = g1 * selectedPlanValue * 0.03;
  const anualG1 = g1 * selectedPlanValue * 0.02;
  const comissaoBrutaG1 = semanalG1 + anualG1;

  const semanalG2 = g2 * selectedPlanValue * 0.03;
  const anualG2 = g2 * selectedPlanValue * 0.02;
  const comissaoBrutaG2 = semanalG2 + anualG2;

  // Totais Oficiais:
  // Semanal: 21% + 3% + 3% = 27% (pago na terça-feira das vendas de seg a sáb)
  // Anual: 2% + 2% + 2% = 6% (pago em 10 de Dezembro, ciclo 01.11.25 a 30.11.26)
  const splitSemanal80 = semanalG0 + semanalG1 + semanalG2; // 27%
  const splitAnual20 = anualG0 + anualG1 + anualG2; // 6%
  const comissaoBrutaTotal = splitSemanal80 + splitAnual20; // 33%

  // Base para cálculo tributário (mensal estimada baseada no repasse semanal * 4)
  const estimativaMensalBruto = splitSemanal80 * 4;

  // Tributação PF (RPA com retenção) vs MEI (Emissão de NF sem retenção na fonte)
  const taxesPF = calculateTaxDeductions(estimativaMensalBruto, false);
  const taxesMEI = calculateTaxDeductions(estimativaMensalBruto, true);
  const economiaMEI = Math.max(0, taxesMEI.liquido - taxesPF.liquido);

  const planOptions = [
    { label: 'Mensal', price: 5.00, desc: 'R$ 5,00 / mês' },
    { label: 'Trimestral', price: 15.00, desc: 'R$ 15,00 / trim' },
    { label: 'Semestral', price: 30.00, desc: 'R$ 30,00 / sem' },
    { label: 'Anual', price: 48.00, desc: 'R$ 48,00 / ano' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-midnight text-slate-100 overflow-x-hidden">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full py-20 lg:py-32 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-accent rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary-blue rounded-full blur-[150px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10 text-center space-y-6">
            <span className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <Briefcase size={14} />
              Programa Oficial de Microfranqueados
            </span>
            <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight max-w-5xl mx-auto">
              Ganhe até <span className="bg-gradient-to-r from-accent via-emerald-400 to-teal-300 bg-clip-text text-transparent">33% de comissão</span> distribuindo o Seguro Vida Light.
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium">
              Como Microfranqueado você constrói uma carteira comercial rentável com <strong>21% semanal + 2% anual direto (G0)</strong> e <strong>3% semanal + 2% anual em rede (G1 e G2)</strong>. Repasses: <strong>27% semanalmente na terça-feira</strong> e <strong>6% no bônus anual em 10 de dezembro</strong>.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/cadastro"
                className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-5 rounded-2xl text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20 flex items-center gap-3 uppercase tracking-tighter"
              >
                Tornar-se Microfranqueado
                <ChevronRight size={22} />
              </Link>
              <Link
                to="/cadastro"
                className="bg-white/10 hover:bg-white/15 text-white px-8 py-5 rounded-2xl text-base font-bold transition-all border border-white/15 flex items-center gap-2"
              >
                Apenas Contratar Seguro (R$ 5/mês)
              </Link>
            </div>

            {/* Aviso de Transparência Jurídica */}
            <div className="max-w-2xl mx-auto p-3.5 bg-blue-950/40 border border-blue-500/20 rounded-2xl text-xs text-blue-200/80 font-medium text-center">
              🛡️ <strong>Transparência Jurídica:</strong> Clientes que contratam apenas o Seguro Vida Light (Afiliados Premium) são estritamente consumidores de seguro e sorteios. O comissionamento em rede é restrito aos Microfranqueados devidamente licenciados.
            </div>
          </div>
        </section>

        {/* Como Funciona a Microfranquia */}
        <section className="py-24 border-b border-white/5 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Como Funciona o Modelo</h2>
              <div className="w-20 h-1.5 bg-accent mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">1. Licença de Franquia</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Adquira a licença comercial anual (R$ 150/ano). <strong>Os 100 primeiros têm isenção inicial</strong> com desconto direto no bônus de dezembro.
                </p>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">2. Seguro Vida Light</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Ofereça o produto ao público final a partir de <strong>R$ 5,00/mês</strong> com seguro MBM R$ 5.000, telemedicina 24h e sorteios pela Loteria Federal.
                </p>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <TrendingUp size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">3. G0 21%+2% | G1 3%+2% | G2 3%+2%</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Receba 21% semanal + 2% anual nas vendas diretas (G0) e 3% semanal + 2% anual na equipe (G1 e G2), totalizando 33% de comissão oficial.
                </p>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <Wallet size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">4. 27% Semanal / 6% Anual</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  <strong>27% semanal</strong> liberado toda terça-feira (vendas seg a sáb) e <strong>6% anual</strong> pago em 10 de dezembro (ciclo 01.11.25 a 30.11.26).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Simulador Oficial e Interativo */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-20 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                Simulador de Comissões do Microfranqueado
              </h2>
              <p className="text-slate-400 font-medium text-sm">
                Selecione o plano do Seguro Vida Light contratado pelos clientes e projete seus ganhos nos 3 níveis de comissão e no split 80% semanal e 20% anual.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Inputs Panel */}
              <div className="lg:col-span-5 space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Calculator size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Parâmetros de Simulação</h3>
                </div>

                {/* Seleção do Plano do Seguro */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    Plano do Seguro Vida Light Comercializado
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {planOptions.map((plan) => (
                      <button
                        key={plan.price}
                        type="button"
                        onClick={() => setSelectedPlanValue(plan.price)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          selectedPlanValue === plan.price
                            ? 'bg-accent/15 border-accent text-white shadow-lg shadow-accent/10'
                            : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-black uppercase">{plan.label}</p>
                        <p className="text-base font-black text-accent mt-0.5">{plan.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vendas Diretas G0 (21% semanal + 2% anual) */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-wider block">Vendas Diretas G0</label>
                      <span className="text-[10px] text-emerald-400 font-bold">21% Semanal + 2% Anual (23% Total)</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={g0MembersStr}
                      onChange={(e) => setG0MembersStr(e.target.value.replace(/\D/g, ''))}
                      className="w-24 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="5"
                    value={g0}
                    onChange={(e) => setG0MembersStr(e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>1 Cliente</span>
                    <span>250 Clientes</span>
                    <span>500 Clientes</span>
                  </div>
                </div>

                {/* Equipe Nível 1 - G1 (3% semanal + 2% anual) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-wider block">Equipe Nível 1 (G1)</label>
                      <span className="text-[10px] text-sky-400 font-bold">3% Semanal + 2% Anual (5% Total)</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={g1MembersStr}
                      onChange={(e) => setG1MembersStr(e.target.value.replace(/\D/g, ''))}
                      className="w-24 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={g1}
                    onChange={(e) => setG1MembersStr(e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>0 Clientes</span>
                    <span>500 Clientes</span>
                    <span>1.000 Clientes</span>
                  </div>
                </div>

                {/* Equipe Nível 2 - G2 (3% semanal + 2% anual) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-wider block">Equipe Nível 2 (G2)</label>
                      <span className="text-[10px] text-purple-400 font-bold">3% Semanal + 2% Anual (5% Total)</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={g2MembersStr}
                      onChange={(e) => setG2MembersStr(e.target.value.replace(/\D/g, ''))}
                      className="w-24 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="20"
                    value={g2}
                    onChange={(e) => setG2MembersStr(e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>0 Clientes</span>
                    <span>1.500 Clientes</span>
                    <span>3.000 Clientes</span>
                  </div>
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="lg:col-span-7 space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
                <div>
                  {/* Faturamento e Total de Membros */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center pb-6 border-b border-white/5 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Faturamento Total Gerado na Rede</p>
                      <p className="text-3xl font-black text-white tracking-tighter">
                        R$ {faturamentoTotalRede.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <Users size={20} className="text-accent" />
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Total de Segurados</p>
                        <p className="text-sm font-black text-white">{totalVendasRede.toLocaleString('pt-BR')} Vendas</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento por Nível G0, G1, G2 */}
                  <div className="grid grid-cols-3 gap-3 my-6">
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider mb-1">G0 Direto (21% + 2%)</p>
                      <p className="text-base font-black text-white">R$ {comissaoBrutaG0.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{g0} clientes</p>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-sky-500/20">
                      <p className="text-[9px] text-sky-400 font-black uppercase tracking-wider mb-1">G1 Nível 1 (3% + 2%)</p>
                      <p className="text-base font-black text-white">R$ {comissaoBrutaG1.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{g1} clientes</p>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-purple-500/20">
                      <p className="text-[9px] text-purple-400 font-black uppercase tracking-wider mb-1">G2 Nível 2 (3% + 2%)</p>
                      <p className="text-base font-black text-white">R$ {comissaoBrutaG2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{g2} clientes</p>
                    </div>
                  </div>

                  {/* Total Bruto Geral */}
                  <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950/80 p-5 rounded-2xl border border-emerald-500/30 flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Comissão Oficial Total (33%)</p>
                      <p className="text-xs text-slate-400">G0 (23%) + G1 (5%) + G2 (5%)</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">
                      R$ {comissaoBrutaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Split Semanal 27% / Anual 6% Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Semanal 27% */}
                    <div className="bg-slate-950/70 p-5 rounded-2xl border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          Repasse Semanal (27%)
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                          Toda Terça-Feira
                        </span>
                      </div>
                      <p className="text-2xl font-black text-white">
                        R$ {splitSemanal80.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Vendas pagas de segunda a sábado da semana anterior.
                      </p>
                    </div>

                    {/* Anual 6% */}
                    <div className="bg-slate-950/70 p-5 rounded-2xl border border-indigo-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                          Bônus Anual (6%)
                        </span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                          Pago em 10/12
                        </span>
                      </div>
                      <p className="text-2xl font-black text-indigo-300">
                        R$ {splitAnual20.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Acumulado anual referente ao ciclo 01.11.25 a 30.11.26.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparativo Tributário PF vs MEI */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Comparativo de Recebimento Estimado Mensal (4 semanas)
                    </span>
                    <span className="text-sm font-black text-slate-300">
                      Bruto ~ R$ {estimativaMensalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PF Card */}
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-slate-300 uppercase">Pessoa Física (PF)</span>
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">RPA com Dedução</span>
                      </div>
                      <p className="text-lg font-black text-white">
                        R$ {taxesPF.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        INSS: -R$ {taxesPF.inss.toFixed(2)} | IRRF: -R$ {taxesPF.irrf.toFixed(2)}
                      </p>
                    </div>

                    {/* MEI Card */}
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-accent/20 shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-accent uppercase">CNPJ MEI / PJ</span>
                        <span className="text-[9px] bg-accent/15 text-accent px-2 py-0.5 rounded font-bold">Sem Retenção</span>
                      </div>
                      <p className="text-lg font-black text-accent">
                        R$ {taxesMEI.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-accent/80 mt-1 font-bold">
                        Receba 100% Bruto via Nota Fiscal
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 lg:px-20 py-24 bg-slate-950/40 border-t border-white/5">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-[3rem] p-10 lg:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
              <span className="px-3.5 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-full text-xs font-black uppercase tracking-wider inline-block">
                Início Imediato
              </span>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase italic">
                Comece a Formar Sua Equipe Agora
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto font-medium">
                Licença com 1º ano 100% gratuito (R$ 0,00) para Microfranqueados. Ative sua franquia e receba suas comissões semanais via PIX toda terça-feira.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/cadastro"
                  className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-4 rounded-2xl font-black text-base transition-all shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 uppercase tracking-tight"
                >
                  Cadastrar como Microfranqueado
                </Link>
                <Link
                  to="/cadastro"
                  className="bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all border border-white/10"
                >
                  Quero apenas o Seguro R$ 5,00/mês
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-slate-500 py-12 px-6 lg:px-20 border-t border-slate-900 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} CaZa dos Sorteios. Todos os direitos reservados.</p>
          <div className="flex gap-6 font-bold uppercase tracking-wider text-[10px]">
            <Link to="/afiliado/termo-adesao" className="hover:text-white transition-colors">Termos de Franquia</Link>
            <Link to="/afiliado/termo-adesao" className="hover:text-white transition-colors">Termos de Seguro MBM</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
