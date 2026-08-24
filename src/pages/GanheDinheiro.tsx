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
  Building
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function GanheDinheiro() {
  const [totalMembrosStr, setTotalMembrosStr] = useState('10000');
  const [planPriceStr, setPlanPriceStr] = useState('60');
  const [isRegional, setIsRegional] = useState(false);

  const totalMembros = Number(totalMembrosStr) || 0;
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

  // Calculations based on the simplified spreadsheet & MMN v4 rules
  const arrecadacao = totalMembros * planPrice;
  
  function getPlanPeriodLabel(price: number): string {
    switch (price) {
      case 20: return 'Mensal';
      case 30: return 'Trimestral';
      case 40: return 'Semestral';
      case 60: return 'Anual';
      default: return 'Mensal';
    }
  }

  const periodLabel = getPlanPeriodLabel(planPrice);
  
  // Standard affiliate commission is 2% for G0, G1, G2.
  // Regional Reseller gets an additional 2% weekly, 2% monthly, and 2% yearly.
  const rate = isRegional ? 0.04 : 0.02;

  const cashSemanal = arrecadacao * rate;
  const cashMensal = arrecadacao * rate;
  const cashAnual = arrecadacao * rate;

  // Bruto mensal a receber = Cash Semanal + Cash Mensal
  const bruto = cashSemanal + cashMensal;

  const inss = computeINSS(bruto);
  const irrf = computeIRPF(bruto);
  const recebidoPF = bruto - inss - irrf;
  const recebidoMEI = bruto;

  const economiaMEI = recebidoMEI - recebidoPF;

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
              Transforme a indicação de assinaturas em faturamento recorrente. Use o nosso simulador simplificado para ver o potencial de ganhos da sua rede e a diferença real de receber como Pessoa Física ou MEI.
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

        {/* Novo Simulador Simplificado */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-20 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                Calculadora de Ganhos Simplificada
              </h2>
              <p className="text-slate-400 font-medium">
                Arraste os seletores abaixo ou digite os valores para projetar os repasses de rede imediatos e comparar a diferença tributária entre Pessoa Física e MEI.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Inputs Panel */}
              <div className="lg:col-span-5 space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Calculator size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Configurações da Rede</h3>
                </div>

                {/* Total Membros Input & Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Total de Membros (G0 a G2)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={totalMembrosStr}
                      onChange={(e) => setTotalMembrosStr(e.target.value.replace(/\D/g, ''))}
                      className="w-28 bg-slate-950 border border-white/10 rounded-xl py-2 px-4 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20000"
                    step="50"
                    value={totalMembros}
                    onChange={(e) => setTotalMembrosStr(e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>1 MEMBRO</span>
                    <span>10.000 MEMBROS</span>
                    <span>20.000 MEMBROS</span>
                  </div>
                </div>

                {/* Plan Price Input & Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Valor do Plano (R$)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={planPriceStr}
                      onChange={(e) => setPlanPriceStr(e.target.value.replace(/\D/g, ''))}
                      className="w-28 bg-slate-950 border border-white/10 rounded-xl py-2 px-4 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={planPrice}
                    onChange={(e) => setPlanPriceStr(e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>R$ 10,00</span>
                    <span>R$ 60,00</span>
                    <span>R$ 200,00</span>
                  </div>
                </div>

                {/* Regional Reseller Checkbox Toggle */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-white uppercase tracking-wider">Sou Revendedor Regional</label>
                    <p className="text-[10px] text-slate-500 font-medium italic mt-1">Acumula +2% de bônus de liderança regional.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegional(!isRegional)}
                    className={`size-7 rounded-lg border flex items-center justify-center transition-all ${
                      isRegional 
                        ? 'bg-accent border-accent text-midnight' 
                        : 'border-white/20 hover:border-white/30 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="lg:col-span-7 space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex flex-col md:flex-row justify-between md:items-center pb-6 border-b border-white/5 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Arrecadação {periodLabel} da Rede</p>
                    <p className="text-3xl font-black text-white tracking-tighter">
                      R$ {arrecadacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Users size={20} className="text-accent" />
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Tamanho da Rede</p>
                      <p className="text-sm font-black text-white">{totalMembros.toLocaleString('pt-BR')} Parceiros</p>
                    </div>
                  </div>
                </div>

                {/* Cashback Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">C. Semanal ({isRegional ? '4%' : '2%'})</p>
                    <p className="text-md font-black text-white">R$ {cashSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">C. Mensal ({isRegional ? '4%' : '2%'})</p>
                    <p className="text-md font-black text-white">R$ {cashMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">C. Anual ({isRegional ? '4%' : '2%'})</p>
                    <p className="text-md font-black text-white text-indigo-400">R$ {cashAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Bruto Mensal a Receber (Semanal + Mensal)</span>
                    <span className="text-xl font-black text-white">R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* PF vs MEI Side-by-Side Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PF Card */}
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-red-500/10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wider">
                            <UserCheck size={14} className="text-red-400" />
                            Pessoa Física
                          </span>
                          <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold uppercase border border-red-500/20">IRPF + INSS</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Desconto INSS</span>
                            <span className="text-red-400 font-semibold">- R$ {inss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Desconto IRRF</span>
                            <span className="text-red-400 font-semibold">- R$ {irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Líquido Recebido</span>
                        <span className="text-lg font-black text-white">R$ {recebidoPF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* MEI Card */}
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-accent/20 flex flex-col justify-between shadow-lg shadow-accent/5">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-xs font-black text-accent uppercase tracking-wider">
                            <Building size={14} className="text-accent" />
                            CNPJ MEI
                          </span>
                          <span className="text-[9px] bg-accent/15 text-accent px-2 py-0.5 rounded font-bold uppercase border border-accent/25">Isento na Fonte</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Desconto INSS</span>
                            <span className="text-slate-400 font-semibold">R$ 0,00</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Desconto IRRF</span>
                            <span className="text-slate-400 font-semibold">R$ 0,00</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-accent tracking-wider">Líquido Recebido</span>
                        <span className="text-lg font-black text-accent">R$ {recebidoMEI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {economiaMEI > 0 && (
                    <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3">
                      <div>
                        <p className="text-[9px] text-accent font-black uppercase tracking-wider">Economia de Impostos no MEI</p>
                        <p className="text-md font-black text-white mt-0.5">Você economiza R$ {economiaMEI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por mês!</p>
                      </div>
                      <span className="text-[10px] bg-accent text-midnight px-3 py-1.5 rounded-lg font-black uppercase tracking-wider shrink-0">
                        Receba 100% Bruto
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
