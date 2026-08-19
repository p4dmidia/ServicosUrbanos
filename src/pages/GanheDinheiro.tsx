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
  Percent,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function GanheDinheiro() {
  const [indInicialStr, setIndInicialStr] = useState('5');
  const [indMensalStr, setIndMensalStr] = useState('1');
  const [planPriceStr, setPlanPriceStr] = useState('30');
  const [isRegional, setIsRegional] = useState(false);

  const indInicial = Number(indInicialStr) || 0;
  const indMensal = Number(indMensalStr) || 0;
  const planPrice = Number(planPriceStr) || 0;

  // INSS Progressive Calculation
  function computeINSS(bruto: number): number {
    if (bruto <= 1621) {
      return bruto * 0.075;
    } else if (bruto <= 2902.84) {
      return (bruto - 1621) * 0.09 + 1621 * 0.075;
    } else if (bruto <= 4354.27) {
      return (bruto - 2902.84) * 0.12 + (2902.84 - 1621) * 0.09 + 1621 * 0.075;
    } else if (bruto <= 8475.55) {
      return (bruto - 4354.27) * 0.14 + (4354.27 - 2902.84) * 0.12 + (2902.84 - 1621) * 0.09 + 1621 * 0.075;
    } else {
      return 988.09;
    }
  }

  // IRPF Progressive Calculation
  function computeIRPF(bruto: number): number {
    if (bruto <= 5000) {
      return 0;
    } else if (bruto <= 7350) {
      return (bruto * 0.275 - 908.73) - (978.62 - 0.133145 * bruto);
    } else {
      return bruto * 0.275 - 908.73;
    }
  }

  // Helper to calculate total G1 to G3 geometric network size (Levels 4 and 5 do not exist anymore)
  const getNetworkSize = (invites: number) => {
    let size = 0;
    let levelSize = 1;
    for (let i = 1; i <= 3; i++) {
      levelSize *= invites;
      size += levelSize;
    }
    return size;
  };

  // Helper to distribute network pool into levels G1 to G3 proportionally
  const distributeToLevels = (totalPool: number, invites: number) => {
    const r1 = invites;
    const r2 = invites * invites;
    const r3 = invites * invites * invites;
    const sum = r1 + r2 + r3 || 1;

    return {
      lvl1: totalPool * (r1 / sum),
      lvl2: totalPool * (r2 / sum),
      lvl3: totalPool * (r3 / sum)
    };
  };

  // Generate Simulation Data
  // 3 setup months + 12 simulation months
  const runSimulation = () => {
    const initialSize = getNetworkSize(indInicial);
    
    // Setup Months
    // Setup 1 (Ago-26)
    const s1_levels = distributeToLevels(initialSize, indInicial);
    const s1 = {
      name: 'Ago-26',
      total: initialSize,
      novos: initialSize,
      levels: s1_levels,
      cashDM: initialSize * planPrice * 0.05,
      cashAnual: 0
    };

    // Setup 2 (Set-26)
    const s2_novos = s1.total * indInicial;
    const s2_levels = distributeToLevels(s2_novos, indInicial);
    const s2 = {
      name: 'Set-26',
      total: s1.total,
      novos: s2_novos,
      levels: s2_levels,
      cashDM: s2_novos * planPrice * 0.05,
      cashAnual: (s2_novos * planPrice * 0.05) * 0.01
    };

    // Setup 3 (Out-26)
    const s3_novos = (s2.total + s2.novos) * indInicial;
    const s3_levels = distributeToLevels(s3_novos, indInicial);
    const s3 = {
      name: 'Out-26',
      total: s2.total + s2.novos,
      novos: s3_novos,
      levels: s3_levels,
      cashDM: s3_novos * planPrice * 0.05,
      cashAnual: (s3_novos * planPrice * 0.05) * 0.01
    };

    const history = [s1, s2, s3];
    const months = ['Dez-26', 'Jan-27', 'Fev-27', 'Mar-27', 'Abr-27', 'Mai-27', 'Jun-27', 'Jul-27', 'Ago-27', 'Set-27', 'Out-27', 'Nov-27'];
    const simResult = [];

    // Accumulators for annual payouts
    let accumulatedCashAnual = 0;
    let accumulatedRenovacaoAnual = 0;

    for (let i = 0; i < 12; i++) {
      const prev = history[history.length - 1];
      const total = prev.total + prev.novos;
      const novos = total * indMensal;
      const current_levels = distributeToLevels(novos, indInicial);

      // Calculations based on the new MMN rules (G0, G1, G2 and Regional Reseller)
      // Level 1 of your network corresponds to G0 direct sales (20% weekly, 1% monthly, 1% yearly)
      // Level 2 corresponds to G1 (1% monthly, 1% yearly)
      // Level 3 corresponds to G2 (1% monthly, 1% yearly)
      // If Regional, gets +4% weekly, +1% monthly, +1% yearly on all G0-G2 levels

      const faturamentoLvl1 = current_levels.lvl1 * planPrice;
      const faturamentoLvl2 = current_levels.lvl2 * planPrice;
      const faturamentoLvl3 = current_levels.lvl3 * planPrice;
      const faturamentoTotal = novos * planPrice;

      // Direct (G0) commissions
      const g0Semanal = faturamentoLvl1 * 0.20;
      const g0Mensal = faturamentoLvl1 * 0.01;
      const g0Anual = faturamentoLvl1 * 0.01;

      // Network G1 & G2 commissions
      const g1Mensal = faturamentoLvl2 * 0.01;
      const g1Anual = faturamentoLvl2 * 0.01;
      const g2Mensal = faturamentoLvl3 * 0.01;
      const g2Anual = faturamentoLvl3 * 0.01;

      // Regional Reseller commissions
      const regSemanal = isRegional ? faturamentoTotal * 0.04 : 0;
      const regMensal = isRegional ? faturamentoTotal * 0.01 : 0;
      const regAnual = isRegional ? faturamentoTotal * 0.01 : 0;

      // Weekly (Semanal): Direct (20% on Level 1) + Regional (4% on total pool, if applicable)
      const semanal = g0Semanal + regSemanal;

      // Monthly (Mensal): 1% on G0(Lvl1), G1(Lvl2), G2(Lvl3) + Regional (1% on total pool, if applicable)
      const mensal = g0Mensal + g1Mensal + g2Mensal + regMensal;

      // Yearly (Anual): 1% on G0(Lvl1), G1(Lvl2), G2(Lvl3) + Regional (1% on total pool, if applicable)
      const anual = g0Anual + g1Anual + g2Anual + regAnual;

      // Renewals from T-3 (reference month)
      const refMonth = history[history.length - 3];
      const ref_levels = distributeToLevels(refMonth.novos, indInicial);
      const refFaturamentoLvl1 = ref_levels.lvl1 * planPrice;
      const refFaturamentoLvl2 = ref_levels.lvl2 * planPrice;
      const refFaturamentoLvl3 = ref_levels.lvl3 * planPrice;
      const refFaturamentoTotal = refMonth.novos * planPrice;

      const refG0Semanal = refFaturamentoLvl1 * 0.20;
      const refG0Mensal = refFaturamentoLvl1 * 0.01;
      const refG0Anual = refFaturamentoLvl1 * 0.01;

      const refG1Mensal = refFaturamentoLvl2 * 0.01;
      const refG1Anual = refFaturamentoLvl2 * 0.01;
      const refG2Mensal = refFaturamentoLvl3 * 0.01;
      const refG2Anual = refFaturamentoLvl3 * 0.01;

      const refRegSemanal = isRegional ? refFaturamentoTotal * 0.04 : 0;
      const refRegMensal = isRegional ? refFaturamentoTotal * 0.01 : 0;
      const refRegAnual = isRegional ? refFaturamentoTotal * 0.01 : 0;

      const renovacaoSemanal = refG0Semanal + refRegSemanal;
      const renovacaoMensal = refG0Mensal + refG1Mensal + refG2Mensal + refRegMensal;
      const renovacaoAnual = refG0Anual + refG1Anual + refG2Anual + refRegAnual;

      accumulatedCashAnual += anual;
      accumulatedRenovacaoAnual += renovacaoAnual;

      // Total gross for the month: current semanal + current mensal + renewal semanal + renewal mensal
      let bruto = semanal + mensal + renovacaoSemanal + renovacaoMensal;
      
      // If it is the 12th month (Nov-27), pay out all accumulated annual cash
      const is12th = (i === 11);
      if (is12th) {
        bruto += accumulatedCashAnual + accumulatedRenovacaoAnual;
      }

      const inss = computeINSS(bruto);
      const irpf = computeIRPF(bruto);
      const recebidoPF = bruto - inss - irpf;

      const current = {
        name: months[i],
        total,
        novos,
        semanal,
        mensal,
        anual,
        renovacaoSemanal,
        renovacaoMensal,
        renovacaoAnual,
        bruto,
        inss,
        irpf,
        recebidoPF,
        recebidoMEI: bruto,
        g0Semanal,
        g0Mensal,
        g0Anual,
        g1Mensal,
        g1Anual,
        g2Mensal,
        g2Anual,
        regSemanal,
        regMensal,
        regAnual,
        renovacaoG0Semanal: refG0Semanal,
        renovacaoG0Mensal: refG0Mensal,
        renovacaoG1Mensal: refG1Mensal,
        renovacaoG2Mensal: refG2Mensal,
        renovacaoRegSemanal: refRegSemanal,
        renovacaoRegMensal: refRegMensal
      };

      history.push({
        name: current.name,
        total: current.total,
        novos: current.novos,
        cashDM: novos * planPrice * 0.05, // compatibility for T-3 references
        cashAnual: novos * planPrice * 0.01
      });

      simResult.push(current);
    }

    return simResult;
  };

  const simulationData = runSimulation();
  // Get totals
  const totalBrutoSimulated = simulationData.reduce((acc, m) => acc + m.bruto, 0);
  const totalRecebidoPF = simulationData.reduce((acc, m) => acc + m.recebidoPF, 0);
  const totalRecebidoMEI = simulationData.reduce((acc, m) => acc + m.recebidoMEI, 0);
  const totalDescontosPF = totalBrutoSimulated - totalRecebidoPF;

  // Selected month for comparison details
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const selMonth = simulationData[selectedMonthIdx] || simulationData[0];

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
            <span className="inline-block bg-accent/10 border border-accent/20 text-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              Programa de Afiliados Serviços Urbanos
            </span>
            <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight max-w-5xl mx-auto">
              Ganhe recorrente indicando o <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">Seguro Premiável.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium">
              Transforme a indicação de assinaturas de seguros em uma fonte sólida de rendimento recorrente. Nosso simulador projeta seus ganhos de rede com base nas novas regras de comissões (G0 a G2) e demonstra a diferença entre Pessoa Física e MEI.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                to="/cadastro"
                className="bg-accent hover:bg-emerald-500 text-midnight px-12 py-5 rounded-2xl text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20 flex items-center gap-3 uppercase tracking-tighter"
              >
                Ativar meu plano e indicar
                <ChevronRight size={24} />
              </Link>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-24 border-b border-white/5 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Fluxo Simplificado</h2>
              <div className="w-20 h-1.5 bg-accent mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">1. Selecione um Plano</h3>
                <p className="text-slate-400 leading-relaxed text-sm font-medium">
                  Adira a um dos planos ativos no marketplace para garantir sua proteção e liberar seu link de indicação.
                </p>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <Users size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">2. Indique Amigos</h3>
                <p className="text-slate-400 leading-relaxed text-sm font-medium">
                  Divulgue seu link exclusivo. Todos que aderirem terão os mesmos benefícios de proteção, sorteios e afiliação.
                </p>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                <div className="size-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                  <Wallet size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">3. Receba em Rede</h3>
                <p className="text-slate-400 leading-relaxed text-sm font-medium">
                  Ganhe repasses recorrentes semanais, mensais e o bônus anual acumulado sobre as assinaturas de G0 a G2 da sua rede.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Simulador de Ganhos MMN & Comparativo PF vs MEI */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-20 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                Simulador Oficial MMN v3
              </h2>
              <p className="text-slate-400 font-medium">
                Simule em tempo real o crescimento da sua rede de afiliados e confira o impacto dos tributos (Pessoa Física vs. MEI) sobre as suas comissões acumuladas pelas regras oficiais (G0 a G2 + Regional).
              </p>
            </div>

            {/* Inputs de Configuração */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
              <div className="space-y-2">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Indicações Iniciais G1 a G3</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={indInicialStr}
                  onChange={(e) => setIndInicialStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
                <p className="text-[10px] text-slate-500 font-bold italic">Quantidade que cada membro convida inicialmente.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Indicações Mensais por Membro (IND)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={indMensalStr}
                  onChange={(e) => setIndMensalStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
                <p className="text-[10px] text-slate-500 font-bold italic">Fator de crescimento mensal da rede.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Simular com Valor de Plano (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={planPriceStr}
                  onChange={(e) => setPlanPriceStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
                <p className="text-[10px] text-slate-500 font-bold italic">Mensalidade base da simulação.</p>
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">Tipo de Afiliação Regional</label>
                <button
                  type="button"
                  onClick={() => setIsRegional(!isRegional)}
                  className={`w-full py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                    isRegional
                      ? 'bg-accent text-midnight border-accent shadow-lg shadow-accent/20'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {isRegional ? '✓ Líder Regional Ativo (+6%)' : 'Afiliado Padrão'}
                </button>
                <p className="text-[10px] text-slate-500 font-bold italic">Líder Regional ganha comissão de 6% sobre toda a rede.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Resumo de Projeção Anual */}
              <div className="lg:col-span-5 space-y-6">
                <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Simulação de Ganhos</p>
                      <h4 className="text-md font-black text-white uppercase tracking-tight">Regras de Níveis G0 a G2</h4>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Tamanho Total da Rede</p>
                        <p className="text-lg font-black text-white mt-1">{(getNetworkSize(indInicial) + 1).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-bold uppercase">Membros</span></p>
                      </div>
                      <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded font-bold uppercase">Níveis G1 a G3</span>
                    </div>

                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-2">Comissões Totais Simulação (Bruto Anual)</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">R$ {totalBrutoSimulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>

                    {/* Compare Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Líquido Pessoa Física</p>
                        <p className="text-md font-black text-white mt-1">R$ {totalRecebidoPF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[8px] text-red-500 font-medium mt-1">Deduções de R$ {totalDescontosPF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (IRPF/INSS)</p>
                      </div>
                      <div className="bg-accent/5 border border-accent/10 p-4 rounded-2xl">
                        <p className="text-[9px] text-accent font-bold uppercase tracking-wider">Líquido MEI</p>
                        <p className="text-md font-black text-white mt-1">R$ {totalRecebidoMEI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[8px] text-accent font-medium mt-1">Isento na fonte (0% de imposto retido)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-midnight shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Bônus MEI em Relação à PF</p>
                    <p className="text-2xl font-black text-white tracking-tight mt-1">+ R$ {(totalRecebidoMEI - totalRecebidoPF).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider mt-2">Formalizar-se como MEI garante mais de R$ {(totalRecebidoMEI - totalRecebidoPF).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} líquidos extras!</p>
                  </div>
                </div>
              </div>

              {/* Tabela Dinâmica do Mês a Mês */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Cronograma de Repasses e Ganhos</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Dezembro 2026 a Novembro 2027</span>
                  </div>

                  {/* Table Layout */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-500 font-black uppercase tracking-wider border-b border-white/5">
                          <th className="py-3 px-2">Mês</th>
                          <th className="py-3 px-2 text-right">Rede Total</th>
                          <th className="py-3 px-2 text-right">Novos</th>
                          <th className="py-3 px-2 text-right">C. Semanal</th>
                          <th className="py-3 px-2 text-right">C. Mensal</th>
                          <th className="py-3 px-2 text-right">C. Anual</th>
                          <th className="py-3 px-2 text-right">Bruto</th>
                          <th className="py-3 px-2 text-right text-red-400">PF Líquido</th>
                          <th className="py-3 px-2 text-right text-accent">MEI Líquido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {simulationData.map((m, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedMonthIdx(idx)}
                            className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedMonthIdx === idx ? 'bg-white/5 border-l-2 border-accent' : ''}`}
                          >
                            <td className="py-3.5 px-2 font-bold text-white">{m.name}</td>
                            <td className="py-3.5 px-2 text-right text-slate-300 font-medium">{m.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-2 text-right text-slate-300 font-medium">{m.novos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-2 text-right text-slate-400 font-medium">R$ {m.semanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-2 text-right text-slate-400 font-medium">R$ {m.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-2 text-right text-slate-400 font-medium">R$ {m.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-2 text-right text-slate-300 font-bold">R$ {m.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-2 text-right text-red-300 font-medium">R$ {m.recebidoPF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-2 text-right text-accent font-bold">R$ {m.recebidoMEI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium italic">Clique em um mês para conferir o demonstrativo detalhado de descontos logo abaixo.</p>
                </div>
              </div>
            </div>

            {/* Demonstrativo Detalhado de Impostos (Mês Selecionado) */}
            <motion.div
              key={selectedMonthIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-white uppercase tracking-tight">Demonstrativo de Impostos Retidos na Fonte</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Detalhamento para o mês de {selMonth.name}</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Faturamento Bruto: R$ {selMonth.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* MMN breakdown list */}
              <div className={`grid ${isRegional ? 'grid-cols-4' : 'grid-cols-3'} gap-4 pb-4 border-b border-white/5 text-xs`}>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Vendas G0 (Direto Lvl 1)</p>
                  <p className="text-sm font-black text-white">R$ {selMonth.g0Semanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Semanal (20%)</span></p>
                  <p className="text-[10px] font-bold text-accent mt-1">R$ {selMonth.g0Mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Mensal (1%)</span></p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Rede G1 & G2 (Lvl 2 e 3)</p>
                  <p className="text-sm font-black text-white">R$ {(selMonth.g1Mensal + selMonth.g2Mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Mensal (1%+1%)</span></p>
                  <p className="text-[10px] font-bold text-indigo-400 mt-1">R$ {(selMonth.g1Anual + selMonth.g2Anual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Anual (1%+1%)</span></p>
                </div>
                {isRegional && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 border-accent/20">
                    <p className="text-[9px] text-accent font-black uppercase mb-1.5">Líder Regional (+6% total)</p>
                    <p className="text-sm font-black text-white">R$ {selMonth.regSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Semanal (4%)</span></p>
                    <p className="text-[10px] font-bold text-accent mt-1">R$ {selMonth.regMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Mensal/Anual (1%+1%)</span></p>
                  </div>
                )}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Renovação ($T-3$)</p>
                  <p className="text-sm font-black text-white">R$ {selMonth.renovacaoSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Semanal (G0/Reg)</span></p>
                  <p className="text-[10px] font-bold text-accent mt-1">R$ {selMonth.renovacaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-medium">Mensal/Anual</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column PF */}
                <div className="space-y-4 bg-slate-900/30 p-6 rounded-2xl border border-white/5 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Cenário: Pessoa Física (PF)</span>
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-black uppercase">Tributação Alta</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Rendimento Bruto</span>
                      <span className="text-white font-bold">R$ {selMonth.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Desconto INSS (Progressivo)</span>
                      <span className="text-red-400 font-bold">- R$ {selMonth.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Desconto IRPF (Progressivo)</span>
                      <span className="text-red-400 font-bold">- R$ {selMonth.irpf.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm font-black text-white">
                      <span>Líquido Recebido</span>
                      <span className="text-white">R$ {selMonth.recebidoPF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  {selMonth.bruto > 7350 && (
                    <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl flex gap-2 items-start mt-4">
                      <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-slate-400 leading-normal font-medium">
                        Por receber como Pessoa Física, você entra na alíquota máxima de IRPF (27.5% de retenção na fonte sobre o valor tributável).
                      </p>
                    </div>
                  )}
                </div>

                {/* Column MEI */}
                <div className="space-y-4 bg-slate-900/30 p-6 rounded-2xl border border-white/5 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Cenário: Microempreendedor Individual (MEI)</span>
                    <span className="text-[10px] bg-accent/15 border border-accent/25 text-accent px-2 py-0.5 rounded font-black uppercase">100% Livre de Retenção</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Rendimento Bruto</span>
                      <span className="text-white font-bold">R$ {selMonth.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Desconto INSS</span>
                      <span className="text-slate-500 font-bold">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-slate-400">
                      <span>Desconto IRPF na Fonte</span>
                      <span className="text-slate-500 font-bold">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm font-black text-white">
                      <span>Líquido Recebido</span>
                      <span className="text-accent font-black">R$ {selMonth.recebidoMEI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex gap-2 items-start mt-4">
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-400 leading-normal font-medium">
                      O MEI não sofre descontos de INSS ou IRPF na fonte. Os repasses são efetuados de forma integral, maximizando sua receita.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      {/* Sistema 100% transparente */}
      <section className="py-24 border-t border-white/5 bg-slate-950/20 text-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-3xl mb-8">
            <ShieldCheck className="text-accent animate-pulse" size={48} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-white">Sistema 100% transparente.</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
            Ganhos baseados em consumo real de planos do ecossistema. Sem taxas ocultas, sem promessas vazias. Economia compartilhada de verdade.
          </p>

          <Link
            to="/cadastro"
            className="bg-accent hover:bg-emerald-500 text-midnight px-16 py-6 rounded-2xl text-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20 uppercase tracking-tighter inline-block"
          >
            Cadastre-se e Pegue seu Link
          </Link>
        </div>
      </section>
    </main>

    {/* Footer simples */}
    <footer className="bg-black text-slate-500 py-16 px-6 lg:px-20 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex items-center gap-2 text-white">
            <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
              <LayoutGrid size={14} />
            </div>
            <span className="text-lg font-bold">Serviços Urbanos</span>
          </div>

          <div className="flex gap-8 items-center text-xs">
            <Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link to="/ecossistema" className="hover:text-white transition-colors">Ecossistema</Link>
            <Link to="/termos-uso" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/termos-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link to="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link>
            <div className="flex gap-6 border-l border-slate-800 pl-6">
              <a href="#" className="hover:text-accent transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-accent transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-accent transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>© 2026 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
            <p className="opacity-50 lowercase font-medium tracking-normal">
              Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">P4D Mídia</a> | <Link to="/termos-uso" className="hover:text-accent transition-colors">Termos de Uso</Link> | <Link to="/termos-privacidade" className="hover:text-accent transition-colors">Termos de Privacidade</Link> | <Link to="/politica-cookies" className="hover:text-accent transition-colors">Política de Cookies</Link>
            </p>
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
