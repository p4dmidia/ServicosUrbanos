import React from 'react';
import { FileText, Download, ShieldCheck, Printer } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AffiliateAdherenceTerm() {
  const { user, profile } = useAuth();
  const signupDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success('Download do termo iniciado!');
  };

  return (
    <AffiliateLayout title="Termo de Adesão e Anexo">
      <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-8 print:p-0">
        
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
                <FileText size={22} />
              </div>
              Termo de Adesão e Anexo
            </h1>
            <p className="text-slate-500 font-medium mt-1">Visualize e imprima o contrato de adesão ao ecossistema.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-midnight transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button 
              onClick={handleDownload}
              className="p-3 bg-primary-blue text-white rounded-xl hover:bg-primary-blue/90 shadow-lg shadow-primary-blue/10 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
            >
              <Download size={16} />
              Baixar PDF
            </button>
          </div>
        </div>

        {/* Status de Assinatura */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 print:hidden">
          <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Status do Documento</p>
            <h4 className="text-sm font-black text-emerald-900 uppercase">
              Assinado Digitalmente em {signupDate}
            </h4>
            <p className="text-[11px] text-emerald-600/90 font-medium mt-0.5">
              Assinatura vinculada à conta de e-mail {user?.email} sob o CPF {profile?.cpf || 'cadastrado'}.
            </p>
          </div>
        </div>

        {/* Corpo do Termo */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-12 shadow-sm space-y-8 font-serif text-slate-700 text-sm leading-relaxed print:border-none print:shadow-none print:p-0">
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <h2 className="font-bold text-midnight text-xl font-sans uppercase">CONTRATO DE ADESÃO E LICENCIAMENTO</h2>
            <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold">Plataforma Serviços Urbanos Tecnologia S.A.</p>
          </div>

          <div className="space-y-6">
            <p>
              Pelo presente instrumento, de um lado, a **Serviços Urbanos Tecnologia S.A.**, doravante denominada simplesmente "LICENCIANTE", e, de outro lado, o usuário qualificado no formulário de cadastro do portal, doravante denominado "LICENCIADO" ou "AFILIADO", celebram as cláusulas a seguir descritas:
            </p>

            <div className="space-y-3">
              <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">CLÁUSULA PRIMEIRA - DO OBJETO</h3>
              <p>
                O presente contrato tem por objeto o licenciamento de uso não exclusivo do ecossistema tecnológico da LICENCIANTE, permitindo ao LICENCIADO indicar novos membros, usufruir do marketplace de serviços urbanos, e participar do programa de cashback estruturado em rede MMN até a 2ª geração de indicados (G1 e G2).
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">CLÁUSULA SEGUNDA - DA ELEGIBILIDADE E ASSINATURA</h3>
              <p>
                Para estar elegível ao recebimento do cashback recorrente gerado por sua rede de indicados diretos e indiretos, o LICENCIADO compromete-se a manter ativa a assinatura mensal de licenciamento do sistema, realizando o adimplemento nos prazos estabelecidos. O atraso ou inadimplemento resulta na inatividade temporária da conta e na suspensão dos bônus.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">CLÁUSULA TERCEIRA - DOS DADOS BANCÁRIOS E SEGURANÇA</h3>
              <p>
                O LICENCIADO deve obrigatoriamente preencher e manter atualizados seus dados bancários e chave PIX pessoal para a realização de eventuais repasses e transferências de cashback. A LICENCIANTE não se responsabiliza por transferências mal sucedidas causadas por preenchimento incorreto de dados bancários.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">CLÁUSULA QUARTA - DO CANCELAMENTO</h3>
              <p>
                O LICENCIADO poderá solicitar o cancelamento de sua participação a qualquer momento através de solicitação por escrito na central de atendimento do ecossistema. Eventuais saldos acumulados de cashback não resgatados deverão ser solicitados previamente e estarão sujeitos às taxas de saque vigentes na plataforma.
              </p>
            </div>

            <div className="space-y-3 pb-6 border-b border-slate-100">
              <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">CLÁUSULA QUINTA - ANEXO DE SERVIÇOS ADICIONAIS</h3>
              <p>
                O LICENCIADO declara ter ciência de que o ecossistema Serviços Urbanos oferece benefícios adicionais de seguro coletivo contra acidentes pessoais (Apólice) e cupons promocionais periódicos de sorteios (Número da Sorte), cujo regulamento específico faz parte integrante deste contrato na qualidade de anexo técnico.
              </p>
            </div>
          </div>

          {/* Assinatura Visual */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold mb-1">Assinatura do Contratado</p>
              <p className="font-bold text-midnight">{profile?.full_name || 'Afiliado Cadastrado'}</p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">E-mail: {user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold mb-1">Pela Contratante</p>
              <p className="font-bold text-midnight">Serviços Urbanos Tecnologia S.A.</p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">CNPJ: 50.405.892/0001-30</p>
            </div>
          </div>

        </div>

      </div>
    </AffiliateLayout>
  );
}
