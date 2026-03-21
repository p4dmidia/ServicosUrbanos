import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MerchantLayout from '../components/MerchantLayout';
import { businessRules, MerchantUser, Branch } from '../lib/businessRules';

interface Transaction {
  id: string;
  type: 'sale' | 'withdrawal' | 'fee' | 'commission' | 'cashback_deduction';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function MerchantFinancials() {
  const [filterType, setFilterType] = useState('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [currentUser, setCurrentUser] = useState<MerchantUser | null>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const user = businessRules.getCurrentUser();
    const orders = businessRules.getOrders();
    const calculated = businessRules.calculateFinancials(user, orders);
    
    setCurrentUser(user);
    setFinancials(calculated);
    setBranches(businessRules.getBranches());
  }, []);

  if (!currentUser || !financials) return null;

  const isOwner = currentUser.role === 'owner';

  const stats = [
    { 
      title: 'Saldo Disponível', 
      value: `R$ ${financials.balance.toFixed(2).replace('.', ',')}`, 
      subtitle: isOwner ? 'Faturamento Líquido' : `Sua Comissão (${currentUser.commissionRate}%)`, 
      icon: Wallet, 
      color: 'emerald' 
    },
    { 
      title: 'Vendas Brutas', 
      value: `R$ ${financials.totalBilled.toFixed(2).replace('.', ',')}`, 
      subtitle: isOwner ? 'Total de todas as filiais' : 'Sua filial', 
      icon: TrendingUp, 
      color: 'blue' 
    },
    { 
      title: isOwner ? 'Cashback Distribuído' : 'A Receber', 
      value: isOwner ? `R$ ${financials.totalCashback.toFixed(2).replace('.', ',')}` : 'R$ 0,00', 
      subtitle: isOwner ? 'Dedução Automática' : 'Liberação em 14 dias', 
      icon: isOwner ? TrendingDown : Clock, 
      color: isOwner ? 'red' : 'purple' 
    },
    { 
      title: isOwner ? 'Taxas Operacionais' : 'Meta Mês', 
      value: isOwner ? 'R$ 0,00' : 'R$ 5.000,00', 
      subtitle: isOwner ? 'Manutenção Plataforma' : '85% Concluído', 
      icon: isOwner ? DollarSign : Percent, 
      color: isOwner ? 'slate' : 'orange' 
    },
  ];

  const baseTransactions = [
    { id: 'TRX-9982', type: 'sale' as const, description: 'Venda - Pedido #8492', amount: isOwner ? 199.90 : (199.90 * (currentUser.commissionRate/100)), date: 'Hoje, 14:20', status: 'completed' as const },
    { id: 'TRX-9981', type: 'withdrawal' as const, description: 'Saque para Conta Bancária', amount: -2500.00, date: 'Ontem, 09:00', status: 'completed' as const },
    { id: 'TRX-9979', type: 'sale' as const, description: 'Venda - Pedido #8489', amount: isOwner ? 1250.00 : (1250.00 * (currentUser.commissionRate/100)), date: '11 Nov, 16:40', status: 'pending' as const },
    { id: 'TRX-CASH', type: 'cashback_deduction' as const, description: 'Dedução de Cashback (Total)', amount: -financials.totalCashback, date: 'Recorrente', status: 'completed' as const },
  ];

  const transactions: Transaction[] = baseTransactions.filter(t => isOwner || t.type !== 'cashback_deduction');

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowUpRight size={16} className="text-emerald-500" />;
      case 'withdrawal': return <ArrowDownRight size={16} className="text-red-500" />;
      case 'cashback_deduction': return <TrendingDown size={16} className="text-red-500" />;
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
    <MerchantLayout title="Financeiro" subtitle={`Gestão financeira da ${isOwner ? 'Matriz' : 'sua Filial'}`}>
      <div className="p-8 lg:p-12 space-y-12">
        {/* Branch Info for Manager */}
        {!isOwner && currentUser.branchId && (
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary-blue shadow-sm">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sua Unidade</p>
                <h4 className="text-lg font-black text-midnight tracking-tight">
                  {branches.find(b => b.id === currentUser.branchId)?.name || 'Filial Associada'}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sua Comissão</p>
              <span className="text-2xl font-black text-primary-blue tracking-tighter">{currentUser.commissionRate}%</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden text-[12px]"
              >
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className={`size-12 rounded-2xl flex items-center justify-center bg-slate-50 text-midnight transition-colors`}>
                    <Icon size={24} />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black text-midnight tracking-tighter mb-2">{stat.value}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Financial Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Withdrawal Section */}
          <div className="xl:col-span-1 bg-midnight rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 text-[12px]">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Saque Rápido</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Conta Bancária Cadastrada</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-8 backdrop-blur-sm text-[12px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Destino</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-sm">Banco Itaú (341)</p>
                    <p className="text-slate-400 text-xs mt-1">CC: ****9281</p>
                  </div>
                  <CheckCircle className="text-emerald-500" size={20} />
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-slate-400 text-sm mb-4">Saldo Disponível: <span className="text-white font-black">R$ {financials.balance.toFixed(2).replace('.', ',')}</span></p>
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-midnight py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
                >
                  Solicitar Saque <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden text-[12px]">
            <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-midnight tracking-tighter uppercase italic">Extrato</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Histórico detalhado</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  {['all', 'sale', 'withdrawal'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setFilterType(t)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-midnight shadow-sm' : 'text-slate-400 hover:bg-slate-200/50'}`}
                    >
                      {t === 'all' ? 'Tudo' : t === 'sale' ? 'Vendas' : 'Saques'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transação</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
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
                        <td className="px-10 py-6 text-right">
                          <span className={`font-black tracking-tighter text-lg ${trx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {trx.amount > 0 ? '+' : ''} R$ {Math.abs(trx.amount).toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-[12px]">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden">
              <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic mb-2">Solicitar Saque</h3>
              <form onSubmit={handleWithdrawRequest} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Saldo Disponível</span>
                  <span className="text-lg font-black text-emerald-500">R$ {financials.balance.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Saque (R$)</label>
                  <input type="number" required min="100" max={financials.balance} step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-black text-2xl text-midnight" placeholder="0,00" />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 transition-all font-black">Cancelar</button>
                  <button type="submit" className="flex-1 bg-emerald-500 text-midnight py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 font-black">Confirmar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MerchantLayout>
  );
}
