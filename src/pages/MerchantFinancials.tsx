import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  History, 
  Download, 
  Filter, 
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';

interface Transaction {
  id: string;
  type: 'sale' | 'withdrawal' | 'fee';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function MerchantFinancials() {
  const [filterType, setFilterType] = useState('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const stats = [
    { title: 'Saldo Disponível', value: 'R$ 8.450,00', subtitle: 'Pronto para saque', icon: Wallet, color: 'emerald' },
    { title: 'A Receber', value: 'R$ 3.200,00', subtitle: 'Liberação em até 14 dias', icon: Clock, color: 'blue' },
    { title: 'Total Faturado', value: 'R$ 24.150,00', subtitle: 'Últimos 30 dias', icon: TrendingUp, color: 'purple', Component: ArrowUpRight },
    { title: 'Taxas e Comissões', value: 'R$ 1.250,00', subtitle: 'Últimos 30 dias', icon: TrendingDown, color: 'red', Component: ArrowDownRight },
  ];

  const transactions: Transaction[] = [
    { id: 'TRX-9982', type: 'sale', description: 'Venda - Pedido #8492', amount: 199.90, date: 'Hoje, 14:20', status: 'completed' },
    { id: 'TRX-9981', type: 'withdrawal', description: 'Saque para Conta Bancária', amount: -2500.00, date: 'Ontem, 09:00', status: 'completed' },
    { id: 'TRX-9980', type: 'fee', description: 'Taxa de Plataforma', amount: -19.99, date: '12 Nov, 18:30', status: 'completed' },
    { id: 'TRX-9979', type: 'sale', description: 'Venda - Pedido #8489', amount: 1250.00, date: '11 Nov, 16:40', status: 'pending' },
    { id: 'TRX-9978', type: 'sale', description: 'Venda - Pedido #8488', amount: 450.50, date: '10 Nov, 11:15', status: 'completed' },
  ];

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowUpRight size={16} className="text-emerald-500" />;
      case 'withdrawal': return <ArrowDownRight size={16} className="text-red-500" />;
      case 'fee': return <DollarSign size={16} className="text-orange-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Solicitação de saque de R$ ${withdrawAmount} enviada com sucesso!`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  return (
    <MerchantLayout title="Financeiro" subtitle="Gestão de saldos, taxas e transferências">
      <div className="p-8 lg:p-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon || stat.Component;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className={`absolute -right-6 -top-6 size-24 bg-${stat.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className={`size-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500 transition-colors`}>
                    <Icon size={24} />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black text-midnight tracking-tighter mb-2">{stat.value}</h3>
                  <p className="text-[10px] font-bold text-slate-400">{stat.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Financial Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Withdrawal Section */}
          <div className="xl:col-span-1 bg-midnight rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-20%] right-[-20%] size-64 bg-emerald-500 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Saque Rápido</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transferência para Conta Bancária</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-8 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Conta Cadastrada</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-sm">Banco Itaú (341)</p>
                    <p className="text-slate-400 text-xs mt-1">Ag: 0001 • CC: ****9281</p>
                  </div>
                  <CheckCircle className="text-emerald-500" size={20} />
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-slate-400 text-sm mb-4">Saldo Disponível: <span className="text-white font-black">R$ 8.450,00</span></p>
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-midnight py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  Solicitar Saque <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Extrato Financeiro</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Histórico de entradas e saídas</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  {['all', 'sale', 'withdrawal', 'fee'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setFilterType(t)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-midnight shadow-sm' : 'text-slate-400 hover:bg-slate-200/50'}`}
                    >
                      {t === 'all' ? 'Tudo' : t === 'sale' ? 'Vendas' : t === 'withdrawal' ? 'Saques' : 'Taxas'}
                    </button>
                  ))}
                </div>
                <button className="size-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-midnight transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transação</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredTransactions.map((trx) => (
                      <motion.tr 
                        key={trx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm">
                              {getTransactionIcon(trx.type)}
                            </div>
                            <div>
                              <p className="font-black text-midnight text-sm tracking-tight">{trx.description}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trx.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-slate-500">{trx.date}</td>
                        <td className="px-10 py-6">
                          <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusColor(trx.status)}`}>
                            {trx.status === 'completed' ? 'Concluído' : trx.status === 'pending' ? 'Pendente' : 'Falha'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <span className={`font-black tracking-tighter text-lg ${trx.amount > 0 ? 'text-emerald-500' : 'text-midnight'}`}>
                            {trx.amount > 0 ? '+' : ''} R$ {Math.abs(trx.amount).toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              
              {filteredTransactions.length === 0 && (
                <div className="p-20 text-center">
                  <History className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
              onClick={() => setShowWithdrawModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic mb-2">Solicitar Saque</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">O valor será transferido para sua conta principal</p>

              <form onSubmit={handleWithdrawRequest} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Saldo Disponível</span>
                  <span className="text-lg font-black text-emerald-500">R$ 8.450,00</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Saque (R$)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</span>
                    <input 
                      type="number" 
                      required
                      min="100"
                      max="8450"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all font-black text-2xl text-midnight"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold ml-1">* Valor mínimo de saque: R$ 100,00</p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-midnight py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
