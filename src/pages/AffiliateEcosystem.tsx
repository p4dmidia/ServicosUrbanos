import React from 'react';
import { 
  Globe, 
  Store, 
  Car, 
  Truck, 
  CreditCard, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';

export default function AffiliateEcosystem() {
  const platforms = [
    { 
      id: 'moby', 
      name: 'Urba Moby', 
      role: 'Condutor / Motorista', 
      icon: Car, 
      color: 'bg-emerald-50 text-emerald-600', 
      status: 'Ativo', 
      description: 'Transforme seu veículo em fonte de renda transportando passageiros.',
      link: '/login' // Simulação de login
    },
    { 
      id: 'food', 
      name: 'Urba Food', 
      role: 'Entregador Parceiro', 
      icon: Truck, 
      color: 'bg-amber-50 text-amber-600', 
      status: 'Inativo', 
      description: 'Entregue refeições dos melhores restaurantes da cidade.',
      link: '/login'
    },
    { 
      id: 'market', 
      name: 'Marketplace', 
      role: 'Lojista / Seller', 
      icon: Store, 
      color: 'bg-primary-blue/10 text-primary-blue', 
      status: 'Inativo', 
      description: 'Abra sua loja online e venda para milhares de usuários.',
      link: '/lojista/login'
    },
    { 
      id: 'pay', 
      name: 'Urba Pay', 
      role: 'Agente Financeiro', 
      icon: CreditCard, 
      color: 'bg-purple-50 text-purple-600', 
      status: 'Coming Soon', 
      description: 'Ofereça soluções de pagamento e ganhe por cada transação.',
      link: '#'
    },
  ];

  return (
    <AffiliateLayout title="Central do Ecossistema">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Intro */}
        <div className="max-w-3xl space-y-6">
           <div className="size-16 rounded-[2rem] bg-midnight text-white flex items-center justify-center shadow-2xl shadow-midnight/20">
              <Globe size={32} />
           </div>
           <h2 className="text-4xl font-black text-midnight tracking-tighter italic uppercase">Expanda suas possibilidades</h2>
           <p className="text-lg text-slate-500 font-medium leading-relaxed">
             Como afiliado **Services Urbanos**, você tem acesso privilegiado a todas as verticais do nosso ecossistema. 
             Seus dados estão interligados: escolha onde quer atuar e comece a gerar receita imediatamente.
           </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {platforms.map((platform, i) => (
             <motion.div
               key={platform.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex flex-col justify-between group hover:shadow-2xl hover:shadow-slate-200/50 transition-all hover:border-primary-blue/20"
             >
                <div>
                   <div className="flex justify-between items-start mb-8">
                      <div className={`size-20 rounded-[2.5rem] flex items-center justify-center ${platform.color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                         <platform.icon size={36} />
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        platform.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 
                        platform.status === 'Inativo' ? 'bg-slate-50 text-slate-400' : 
                        'bg-amber-50 text-amber-600'
                      }`}>
                         {platform.status}
                      </div>
                   </div>

                   <h3 className="text-2xl font-black text-midnight tracking-tight italic uppercase mb-2">
                     {platform.name}
                   </h3>
                   <p className="text-primary-blue font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                     {platform.role}
                   </p>
                   <p className="text-slate-500 font-medium leading-relaxed mb-10">
                     {platform.description}
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="h-px w-full bg-slate-100"></div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                         <ShieldCheck size={16} className="text-emerald-500" />
                         Dados Integrados
                      </div>
                      <a 
                        href={platform.link}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${
                          platform.status === 'Ativo' ? 'bg-emerald-500 text-midnight shadow-lg shadow-emerald-500/20' : 
                          platform.status === 'Inativo' ? 'bg-midnight text-white shadow-xl shadow-midnight/20' :
                          'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {platform.status === 'Ativo' ? 'Acessar Painel' : platform.status === 'Inativo' ? 'Ativar Cadastro' : 'Em Breve'}
                        <ArrowRight size={18} />
                      </a>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Global Stats Banner */}
        <div className="bg-midnight rounded-[3rem] p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <Activity size={200} />
           </div>
           
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest uppercase">
                    <TrendingUp size={16} className="text-emerald-400" />
                    Ecossistema Único em Escala
                 </div>
                 <h2 className="text-3xl font-black tracking-tighter italic uppercase leading-tight">
                    Tudo que você gera de receita <br />
                    é centralizado no seu painel.
                 </h2>
                 <p className="text-slate-400 font-medium">
                    Indique usuários para qualquer app do grupo e acompanhe as comissões unificadas na sua carteira digital. 
                    Simples, rápido e transparente.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <p className="text-4xl font-black tracking-tighter mb-1 italic">92%</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Taxa de retenção <br /> do ecossistema</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <p className="text-4xl font-black tracking-tighter mb-1 italic">+R$15k</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Potencial médio <br /> mensal (diamante)</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
