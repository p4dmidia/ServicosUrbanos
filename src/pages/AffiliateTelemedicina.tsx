import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  Video, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';

export default function AffiliateTelemedicina() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const raccaTelemedicinaUrl = 'https://raccasaude.com.br/parceiro/servicos-urbanos';

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        setLoading(true);
        const statsData = await businessRules.getAffiliateStats(user.id);
        setStats(statsData);
        setIsEligible(statsData?.isEligible || false);
      } catch (error) {
        console.error("Error loading telemedicine dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading) {
    return (
      <AffiliateLayout title="Telemedicina">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  // Se o usuário não estiver ativo (isEligible === false)
  if (!isEligible) {
    return (
      <AffiliateLayout title="Telemedicina">
        <div className="p-8 lg:p-12 min-h-[75vh] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl text-center space-y-8 relative overflow-hidden"
          >
            {/* Background design glow */}
            <div className="absolute -top-20 -right-20 size-60 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 size-60 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="size-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/10 mx-auto animate-bounce">
              <Lock size={36} />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-midnight tracking-tight uppercase italic">Acesso Bloqueado</h2>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">
                Benefício Exclusivo para Membros Ativos
              </p>
              <p className="text-slate-600 leading-relaxed max-w-lg mx-auto text-sm">
                A telemedicina 24/7 com atendimento médico de urgência e agendamento com especialistas está bloqueada. Regularize seu plano de licenciamento para desbloquear consultas ilimitadas para você e sua família.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/afiliado/renovacoes"
                className="w-full sm:w-auto bg-midnight text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-midnight/10 flex items-center justify-center gap-2"
              >
                Ativar Minha Assinatura
                <ArrowUpRight size={16} />
              </Link>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Suporte Financeiro
              </a>
            </div>
          </motion.div>
        </div>
      </AffiliateLayout>
    );
  }

  // Se o usuário estiver ATIVO (isEligible === true)
  return (
    <AffiliateLayout title="Telemedicina">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Banner principal */}
        <div className="bg-gradient-to-r from-midnight via-slate-900 to-indigo-950 p-8 sm:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-primary-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <ShieldCheck size={12} className="animate-pulse" />
                Membro Ativo • Acesso Liberado
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight italic uppercase">Telemedicina 24/7</h1>
              <p className="text-slate-300 leading-relaxed text-sm">
                Consulte-se com médicos de plantão ou agende sessões com psicólogos e especialistas parceiros diretamente pela plataforma da <strong>Racca Telemedicina</strong>. Sem filas e sem coparticipação!
              </p>
            </div>
            
            <a 
              href={raccaTelemedicinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 shrink-0 active:scale-95"
            >
              <ExternalLink size={18} />
              Acessar Portal Racca Saúde
            </a>
          </div>
        </div>

        {/* Informações rápidas / Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Clínico Geral 24/7</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Atendimento médico de urgência a qualquer hora do dia ou da noite, inclusive finais de semana.</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Especialistas com Agendamento</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Pediatria, Psicologia, Cardiologia, Ortopedia e diversas outras especialidades 100% online.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Receita e Atestado Digital</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Receba atestados, pedidos de exames e receitas médicas com assinatura digital válidos em todo o país.</p>
            </div>
          </div>
        </div>

        {/* Instruções para Agendamento de Consultas */}
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-sm p-8 sm:p-12 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
                <Sparkles size={12} />
                Parceiro Oficial
              </div>
              <h3 className="text-2xl font-black text-midnight tracking-tighter uppercase italic">
                Instruções para Agendamento de Consultas
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Passo a passo oficial de atendimento via Racca Telemedicina
              </p>
            </div>
            
            <a 
              href={raccaTelemedicinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all self-start sm:self-auto shadow-md"
            >
              <span>Abrir Plataforma</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Fluxo de Passos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  01
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Acesso Inicial</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    O afiliado clica no link oficial da <strong>Racca Telemedicina</strong> e é direcionado para a página de contratação e acesso do serviço.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  02
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Contratação e Cadastro</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Selecione sua consulta, preencha seu cadastro de paciente junto à Racca Telemedicina e realize a confirmação online.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  03
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Confirmação por E-mail</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Após a confirmação, você recebe um e-mail com as informações de acesso à sala de teleconsulta, contendo o link direto e orientações para a 1ª consulta.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  04
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Triagem / Consulta Inicial</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    A consulta inicial é realizada com um médico clínico geral por chamada de vídeo, que fará o atendimento imediato ou o encaminhamento para o especialista necessário.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  05
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Atendimento Especializado</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Caso haja encaminhamento, você poderá agendar a data e o horário mais convenientes para o atendimento com o especialista desejado.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-mono font-black text-sm shrink-0 mt-0.5">
                  06
                </div>
                <div>
                  <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Receituário e Documentos</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Ao término da consulta, prescrições, receitas e atestados médicos são enviados instantaneamente por SMS ou e-mail com QR Code e assinatura digital válida.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Especialidades Atendidas */}
          <div className="p-8 bg-slate-50/80 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-midnight uppercase tracking-wider flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-500" />
              Especialidades Disponíveis na Plataforma
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Clínico Geral 24h', 'Cardiologia', 'Dermatologia', 'Endocrinologia', 
                'Geriatria', 'Ginecologia', 'Neurologia', 'Ortopedia', 
                'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Psicologia', 
                'Traumatologia', 'Urologia'
              ].map((specialty) => (
                <span 
                  key={specialty} 
                  className="bg-white border border-slate-200/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Botão de Ação Direto */}
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-[11px] font-bold text-slate-400 max-w-md uppercase leading-relaxed">
              ⚠️ Observação: Os atendimentos médicos e prontuários são de responsabilidade da parceira técnica Racca Telemedicina.
            </p>
            <a 
              href={raccaTelemedicinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 shrink-0 self-stretch md:self-auto active:scale-95"
            >
              <span>Acessar Portal Racca Telemedicina</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
