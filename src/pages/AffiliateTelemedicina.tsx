import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  Video, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  PhoneCall, 
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  status: 'Online' | 'Offline' | 'Disponível' | 'Agendamento';
  image: string;
  whatsapp: string;
}

export default function AffiliateTelemedicina() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const doctors: Doctor[] = [
    {
      id: 'doc-1',
      name: 'Dr. Rodrigo Silva',
      specialty: 'Clínico Geral',
      crm: 'CRM-SP 189201',
      status: 'Online',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120',
      whatsapp: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20iniciar%20uma%20triagem%20para%20teleconsulta%20de%20Cl%C3%ADnico%20Geral.'
    },
    {
      id: 'doc-2',
      name: 'Dra. Marina Costa',
      specialty: 'Pediatria',
      crm: 'CRM-RJ 249102',
      status: 'Disponível',
      image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=120',
      whatsapp: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20consulta%20de%20Pediatria.'
    },
    {
      id: 'doc-3',
      name: 'Dr. Carlos Eduardo',
      specialty: 'Cardiologia',
      crm: 'CRM-MG 912803',
      status: 'Agendamento',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=120',
      whatsapp: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20agendamento%20com%20o%20Cardiologista.'
    },
    {
      id: 'doc-4',
      name: 'Dra. Vanessa Lins',
      specialty: 'Psicologia',
      crm: 'CRP-SP 06/158309',
      status: 'Online',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120',
      whatsapp: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20sess%C3%A3o%20de%20Psicoterapia.'
    },
    {
      id: 'doc-5',
      name: 'Dr. Felipe Santos',
      specialty: 'Ortopedia',
      crm: 'CRM-BA 491023',
      status: 'Agendamento',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=120',
      whatsapp: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20consulta%20de%20Ortopedia.'
    }
  ];

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

  const handleCallDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setShowCallModal(true);
  };

  const handleConfirmCall = () => {
    if (selectedDoctor) {
      window.open(selectedDoctor.whatsapp, '_blank');
      setShowCallModal(false);
      toast.success('Direcionando você para a sala de triagem...');
    }
  };

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

            <div className="size-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/10 mx-auto animate-bounce">
              <Lock size={36} />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-midnight tracking-tight uppercase italic">Acesso Bloqueado</h2>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">
                Benefício Exclusivo para Segurados Ativos
              </p>
              <p className="text-slate-600 leading-relaxed max-w-lg mx-auto">
                A telemedicina 24/7 com atendimento médico imediato e agendamento de especialistas está bloqueada. Regularize seu plano de seguro premiável ou ative sua assinatura para desbloquear consultas ilimitadas para você e sua família.
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
                Segurado Ativo • Acesso Liberado
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight italic uppercase">Telemedicina 24/7</h1>
              <p className="text-slate-300 leading-relaxed text-sm">
                Consulte-se com médicos plantonistas por videoconferência ou agende sessões com psicólogos e especialistas direto pelo celular. Sem filas e sem coparticipação!
              </p>
            </div>
            
            <button 
              onClick={() => handleCallDoctor(doctors[0])} // Dr. Rodrigo Silva (Clínico Geral Online)
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 shrink-0"
            >
              <Video size={18} className="animate-pulse" />
              Consulta Urgente 24h
            </button>
          </div>
        </div>

        {/* Informações rápidas / Instruções */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Clínico Geral 24/7</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Atendimento médico de urgência a qualquer hora do dia ou da noite, inclusive finais de semana.</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Especialistas</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Pediatria, Psicologia, Cardiologia e Ortopedia disponíveis para agendamentos de forma 100% digital.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Stethoscope size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-midnight uppercase tracking-wider mb-1">Receita Digital</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Receba atestados, pedidos de exames e receitas médicas com assinatura digital válidos em todo o país.</p>
            </div>
          </div>
        </div>

        {/* Lista de médicos credenciados */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic">Profissionais Credenciados</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Nossos profissionais qualificados de plantão e agendamento</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group gap-6"
              >
                <div className="flex gap-4">
                  <div className="size-16 rounded-2xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-slate-300"><User size={24} /></div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                      doc.status === 'Online' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'
                        : doc.status === 'Disponível'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {doc.status}
                    </span>
                    <h4 className="font-black text-midnight text-sm tracking-tight">{doc.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{doc.specialty}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{doc.crm}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleCallDoctor(doc)}
                  className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                    doc.status === 'Online'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <PhoneCall size={12} />
                  {doc.status === 'Online' ? 'Falar Agora' : 'Solicitar Horário'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Triagem / Consulta Modal */}
      <AnimatePresence>
        {showCallModal && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
              onClick={() => setShowCallModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6"
            >
              <div className="size-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mx-auto">
                <Video size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-midnight tracking-tight uppercase italic">Triagem Virtual</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Você está prestes a iniciar seu atendimento com <strong>{selectedDoctor.name}</strong> ({selectedDoctor.specialty}).
                </p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Nossos médicos atendem por chamada de vídeo segura. Tenha em mãos seu documento de identidade.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
                <Clock size={16} className="text-primary-blue" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Tempo estimado de espera: ~5 minutos
                </span>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCallModal(false)}
                  className="flex-1 py-4 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleConfirmCall}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/15 transition-all"
                >
                  Iniciar Triagem
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AffiliateLayout>
  );
}
