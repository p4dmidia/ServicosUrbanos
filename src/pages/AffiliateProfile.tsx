import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Smartphone, 
  Bell, 
  Globe,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';

export default function AffiliateProfile() {
  const user = businessRules.getCurrentUser();

  return (
    <AffiliateLayout title="Dados Pessoais">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
           <div className="relative group">
              <div className="size-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center font-black text-4xl text-slate-300 border-4 border-white shadow-xl">
                 {user?.name?.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 size-10 bg-primary-blue text-white rounded-xl border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                 <Camera size={18} />
              </button>
           </div>
           <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                 <h2 className="text-3xl font-black text-midnight tracking-tighter italic uppercase">{user?.name}</h2>
                 <span className="px-3 py-1 bg-primary-blue/5 text-primary-blue border border-primary-blue/20 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Status Diamante</span>
              </div>
              <p className="text-slate-500 font-medium max-w-md">Membro do ecossistema desde Março de 2024. Suas informações estão seguras e integradas em todas as nossas plataformas.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Form Section */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                       <User size={24} />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Informações da Conta</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            readOnly
                            type="email" 
                            defaultValue={user?.email}
                            className="w-full bg-slate-50 border border-slate-100 px-12 py-4 rounded-2xl font-bold text-slate-500 cursor-not-allowed outline-none focus:ring-4 focus:ring-primary-blue/5 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone (WhatsApp)</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            defaultValue="(11) 98888-7777"
                            className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/5 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (CPF)</label>
                       <input 
                         readOnly
                         type="text" 
                         defaultValue="444.***.***-21"
                         className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-500 cursor-not-allowed"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idioma / Região</label>
                       <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <select className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl font-bold text-midnight appearance-none outline-none focus:ring-4 focus:ring-primary-blue/5 transition-all">
                             <option>Português (Brasil)</option>
                             <option>English (USA)</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <button className="bg-midnight text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-midnight/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
                    Salvar Alterações
                 </button>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Segurança e Acesso</h3>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group cursor-pointer hover:bg-slate-100 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary-blue shadow-sm">
                             <Key size={22} />
                          </div>
                          <div>
                            <p className="font-extrabold text-midnight tracking-tight">Senha de Acesso</p>
                            <p className="text-xs text-slate-500 font-medium">Última alteração há 45 dias.</p>
                          </div>
                       </div>
                       <button className="text-[10px] font-black text-primary-blue uppercase tracking-widest underline underline-offset-4">Redefinir</button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group cursor-pointer hover:bg-slate-100 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                             <Smartphone size={22} />
                          </div>
                          <div>
                            <p className="font-extrabold text-midnight tracking-tight">Autenticação em 2 Etapas</p>
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                               <CheckCircle2 size={12} />
                               Ativado com Sucesso
                            </p>
                          </div>
                       </div>
                       <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configurar</button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Preference Section */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm h-fit space-y-10">
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Bell size={24} />
                 </div>
                 <h3 className="text-xl font-black tracking-tighter text-midnight italic uppercase">Notificações</h3>
              </div>

              <div className="space-y-8">
                 {[
                   { id: 'n1', label: 'Novos Ganhos', desc: 'Receba alertas a cada bônus' },
                   { id: 'n2', label: 'Indicações Diretas', desc: 'Avisar quando houver novo membro' },
                   { id: 'n3', label: 'E-mail Marketing', desc: 'Promoções e notícias exclusivas' },
                   { id: 'n4', label: 'Novidades Ecossistema', desc: 'Alerta de novos apps integrados' },
                 ].map((n) => (
                   <div key={n.id} className="flex items-start justify-between">
                      <div className="flex-1">
                         <p className="font-bold text-midnight text-sm">{n.label}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{n.desc}</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" defaultChecked className="sr-only peer" />
                         <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
