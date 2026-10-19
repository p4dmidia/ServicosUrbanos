import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  Calendar,
  AlertTriangle,
  Clock,
  HeartPulse,
  Gift
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AffiliatePolicy() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seguradoData, setSeguradoData] = useState<any>(null);
  const [microfranqueadoData, setMicrofranqueadoData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [segRes, mfRes] = await Promise.all([
          businessRules.getSeguradoData(user.id),
          businessRules.getMicrofranqueadoData(user.id)
        ]);
        setSeguradoData(segRes);
        setMicrofranqueadoData(mfRes);
      } catch (err) {
        console.error('Erro ao carregar dados da apólice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const apolice = seguradoData?.apolice;
  const isSeguradoAtivo = seguradoData?.isPolicyActive;
  const isMicrofranqueado = microfranqueadoData?.isMicrofranqueado;

  const handleDownload = () => {
    try {
      const isPJ = !!profile?.cnpj || !!profile?.description?.includes('[PJ]');
      let insuredPerson = seguradoData?.segurado?.nome_completo || profile?.full_name || 'Segurado Oficial';
      let insuredPersonCpf = seguradoData?.segurado?.cpf || profile?.cpf || '---';

      const certNum = apolice?.numero_certificado || (profile as any)?.certificate_number || `MBM-${user?.id.substring(0, 8).toUpperCase()}`;
      const policyNum = apolice?.numero_apolice || '11-0982-000058940-0001';
      const luckyNum = seguradoData?.numerosDaSorte?.[0]?.numero || (profile as any)?.lucky_number || 'Conforme extração';

      const issueDate = apolice?.vigencia_inicio 
        ? new Date(apolice.vigencia_inicio).toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR');
        
      const endDate = apolice?.vigencia_fim 
        ? new Date(apolice.vigencia_fim).toLocaleDateString('pt-BR') 
        : 'Vigência Contratada';

      const nowFormatted = new Date().toLocaleString('pt-BR');

      const doc = new jsPDF();

      // Top Header Background
      doc.setFillColor(11, 21, 40); // Dark Midnight
      doc.rect(0, 0, 210, 48, 'F');

      // Title & Estipulante
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO INDIVIDUAL DE SEGURO', 14, 16);

      doc.setFontSize(9);
      doc.setTextColor(52, 211, 153); // Emerald
      doc.text('SEGURO DE VIDA LIGHT & ACIDENTES PESSOAIS R$ 5.000,00', 14, 23);

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225); // Slate 300
      doc.setFont('helvetica', 'normal');
      doc.text('Estipulante: SIC COMERCIO DE PRODUTOS ALIMENTICIOS E SERVICOS LTDA', 14, 31);
      doc.text('CNPJ Estipulante: 54.795.377/0001-03', 14, 37);
      doc.text(`Data de Emissao: ${nowFormatted}`, 130, 37);

      // Section: Dados do Certificado e Segurado
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. DADOS DO SEGURADO E DA APOLICE', 14, 56);

      autoTable(doc, {
        startY: 60,
        theme: 'grid',
        head: [['CAMPO', 'INFORMACAO OFICIAL REGISTRADA']],
        body: [
          ['Segurado Titular', insuredPerson.toUpperCase()],
          ['CPF do Titular do Seguro', insuredPersonCpf],
          ['Numero do Certificado', certNum],
          ['Apolice Coletiva MBM', policyNum],
          ['Seguradora Parceira', 'MBM SEGURADORA S/A (CNPJ: 87.883.807/0001-06)'],
          ['Numero da Sorte (Loteria Federal)', luckyNum],
          ['Inicio da Vigencia / Cobertura', issueDate],
          ['Fim da Vigencia', endDate],
          ['Capital Segurado Global', 'R$ 5.000,00'],
          ['Status da Cobertura', isSeguradoAtivo ? 'ATIVA E REGULAR' : 'INATIVA / SUSPENSA']
        ],
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.5
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
          1: { fontStyle: 'normal' }
        }
      });

      // Section: Coberturas e Limites de Indenização
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. GARANTIAS E LIMITES MAXIMOS DE INDENIZACAO (LMI)', 14, finalY1);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'grid',
        head: [['COBERTURA / BENEFICIO', 'DESCRICAO DA GARANTIA', 'LIMITE MAXIMO (LMI)']],
        body: [
          [
            'Morte Acidental (MA)',
            'Indenizacao aos beneficiarios legais em caso de falecimento acidental do segurado titular.',
            'R$ 5.000,00'
          ],
          [
            'Invalidez Permanente por Acidente (IPA)',
            'Indenizacao integral ou parcial em decorrencia de perda definitiva de membros ou funcoes conforme tabela SUSEP.',
            'R$ 5.000,00'
          ],
          [
            'Sorteios Oficiais Loteria Federal',
            '4 ultimos domingos de cada mes (regra de 5 domingos desconsidera o primeiro).',
            'R$ 5.000,00 / semana'
          ],
          [
            'Telemedicina Racca Saude',
            'Consultas clinico geral 24/7 sem agendamento e medicos especialistas com hora marcada.',
            'Incluso (Sem Custo Extra)'
          ]
        ],
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 55 },
          1: { fontStyle: 'normal' },
          2: { fontStyle: 'bold', cellWidth: 45, textColor: [5, 150, 105] }
        }
      });

      doc.save(`Certificado_Seguro_Vida_Light_${certNum}.pdf`);
      toast.success('Certificado baixado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar documento PDF: ' + err.message);
    }
  };

  const coverages = [
    {
      title: "Morte Acidental (MA)",
      desc: "Indenização paga aos beneficiários legais em caso de falecimento acidental do segurado titular.",
      value: "R$ 5.000,00"
    },
    {
      title: "Invalidez Permanente por Acidente (IPA)",
      desc: "Pagamento de indenização em caso de perda ou impotência funcional definitiva de membros decorrente de acidente pessoal coberto.",
      value: "R$ 5.000,00"
    },
    {
      title: "Sorteios Oficiais da Loteria Federal",
      desc: "Participação em sorteios nos 4 últimos domingos de cada mês concorrendo ao prêmio de R$ 5.000,00 pela Loteria Federal.",
      value: "R$ 5.000,00 / sorteio"
    },
    {
      title: "Telemedicina Racca Saúde 24/7",
      desc: "Atendimento com clínico geral 24 horas por dia e especialistas médicos agendados para o titular.",
      value: "Incluso (Ilimitado)"
    }
  ];

  if (loading) {
    return (
      <AffiliateLayout title="Apólice de Seguro">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout title="Apólice de Seguro">
      <div className="max-w-5xl mx-auto p-8 lg:p-12 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-midnight tracking-tighter uppercase italic flex items-center gap-3">
              <div className="size-10 bg-primary-blue rounded-xl flex items-center justify-center text-white">
                <Shield size={22} />
              </div>
              Apólice Seguro Vida Light
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Consulte seu certificado oficial de seguro individual contratado junto à MBM Seguradora.
            </p>
          </div>

          {isSeguradoAtivo && (
            <button 
              onClick={handleDownload}
              className="p-3.5 bg-primary-blue text-white rounded-2xl hover:bg-primary-blue/90 shadow-xl shadow-primary-blue/20 transition-all flex items-center gap-2.5 font-black text-xs uppercase tracking-wider self-start sm:self-auto cursor-pointer"
            >
              <Download size={18} />
              Baixar Certificado PDF
            </button>
          )}
        </div>

        {/* ALERTA: MICROFRANQUEADO SEM SEGURO ATIVO */}
        {!isSeguradoAtivo && isMicrofranqueado && (
          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem] p-8 text-midnight space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Você é um Microfranqueado, mas ainda não possui Seguro Vida Light
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Conforme as diretrizes jurídicas da plataforma: 
              <strong className="text-midnight"> “Microfranqueados não participam dos sorteios nem possuem cobertura de seguro automaticamente, salvo se também forem Segurados Premium.”</strong>
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link 
                to="/afiliado/renovacoes" 
                className="bg-emerald-500 hover:bg-emerald-400 text-midnight font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Sparkles size={16} />
                Contratar Seguro Vida Light (A partir de R$ 5,00/mês)
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* Cartão de Apólice Glassmorphism Premium */}
        <div className="relative bg-midnight text-white rounded-[2.5rem] p-8 sm:p-10 overflow-hidden shadow-2xl shadow-midnight/30 border border-white/5">
          <div className="absolute top-[-50%] right-[-30%] w-[500px] h-[500px] bg-primary-blue/30 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 space-y-10">
            {/* Top Info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-6 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Estipulante: SIC COMÉRCIO DE PRODUTOS ALIMENTÍCIOS E SERVIÇOS LTDA
                </p>
                <h2 className="text-2xl font-black italic uppercase text-emerald-400">
                  CERTIFICADO INDIVIDUAL MBM
                </h2>
              </div>
              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest leading-none w-fit ${
                isSeguradoAtivo 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {isSeguradoAtivo ? 'Apólice Ativa' : 'Cobertura Inativa'}
              </span>
            </div>

            {/* Grid de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                  Segurado Titular
                </p>
                <p className="text-base font-black uppercase text-emerald-400">
                  {seguradoData?.segurado?.nome_completo || profile?.full_name || 'Usuário Titular'}
                </p>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  CPF: {seguradoData?.segurado?.cpf || profile?.cpf || '---'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                  Certificado & Apólice
                </p>
                <p className="text-base font-black font-mono text-white">
                  {apolice?.numero_certificado || (profile as any)?.certificate_number || `MBM-${user?.id.substring(0, 8).toUpperCase()}`}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Apólice: {apolice?.numero_apolice || '11-0982-000058940-0001'}
                </p>
                {seguradoData?.numerosDaSorte?.[0]?.numero && (
                  <p className="text-[10px] text-amber-300 font-black uppercase mt-1.5 tracking-wider">
                    Nº da Sorte: <span className="font-mono text-xs">{seguradoData.numerosDaSorte[0].numero}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                  Seguradora Parceira
                </p>
                <p className="text-base font-black uppercase">MBM SEGURADORA S/A</p>
                <p className="text-xs text-slate-400 mt-1">CNPJ: 87.883.807/0001-06</p>
              </div>
            </div>

            {/* Vigência e Datas */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={isSeguradoAtivo ? "text-emerald-400" : "text-slate-500"} size={22} />
                <p className="text-xs font-bold text-slate-300">
                  {isSeguradoAtivo 
                    ? "Seguro de vida e acidentes pessoais ativo. Sorteios e telemedicina liberados." 
                    : "Sua apólice não está ativa. Efetue a renovação do seu plano para garantir a cobertura."}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Vigência da Cobertura
                </p>
                <p className="text-xs font-black font-mono">
                  {apolice?.vigencia_inicio ? new Date(apolice.vigencia_inicio).toLocaleDateString('pt-BR') : '---'} até {apolice?.vigencia_fim ? new Date(apolice.vigencia_fim).toLocaleDateString('pt-BR') : '---'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coberturas e Garantias */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-midnight tracking-tighter uppercase italic">
            Garantias e Limites de Indenização (LMI)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coverages.map((cov, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-primary-blue/5 hover:border-primary-blue/20 transition-all flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-black text-midnight text-sm uppercase tracking-tight mb-2">{cov.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{cov.desc}</p>
                </div>
                <div className="flex items-baseline gap-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite máximo</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{cov.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Acionamento / Sinistro Online */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
              <AlertCircle size={26} />
            </div>
            <div>
              <h4 className="font-black text-white text-base uppercase tracking-tight">
                Precisa comunicar um sinistro?
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
                Você pode registrar seu aviso de sinistro (Morte Acidental ou Invalidez Permanente) e anexar todos os laudos e documentos diretamente pelo painel digital.
              </p>
            </div>
          </div>
          <Link 
            to="/afiliado/sinistros" 
            className="bg-emerald-500 hover:bg-emerald-400 text-midnight font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest whitespace-nowrap transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0"
          >
            Acessar Área de Sinistros
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </AffiliateLayout>
  );
}
