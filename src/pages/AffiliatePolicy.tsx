import React from 'react';
import { Shield, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliatePolicy() {
  const { user, profile } = useAuth();

  const handleDownload = () => {
    toast.success('Download da apólice em PDF iniciado!');
  };

  const coverages = [
    { title: 'Morte Acidental', value: 'R$ 50.000,00', desc: 'Indenização aos beneficiários em caso de falecimento acidental do segurado.' },
    { title: 'Invalidez Permanente por Acidente', value: 'R$ 50.000,00', desc: 'Pagamento de indenização em caso de perda de membros ou invalidez funcional total decorrente de acidente.' },
    { title: 'Assistência Funeral', value: 'R$ 5.000,00', desc: 'Cobertura ou reembolso das despesas com sepultamento ou cremação.' },
    { title: 'Diária de Internação Hospitalar', value: 'R$ 150,00 / dia', desc: 'Auxílio financeiro por dia de hospitalização decorrente de acidente pessoal coberto.' }
  ];

  return (
    <AffiliateLayout title="Apólice de Seguro">
      <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
                <Shield size={22} />
              </div>
              Apólice Digital
            </h1>
            <p className="text-slate-500 font-medium mt-1">Consulte as coberturas e o certificado do seu seguro ativo.</p>
          </div>

          <button 
            onClick={handleDownload}
            className="p-3 bg-primary-blue text-white rounded-xl hover:bg-primary-blue/90 shadow-lg shadow-primary-blue/10 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider self-start sm:self-auto"
          >
            <Download size={16} />
            Baixar Certificado
          </button>
        </div>

        {/* Cartão de Apólice Glassmorphism Premium */}
        <div className="relative bg-midnight text-white rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-midnight/30">
          <div className="absolute top-[-50%] right-[-30%] w-[500px] h-[500px] bg-primary-blue/30 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 space-y-10">
            {/* Top Info */}
            <div className="flex justify-between items-start border-b border-white/10 pb-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Seguro Coletivo Serviços Urbanos</p>
                <h2 className="text-2xl font-black italic uppercase text-emerald-400">CERTIFICADO DE ADESÃO</h2>
              </div>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                Apólice Ativa
              </span>
            </div>

            {/* Grid de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Segurado</p>
                <p className="text-base font-black uppercase">{profile?.full_name || 'Afiliado do Sistema'}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">CPF: {profile?.cpf || '---'}</p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Número do Certificado</p>
                <p className="text-base font-black font-mono">SU-2026-{user?.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-slate-400 mt-1">Cód. Apólice: MA-9283-SU</p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Seguradora Parceira</p>
                <p className="text-base font-black uppercase">Tokio Marine Seguros</p>
                <p className="text-xs text-slate-400 mt-1">CNPJ: 33.164.021/0001-00</p>
              </div>
            </div>

            {/* Vigência */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <p className="text-xs font-bold text-slate-300">Este benefício é garantido e renovado mensalmente através do pagamento da licença da plataforma.</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Início da Cobertura</p>
                <p className="text-xs font-black font-mono">Imediato após ativação da licença</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coberturas e Garantias */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic">Garantias e Limites de Indenização</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coverages.map((cov, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-primary-blue/5 hover:border-primary-blue/20 transition-all flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-black text-midnight text-sm uppercase tracking-tight mb-2">{cov.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{cov.desc}</p>
                </div>
                <div className="flex items-baseline gap-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite máximo</span>
                  <span className="text-lg font-black text-primary-blue font-mono">{cov.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dúvidas / Acionamento */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex items-start gap-5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-midnight text-sm uppercase">Como acionar o seguro?</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Em caso de sinistro, entre em contato imediatamente com o nosso suporte oficial de atendimento pelo WhatsApp disponível no painel. Apresente o número do certificado exibido acima para iniciar o processo de validação técnica e liberação dos fundos junto à seguradora parceira.
            </p>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}
