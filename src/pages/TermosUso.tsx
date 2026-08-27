import React from 'react';
import { Eye, BookOpen, ShieldCheck, ArrowLeft, FileText, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col overflow-x-hidden text-slate-600">
      <Header />

      <main className="flex-1 py-16 px-6 lg:px-20 max-w-4xl mx-auto w-full">
        {/* Breadcrumb / Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-blue transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
        </Link>

        {/* Hero title */}
        <div className="mb-12 border-b border-slate-200 pb-8">
          <span className="text-[10px] font-black text-primary-blue uppercase tracking-[0.3em] mb-3 block">Serviços Urbanos</span>
          <h1 className="text-3xl md:text-5xl font-black text-midnight mb-4 tracking-tighter uppercase italic">
            Termos de Uso da Plataforma Serviços Urbanos
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-primary-blue" /> Regras, obrigações e diretrizes da plataforma
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-100/50 space-y-8 text-sm md:text-base leading-relaxed">
          <p className="font-bold text-slate-700">
            Ao se cadastrar e utilizar a Plataforma Serviços Urbanos Tecnologia S.A. (“PLATAFORMA”), o usuário (“LICENCIADO” ou “AFILIADO”) declara ter lido, compreendido e aceitado integralmente os presentes Termos de Uso. O presente instrumento celebra as cláusulas descritas a seguir entre a Serviços Urbanos Tecnologia S.A., doravante denominada “LICENCIANTE”, e o usuário, doravante denominado “LICENCIADO” ou “AFILIADO”.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">1</span>
              CLÁUSULA PRIMEIRA - DO OBJETO
            </h3>
            <div className="pl-9 text-slate-500">
              <p>O presente contrato tem por objeto o licenciamento de uso não exclusivo do ecossistema tecnológico da LICENCIANTE, permitindo ao LICENCIADO indicar novos membros, usufruir do marketplace de serviços urbanos, e participar do programa de cashback estruturado em rede MMN do G0 ao G2.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">2</span>
              CLÁUSULA SEGUNDA - DA ELEGIBILIDADE E ASSINATURA
            </h3>
            <div className="pl-9 text-slate-500">
              <p>Para estar elegível ao recebimento do cashback recorrente gerado por sua rede própria (G0) e de seus indicados diretos (G1) e indiretos (G2), o LICENCIADO compromete-se a manter ativa a assinatura mensal, trimestral, semestral ou anual de licenciamento do sistema, conforme opção escolhida em sua adesão, realizando o adimplemento nos prazos estabelecidos. O atraso ou inadimplemento resulta na inatividade temporária da conta e na suspensão dos bônus.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">3</span>
              CLÁUSULA TERCEIRA - DOS DADOS BANCÁRIOS E SEGURANÇA
            </h3>
            <div className="pl-9 text-slate-500">
              <p>O LICENCIADO deve obrigatoriamente preencher e manter atualizados seus dados bancários e chave PIX pessoal para a realização de eventuais repasses e transferências de cashback. A LICENCIANTE não se responsabiliza por transferências mal sucedidas causadas por preenchimento incorreto de dados bancários.</p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">4</span>
              CLÁUSULA QUARTA - DO CANCELAMENTO
            </h3>
            <div className="pl-9 text-slate-500">
              <p>O LICENCIADO poderá solicitar o cancelamento de sua participação a qualquer momento através de solicitação por escrito na central de atendimento do ecossistema. Eventuais saldos acumulados de cashback não resgatados deverão ser solicitados previamente e estarão sujeitos às taxas de saque vigentes na plataforma.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">5</span>
              CLÁUSULA QUINTA - ANEXO DE SERVIÇOS ADICIONAIS
            </h3>
            <div className="pl-9 text-slate-500 space-y-2">
              <p>O LICENCIADO declara ter ciência de que o ecossistema Serviços Urbanos oferece benefícios adicionais de seguro coletivo contra acidentes pessoais (Apólice), telemedicina e Número da Sorte, cujo regulamento específico faz parte integrante deste contrato na qualidade de anexo técnico, conforme Anexo I ao XI, que estarão disponíveis em seu dashboard na aba “Termo de Adesão”.</p>
              <p>O Número da Sorte estará disponível em seu dashboard na aba “Número da Sorte” a partir do mês seguinte à sua adesão, sendo os sorteios sempre realizados pela Loteria Federal nos últimos quatro domingos de cada mês. Em meses com cinco domingos, o primeiro domingo será descartado.</p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">6</span>
              CLÁUSULA SEXTA - DISPOSIÇÕES GERAIS
            </h3>
            <div className="pl-9 text-slate-500 space-y-2">
              <p>O LICENCIADO compromete-se a manter sigilo absoluto sobre quaisquer informações técnicas, comerciais ou estratégicas obtidas em razão deste contrato, sob pena de responsabilização civil e criminal.</p>
              <p>O licenciamento concedido não transfere ao LICENCIADO quaisquer direitos de propriedade intelectual sobre a tecnologia, marcas, patentes ou demais ativos da LICENCIANTE, permanecendo estes de titularidade exclusiva da mesma.</p>
              <p>Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">7</span>
              CLÁUSULA SÉTIMA - PENALIDADES E USO INDEVIDO
            </h3>
            <div className="pl-9 text-slate-500 space-y-2">
              <p>O uso indevido da plataforma, incluindo mas não se limitando a práticas fraudulentas, manipulação de dados, criação de contas falsas, utilização de meios ilícitos para obtenção de benefícios ou qualquer violação das regras estabelecidas neste termo, acarretará a imediata suspensão da conta do LICENCIADO, sem prejuízo da adoção de medidas judiciais cabíveis.</p>
              <p>Em caso de reincidência ou fraude comprovada, o LICENCIADO perderá definitivamente o direito a quaisquer bônus, cashback ou benefícios acumulados, além de responder civil e criminalmente pelos danos causados à LICENCIANTE e a terceiros.</p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">8</span>
              CLÁUSULA OITAVA - VIGÊNCIA
            </h3>
            <div className="pl-9 text-slate-500">
              <p>A vigência deste termo de uso vale durante o período de contratação mensal, trimestral, semestral ou anual, conforme a modalidade escolhida pelo LICENCIADO no momento da adesão, renovando-se automaticamente mediante o pagamento da respectiva assinatura, salvo manifestação expressa em contrário por qualquer das partes.</p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">9</span>
              CLÁUSULA NONA - ALTERAÇÕES DO TERMO DE USO
            </h3>
            <div className="pl-9 text-slate-500 space-y-2">
              <p>A LICENCIANTE reserva-se o direito de alterar, atualizar ou complementar este termo de uso a qualquer momento, mediante publicação da versão atualizada no dashboard do LICENCIADO, na aba “Termo de Adesão”.</p>
              <p>As alterações entrarão em vigor imediatamente após sua publicação, exceto quando envolverem mudanças substanciais nas condições financeiras ou nos direitos do LICENCIADO, caso em que será concedido prazo mínimo de 30 (trinta) dias para ciência e adaptação. A continuidade do uso da plataforma após a publicação das alterações será considerada como aceitação tácita das novas condições.</p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">10</span>
              CLÁUSULA DÉCIMA - COMUNICAÇÕES E NOTIFICAÇÕES
            </h3>
            <div className="pl-9 text-slate-500 space-y-2">
              <p>Todas as comunicações oficiais entre a LICENCIANTE e o LICENCIADO serão realizadas por meio do dashboard da plataforma, na aba de notificações, e/ou através do e-mail cadastrado pelo LICENCIADO no momento da adesão.</p>
              <p>O LICENCIADO compromete-se a manter seu endereço de e-mail atualizado e ativo, reconhecendo que a ausência de atualização poderá resultar na perda de informações relevantes, sem responsabilidade da LICENCIANTE. As notificações enviadas por e-mail ou publicadas no dashboard serão consideradas recebidas e válidas para todos os efeitos legais.</p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">11</span>
              CLÁUSULA DÉCIMA PRIMEIRA - RESCISÃO CONTRATUAL PELA LICENCIANTE
            </h3>
            <div className="pl-9 text-slate-500 space-y-3">
              <p>A LICENCIANTE poderá rescindir unilateralmente este termo de uso, sem necessidade de aviso prévio, nos seguintes casos:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Descumprimento grave das obrigações assumidas pelo LICENCIADO;</li>
                <li>Prática de atos ilícitos, fraudulentos ou que atentem contra a boa-fé contratual;</li>
                <li>Utilização indevida da plataforma que comprometa sua segurança, estabilidade ou reputação;</li>
                <li>Inatividade prolongada da conta, superior a 90 (noventa) dias, sem justificativa apresentada;</li>
                <li>Qualquer violação às disposições previstas neste termo e em seus anexos.</li>
              </ul>
              <p>A rescisão acarretará a imediata suspensão da conta do LICENCIADO e a perda dos benefícios acumulados, sem prejuízo da adoção de medidas judiciais cabíveis para reparação de danos.</p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">12</span>
              CLÁUSULA DÉCIMA SEGUNDA - FORÇA MAIOR
            </h3>
            <div className="pl-9 text-slate-500">
              <p>Nenhuma das partes será responsabilizada pelo descumprimento parcial ou total das obrigações previstas neste termo quando tal descumprimento decorrer de casos fortuitos ou de força maior, incluindo, mas não se limitando a: desastres naturais, incêndios, enchentes, greves, guerras, falhas sistêmicas, ataques cibernéticos, pandemias ou quaisquer outros eventos imprevisíveis e inevitáveis que impeçam a execução das obrigações aqui assumidas. Nesses casos, as obrigações afetadas ficarão suspensas pelo período em que perdurar o evento de força maior, retomando-se sua plena eficácia tão logo cesse a causa impeditiva.</p>
            </div>
          </div>

          {/* Section 13 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">13</span>
              CLÁUSULA DÉCIMA TERCEIRA - ENCERRAMENTO E CONCORDÂNCIA
            </h3>
            <div className="pl-9 text-slate-500">
              <p>O LICENCIADO declara ter lido, compreendido e aceitado integralmente todas as cláusulas e condições estabelecidas neste termo de uso e em seus anexos. Ao confirmar sua adesão, o LICENCIADO reconhece que este termo constitui o acordo completo entre as partes, substituindo quaisquer entendimentos ou comunicações anteriores, verbais ou escritas, relacionadas ao objeto aqui tratado.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-midnight text-slate-500 py-12 px-6 lg:px-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-white">
            <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
              <BookOpen size={14} />
            </div>
            <span className="text-lg font-bold">Serviços Urbanos</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-widest font-bold">© 2026 Serviços Urbanos Tecnologia S.A.</p>
            <p className="opacity-50 text-[9px] lowercase font-medium tracking-normal">
              Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">P4D Mídia</a>
            </p>
          </div>

          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <Link to="/termos-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <span className="text-slate-700">|</span>
            <Link to="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link>
            <span className="text-slate-700">|</span>
            <Link to="/cadastro" className="hover:text-white transition-colors">Cadastro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
