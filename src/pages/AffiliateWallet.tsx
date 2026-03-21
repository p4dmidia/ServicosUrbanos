import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  PlusCircle,
  CreditCard,
  QrCode,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';

export default function AffiliateWallet() {
  const stats = businessRules.getAffiliateStats('user123');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const transactions = [
    { id: 't1', type: 'bonus', description: 'Bônus de Indicação - Nível 1', date: 'Hoje, 10:45', amount: 45.00, status: 'Concluído' },
    { id: 't2', type: 'cashback', description: 'Cashback Compra Marketplace', date: 'Hoje, 09:12', amount: 12.30, status: 'Pendente' },
    { id: 't3', type: 'withdraw', description: 'Saque para Conta Banco', date: 'Ontem, 16:30', amount: -250.00, status: 'Concluído' },
    { id: 't4', type: 'bonus', description: 'Bônus Mensal Diamante', date: '20 Mar, 11:00', amount: 150.00, status: 'Concluído' },
  ];

  return (
    <AffiliateLayout title="Minha Carteira">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Main Wallet Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Total Balance Card */}
           <div className="lg:col-span-2 bg-midnight p-10 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[80px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Total Acumulado (CAM)</p>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase">R$ {stats.totalEarnings.toFixed(2)}</h2>
                    {!stats.isEligible && (
                      <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-amber-500/20 w-fit">
                        <Clock size={14} />
                        Resgate Bloqueado: Falta {4 - stats.consumptionCount} consumo(s) este mês
                      </div>
                    )}
                 </div>
                 <div className="flex gap-4">
                    <button 
                      disabled={!stats.isEligible}
                      onClick={() => setShowWithdrawModal(true)}
                      className={`px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 ${
                        stats.isEligible 
                        ? 'bg-emerald-500 text-midnight shadow-emerald-500/20 hover:scale-105 active:scale-95' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                      }`}
                    >
                      Resgatar Saldo
                      <QrCode size={22} />
                    </button>
                 </div>
              </div>

              <div className="relative z-10 mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mensal (0.75%)</p>
                    <p className="text-xl font-black text-blue-400 tracking-tighter">R$ {stats.monthlyBonus.toFixed(2)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Anual (0.5%)</p>
                    <p className="text-xl font-black text-emerald-400 tracking-tighter">R$ {stats.annualBonus.toFixed(2)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Carteira (0.25%)</p>
                    <p className="text-xl font-black text-indigo-400 tracking-tighter">R$ {stats.walletBonus.toFixed(2)}</p>
                 </div>
                 <div className="hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Taxa (10%)</p>
                    <p className="text-xl font-black text-red-400 tracking-tighter">- R$ {stats.maintenanceFee.toFixed(2)}</p>
                 </div>
              </div>
           </div>

           {/* Bank Info Card */}
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-midnight italic uppercase">Dados Bancários</h3>
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                       <CreditCard size={20} />
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco / Instituição</p>
                       <p className="font-bold text-midnight tracking-tight italic uppercase">Nu Pagamentos S.A</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave PIX Cadastrada</p>
                       <p className="font-bold text-midnight tracking-tight">ricardo***@email.com</p>
                    </div>
                 </div>
              </div>
              <button className="mt-12 text-sm font-black text-primary-blue hover:text-midnight transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                 Alterar Dados Bancários
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div>
                 <h2 className="text-2xl font-black text-midnight tracking-tighter italic uppercase underline decoration-primary-blue decoration-4 underline-offset-8 mb-2">Histórico Financeiro</h2>
                 <p className="text-slate-500 font-medium">Veja todos os créditos e débitos realizados na sua conta.</p>
              </div>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                   type="text" 
                   placeholder="Filtrar por data ou tipo..."
                   className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary-blue text-xs font-bold"
                  />
              </div>
           </div>

           <div className="space-y-4">
              {transactions.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 transition-all cursor-pointer"
                >
                   <div className="flex items-center gap-6">
                      <div className={`size-12 rounded-[1.25rem] flex items-center justify-center ${
                        t.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                         {t.amount > 0 ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                      </div>
                      <div>
                         <p className="font-black text-midnight tracking-tight">{t.description}</p>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                               <Clock size={10} />
                               {t.date}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                              t.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                               {t.status}
                            </span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-xl font-black tracking-tighter ${
                         t.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                         {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <button className="text-[10px] font-black text-slate-400 group-hover:text-primary-blue transition-colors uppercase">Ver Comprovante</button>
                   </div>
                </motion.div>
              ))}
           </div>

           <div className="mt-12 flex justify-center">
              <button className="px-12 py-5 border-2 border-slate-50 rounded-2xl text-[10px] font-black text-slate-400 hover:text-midnight hover:border-slate-200 transition-all uppercase tracking-widest">
                Baixar Extrato Completo (PDF)
              </button>
           </div>
        </div>
      </div>

      {/* Withdrawal Modal Simulation */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-midnight/80 backdrop-blur-md z-[60] flex items-center justify-center p-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white w-full max-w-lg rounded-[2.5rem] p-12 relative overflow-hidden"
           >
              <div className="relative z-10 space-y-8">
                <div className="text-center">
                  <div className="size-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                    <DollarSign size={40} />
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-midnight italic uppercase">Efetuar Resgate</h2>
                  <p className="text-slate-500 font-medium">O valor será transferido imediatamente via PIX.</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Saque</label>
                      <div className="relative">
                         <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                         <input 
                           type="number" 
                           defaultValue={stats.availableBalance.toFixed(2)}
                           className="w-full bg-slate-50 border border-slate-200 px-12 py-5 rounded-3xl font-black text-2xl text-midnight focus:outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold ml-1">Máximo disponível: R$ {stats.availableBalance.toFixed(2)}</p>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center gap-4">
                      <div className="size-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-primary-blue">
                         <QrCode size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Conta de Destino</p>
                        <p className="text-sm font-bold text-midnight">PIX: ricardo***@email.com</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowWithdrawModal(false)}
                    className="py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                       alert('Solicitação de saque enviada com sucesso!');
                       setShowWithdrawModal(false);
                    }}
                    className="bg-midnight text-white py-5 rounded-2xl font-black hover:scale-[1.02] shadow-xl shadow-midnight/20 transition-all uppercase tracking-widest"
                  >
                    Confirmar Saque
                  </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}
    </AffiliateLayout>
  );
}
