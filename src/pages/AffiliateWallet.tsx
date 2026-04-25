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
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user]);


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
                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                       <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamentos Automáticos (Dia 10)</p>
                    </div>
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

    </AffiliateLayout>
  );
}
