import React, { useEffect, useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search,
  Clock,
  ChevronRight,
  CreditCard,
  QrCode,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateWallet() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        businessRules.getAffiliateStats(user.id),
        businessRules.getEcosystemActivity(user.id)
      ]);
      
      setStats(statsData);
      setTransactions(activityData);
      setWithdrawAmount(statsData.availableBalance.toFixed(2));
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user]);

  const handleWithdraw = async () => {
    if (!user || !stats) return;
    
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Insira um valor válido para resgate.');
      return;
    }

    if (val > stats.availableBalance) {
      toast.error('Saldo insuficiente para este valor.');
      return;
    }

    try {
      setSubmitting(true);
      await businessRules.requestWithdrawal(user.id, val);
      
      toast.success('Solicitação de resgate enviada! Aguarde o processamento.', {
        duration: 5000,
        icon: '💰'
      });
      
      setShowWithdrawModal(false);
      // Reload data to show pending transaction and updated balance
      loadWalletData();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error('Erro ao processar resgate. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !stats) {
    return (
      <AffiliateLayout title="Minha Carteira">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-12 text-primary-blue animate-spin" />
        </div>
      </AffiliateLayout>
    );
  }

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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Disponível (Carteira CD)</p>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase">R$ {Number(stats.availableBalance).toFixed(2)}</h2>
                    {!stats.isEligible && (
                      <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-amber-500/20 w-fit">
                        <Clock size={14} />
                        {stats.consumptionCount < 1 ? 'Resgate Bloqueado: Falta realizar 1 consumo mensal' : 'Resgate Bloqueado: Saldo insuficiente'}
                      </div>
                    )}
                 </div>
                 <div className="flex gap-4">
                    <button 
                      disabled={!stats.isEligible || stats.availableBalance <= 0}
                      onClick={() => setShowWithdrawModal(true)}
                      className={`px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 ${
                        stats.isEligible && stats.availableBalance > 0
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bônus Mensal</p>
                    <p className="text-xl font-black text-blue-400 tracking-tighter">R$ {Number(stats.monthlyBonus).toFixed(2)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bônus Anual</p>
                    <p className="text-xl font-black text-emerald-400 tracking-tighter">R$ {Number(stats.annualBonus).toFixed(2)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consumos</p>
                    <p className="text-xl font-black text-indigo-400 tracking-tighter">{stats.consumptionCount} serviços</p>
                 </div>
              </div>
           </div>

           {/* Real Bank Info Card */}
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
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco / Chave PIX</p>
                       <p className="font-bold text-midnight tracking-tight italic uppercase truncate">
                         {profile?.bank_name || 'Ag. Cadastro'} 
                         <span className="block text-[10px] text-slate-400 not-italic mt-1 uppercase truncate">{profile?.pix_key || 'Chave não informada'}</span>
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agência e Conta</p>
                       <p className="font-bold text-midnight tracking-tight italic truncate">
                         {profile?.bank_branch && profile?.bank_account 
                           ? `Ag: ${profile.bank_branch} / CC: ${profile.bank_account}` 
                           : 'Dados não informados'}
                       </p>
                    </div>
                 </div>
              </div>
              <Link 
                to="/afiliado/perfil"
                className="mt-12 text-sm font-black text-primary-blue hover:text-midnight transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
              >
                 Gerenciar Dados
                 <ChevronRight size={16} />
              </Link>
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
                   placeholder="Filtrar histórico..."
                   className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary-blue text-xs font-bold"
                  />
              </div>
           </div>

           <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                   Nenhuma transação encontrada.
                </div>
              ) : (
                transactions.map((t, i) => (
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
                           <p className="font-black text-midnight tracking-tight truncate max-w-[200px] md:max-w-md">{t.description}</p>
                           <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                                 <Clock size={10} />
                                 {t.date}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                                t.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                 {t.status === 'pending' ? 'Pendente' : 'Concluído'}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right shrink-0">
                        <p className={`text-xl font-black tracking-tighter ${
                           t.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                           {t.amount > 0 ? '+' : ''}{Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <button className="text-[10px] font-black text-slate-400 group-hover:text-primary-blue transition-colors uppercase">Detalhes</button>
                     </div>
                  </motion.div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
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
                  <p className="text-slate-500 font-medium whitespace-pre-wrap">Confirme seu PIX: {profile?.pix_key || 'Não cadastrado'}</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Saque</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                          <input 
                            type="number" 
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-12 py-5 rounded-3xl font-black text-2xl text-midnight focus:outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all"
                          />
                       </div>
                       <p className="text-[10px] text-slate-400 font-bold ml-1">Máximo disponível: R$ {Number(stats.availableBalance).toFixed(2)}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    disabled={submitting}
                    onClick={() => setShowWithdrawModal(false)}
                    className="py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-50 uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button 
                    disabled={submitting}
                    onClick={handleWithdraw}
                    className="bg-primary-blue text-white py-5 rounded-2xl font-black hover:scale-[1.02] shadow-xl shadow-primary-blue/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Confirmar'
                    )}
                  </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}
    </AffiliateLayout>
  );
}
