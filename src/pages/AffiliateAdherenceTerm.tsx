import React from 'react';
import { FileText, Download, ShieldCheck, Printer } from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';

export default function AffiliateAdherenceTerm() {
  const { user, profile } = useAuth();
  const { section = 'geral' } = useParams();
  
  const signupDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success('Download do termo iniciado!');
  };

  const getContent = () => {
    switch (section) {
      case 'anexo-1':
        return {
          title: "ANEXO I – Regulamento da Promoção: Vida Light R$ 5.000,00",
          subtitle: "PROMOTORA: MBM Seguradora S/A | EMPRESA DE CAPITALIZAÇÃO: APLUB Capitalização S/A",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                A <strong>MBM Seguradora S/A</strong>, com sede na Rua dos Andradas, nº 772 – Andar 8º, Centro, Porto Alegre/RS, CEP: 90.020-004, inscrita no CNPJ/MF sob o nº 87.883.807/0001-06, na qualidade de Promotora do Evento, é subscritora do Título de Capitalização da Modalidade Incentivo, emitidos pela <strong>APLUB Capitalização S/A</strong>, inscrita no CNPJ/MF nº 88.076.302-0001/94, cuja Nota Técnica e suas Condições Gerais foram aprovadas pela SUSEP, por meio do Processo nº 15414.902121/2019-11.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.1. OBJETIVO DA PROMOÇÃO</h4>
                <p>
                  Visa possibilitar a distribuição gratuita de prêmios de modo a incentivar a aquisição do plano de Seguro denominado “Vida Light R$ 5.000,00”.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.2. PRAZO E ABRANGÊNCIA GEOGRÁFICA</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Início em 01/05/2019, com término indeterminado.</li>
                  <li>Participação válida por 1, 3, 6 ou 12 meses conforme plano contratado.</li>
                  <li>Abrangência nacional.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.3. QUEM PODE PARTICIPAR</h4>
                <p>
                  Pessoas físicas maiores de 18 anos, residentes e domiciliadas no Brasil, que cumpram todas as regras deste regulamento.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.4. COMO PARTICIPAR</h4>
                <p>
                  É necessário adquirir o plano de Seguro.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.5. APURAÇÃO DOS CONTEMPLADOS</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Cada segurado recebe um Número da Sorte após emissão da apólice.</li>
                  <li>Sorteios realizados nos 4 últimos domingos de cada mês pela Loteria Federal.</li>
                  <li>Nos meses com 5 domingos, o primeiro é desconsiderado.</li>
                  <li>O contemplado será aquele cujo número coincidir com os dígitos apurados pela Loteria Federal.</li>
                  <li>Em caso de suspensão da Loteria Federal, a APLUB realizará sorteio próprio, com auditoria independente.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.6. PREMIAÇÃO</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Valor de R$ 5.000,00 bruto de IR.</li>
                  <li>Incidência de 25% de IR conforme legislação vigente.</li>
                  <li>Prêmio pessoal e intransferível.</li>
                  <li>Pagamento em até 15 dias após entrega da documentação exigida.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.7. DIVULGAÇÃO DOS RESULTADOS</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Resultados disponíveis no site da Caixa Econômica Federal.</li>
                  <li>Contemplados informados por e-mail, telefone e/ou endereço cadastrado.</li>
                  <li>Divulgação pública do nome do ganhador somente com anuência expressa.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.8. ENTREGA DOS PRÊMIOS</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Documentos exigidos: RG/CNH, comprovante de residência, dados bancários.</li>
                  <li>Em caso de falecimento, o prêmio será entregue ao espólio.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.9. DESCLASSIFICAÇÃO</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Descumprimento das regras.</li>
                  <li>Cadastro com dados falsos.</li>
                  <li>Interferência fraudulenta.</li>
                  <li>Inadimplência ou cancelamento da apólice.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.10. DISPOSIÇÕES GERAIS</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Participação voluntária implica aceitação integral deste regulamento.</li>
                  <li>MBM Seguradora S/A responde pela validade da promoção.</li>
                  <li>Direitos de sorteio cedidos gratuitamente aos participantes.</li>
                  <li>Prêmios não reclamados em até 90 dias retornam à promotora.</li>
                  <li>Aprovação pela SUSEP não implica recomendação de aquisição.</li>
                  <li>Promoção pode ser alterada ou cancelada conforme normas vigentes.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Regulamento ou dúvidas e controvérsias que não puderem ser resolvidas por meio das cláusulas aqui previstas, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-2':
        return {
          title: "ANEXO II – Condições Gerais do Seguro de Acidentes Pessoais",
          subtitle: "Seguro de Acidentes Pessoais Coletivo | MBM Seguradora S.A.",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e corresponde às condições gerais do Seguro de Acidentes Pessoais, contratado pela <strong>SIC Comércio de Produtos Alimentícios e Serviços Ltda</strong> como estipulante, junto à <strong>MBM Seguradora S.A.</strong>, devidamente autorizada pela SUSEP.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.1. Objeto do Seguro</h4>
                <p>
                  O seguro tem por objetivo garantir o pagamento do capital segurado ao próprio segurado ou a seus beneficiários, em decorrência dos riscos cobertos, observadas as condições gerais e especiais da apólice.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.2. Coberturas</h4>
                <ul className="list-none pl-0 space-y-2">
                  <li><strong>• Garantia Básica:</strong> Morte Acidental (MA).</li>
                  <li className="space-y-1">
                    <strong>• Garantias Adicionais:</strong>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Invalidez Permanente Total ou Parcial por Acidente (IPA).</li>
                      <li>Assistência Funeral.</li>
                      <li>Sorteios vinculados à apólice, conforme regulamento específico (vide Anexo I).</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.3. Âmbito Geográfico</h4>
                <p>
                  Cobertura válida durante 24 horas por dia, em qualquer parte do globo terrestre.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.4. Vigência e Renovação</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O prazo da apólice será definido conforme o plano escolhido pelo segurado (mensal, trimestral, semestral ou anual).</li>
                  <li>Ao término do período contratado, a apólice deverá ser renovada por igual período para dar continuidade às coberturas e benefícios.</li>
                  <li>A renovação poderá ser automática ou expressa, conforme previsto em contrato e regulamento da seguradora.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.5. Grupo Segurável</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pessoas entre 14 e 80 anos, em boas condições de saúde, vinculadas ao estipulante.</li>
                  <li>O ingresso no seguro depende da aprovação da MBM Seguradora S.A.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.6. Exclusões</h4>
                <p>Não estão cobertos, entre outros:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uso de material nuclear, radiações ionizantes.</li>
                  <li>Epidemias e pandemias declaradas por órgão competente.</li>
                  <li>Atos de guerra, terrorismo, motins ou revoluções.</li>
                  <li>Doenças preexistentes não declaradas.</li>
                  <li>Suicídio ou tentativa nos 2 primeiros anos de vigência.</li>
                  <li>Prática de esportes radicais ou atividades de risco não autorizadas.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.7. Proteção de Dados</h4>
                <p>
                  O estipulante, a corretora e a seguradora comprometem-se a cumprir integralmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantindo transparência, segurança e finalidade adequada no tratamento dos dados pessoais dos segurados e beneficiários.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.8. Indenizações</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O valor máximo será limitado ao capital segurado vigente na data do evento.</li>
                  <li>Em caso de invalidez parcial, aplica-se a tabela de percentuais prevista na apólice.</li>
                  <li>O capital segurado por morte acidental e invalidez permanente não se acumulam.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">1.1.9. Sorteios</h4>
                <p>
                  Os segurados concorrerão a sorteios de R$ 5.000,00, conforme regulamento específico (vide Anexo I).
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da comarca do domicílio do segurado para dirimir quaisquer questões oriundas deste contrato.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-3':
        return {
          title: "ANEXO III – Tabela de Percentuais de Indenização por Invalidez Permanente",
          subtitle: "Tabela MBM Seguradora S.A. | Critérios de Cálculo",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e corresponde à tabela oficial utilizada para cálculo das indenizações em caso de invalidez permanente total ou parcial por acidente, conforme contrato coletivo firmado com a MBM Seguradora S.A.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Regras Gerais</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>A indenização será proporcional ao grau de invalidez constatado após alta médica definitiva.</li>
                  <li>Em caso de invalidez parcial, aplica-se o percentual correspondente ao membro ou órgão afetado.</li>
                  <li>A soma dos percentuais não poderá ultrapassar 100% do capital segurado.</li>
                  <li>Havendo invalidez pré-existente, o percentual será deduzido do grau final de invalidez.</li>
                  <li>O capital segurado será automaticamente reintegrado após cada sinistro, sem cobrança adicional.</li>
                  <li>Em caso de morte decorrente do mesmo acidente após pagamento de invalidez, o valor já pago será deduzido da indenização por morte.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Tabela de Percentuais</h4>
                
                <div className="space-y-3">
                  <h5 className="font-bold text-midnight font-sans text-xs uppercase">Invalidez Permanente Total – 100% do capital segurado</h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500">
                    <li>Perda total da visão de ambos os olhos.</li>
                    <li>Perda total do uso de ambos os membros superiores ou inferiores.</li>
                    <li>Perda total do uso de ambas as mãos ou ambos os pés.</li>
                    <li>Alienação mental total e incurável.</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <h5 className="font-bold text-midnight font-sans text-xs uppercase">Invalidez Permanente Parcial – Membros Superiores</h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500">
                    <li>Perda total do uso de uma das mãos – 70%.</li>
                    <li>Perda total do uso de um dos polegares – 25%.</li>
                    <li>Perda total do uso de um dos dedos indicadores – 18%.</li>
                    <li>Perda total do uso de um dos dedos anulares – 9%.</li>
                    <li>Perda total do uso de um dos dedos mínimos ou médios – 12%.</li>
                    <li>Perda total do uso da falange distal do polegar – 15%.</li>
                    <li>Perda total do uso de qualquer falange (exceto polegar) – 1/3 do valor do dedo respectivo.</li>
                    <li>Anquilose total de punho – 30%.</li>
                    <li>Anquilose total de cotovelo – 25%.</li>
                    <li>Anquilose total de ombro – 50%.</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <h5 className="font-bold text-midnight font-sans text-xs uppercase">Invalidez Permanente Parcial – Membros Inferiores</h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500">
                    <li>Perda total do uso de um pé – 50%.</li>
                    <li>Perda total do uso de um dos membros inferiores – 70%.</li>
                    <li>Amputação do 1º dedo do pé – 10%.</li>
                    <li>Amputação de qualquer outro dedo – 5%.</li>
                    <li>Perda parcial de um pé (todos os dedos + parte do pé) – 20%.</li>
                    <li>Anquilose total de quadril – 20%.</li>
                    <li>Anquilose total de joelho – 25%.</li>
                    <li>Anquilose total de tornozelo – 20%.</li>
                    <li>Fratura não consolidada de fêmur – 50%.</li>
                    <li>Fratura não consolidada de tíbia/perônio – 25%.</li>
                    <li>
                      Encurtamento de membro inferior:
                      <ul className="list-circle pl-6 mt-1 space-y-1">
                        <li>&ge; 5 cm – 20%.</li>
                        <li>&ge; 4 cm – 15%.</li>
                        <li>&ge; 3 cm – 10%.</li>
                        <li>&lt; 3 cm – sem indenização.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <h5 className="font-bold text-midnight font-sans text-xs uppercase">Invalidez Permanente Parcial – Diversas</h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500">
                    <li>Surdez total incurável de ambos os ouvidos – 70%.</li>
                    <li>Surdez total incurável de um ouvido – 30%.</li>
                    <li>Mudez incurável – 40%.</li>
                    <li>Perda total da visão de um olho – 30%.</li>
                    <li>
                      Imobilidade da coluna vertebral:
                      <ul className="list-circle pl-6 mt-1 space-y-1">
                        <li>Segmento cervical – 20%.</li>
                        <li>Segmento tóraco-lombo-sacro – 50%.</li>
                      </ul>
                    </li>
                    <li>Fratura não consolidada do maxilar inferior – 20%.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-4':
        return {
          title: "ANEXO IV – Regras de Cobrança, Renovação e Participação nos Sorteios",
          subtitle: "Parceria com MBM Seguradora S.A. | Regras de Cobrança e Vigência",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras de cobrança, vigência da apólice e participação nos sorteios vinculados ao seguro contratado pela <strong>SIC Comércio de Produtos Alimentícios e Serviços Ltda</strong>, em parceria com a <strong>MBM Seguradora S.A.</strong>
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Modalidades de Cobrança</h4>
                <p>O segurado poderá optar por uma das seguintes modalidades de cobrança:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Mensal</strong> – pagamento realizado a cada mês.</li>
                  <li><strong>Trimestral</strong> – pagamento realizado a cada 3 meses.</li>
                  <li><strong>Semestral</strong> – pagamento realizado a cada 6 meses.</li>
                  <li><strong>Anual</strong> – pagamento realizado uma vez por ano.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Vigência da Apólice</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O prazo da apólice será definido conforme a modalidade de cobrança escolhida pelo segurado.</li>
                  <li>A vigência da apólice corresponderá ao período contratado (mensal, trimestral, semestral ou anual).</li>
                  <li>Ao término do período contratado, a apólice deverá ser renovada por igual período para dar continuidade às coberturas e benefícios.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Renovação</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>A renovação poderá ser automática ou expressa, conforme previsto em contrato e regulamento da seguradora.</li>
                  <li>Caso o segurado realize sua adesão em setembro, deverá renovar em novembro para continuar tendo direito às coberturas e participar dos sorteios subsequentes.</li>
                  <li>A falta de renovação implicará na suspensão imediata das coberturas e sorteios vinculados.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Inadimplência</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Em caso de inadimplência, o segurado ficará suspenso dos sorteios e coberturas até a regularização dos pagamentos.</li>
                  <li>Persistindo a inadimplência, a apólice poderá ser cancelada, conforme regras da seguradora.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Participação nos Sorteios</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado receberá seu Número da Sorte após a emissão da apólice.</li>
                  <li>O Número da Sorte ficará disponível no dashboard do segurado, acessível por meio do sistema digital da empresa estipulante.</li>
                  <li>A participação nos sorteios terá início no mês subsequente à adesão, sempre nos 4 últimos domingos de cada mês.</li>
                  <li>Nos meses em que houver 5 domingos, será desconsiderado o primeiro domingo, mantendo-se os sorteios apenas nos 4 últimos.</li>
                  <li><strong>Exemplo:</strong> caso o segurado realize sua adesão em setembro, passará a concorrer nos sorteios a partir dos últimos quatro domingos do mês de outubro, desde que esteja com sua apólice vigente e renovada conforme previsto.</li>
                  <li>A manutenção da participação nos sorteios está condicionada ao pagamento regular das parcelas do plano contratado.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">Continuidade dos Benefícios</h4>
                <p>
                  A manutenção dos benefícios (indenizações, sorteios) está condicionada ao pagamento regular das parcelas escolhidas e à renovação da apólice. O segurado declara ciência de que a interrupção dos pagamentos ou a não renovação implica na perda imediata dos direitos vinculados ao seguro e à promoção.
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-5':
        return {
          title: "ANEXO V – Regras de Proteção de Dados (LGPD)",
          subtitle: "Termo de Confidencialidade e Tratamento de Dados | Conformidade com a Lei nº 13.709/2018",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras de proteção de dados pessoais dos segurados, em conformidade com a Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018).
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Finalidade do Tratamento</h4>
                <p>Os dados pessoais coletados dos segurados e beneficiários serão utilizados exclusivamente para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Emissão e gestão da apólice de seguro.</li>
                  <li>Inclusão e manutenção do segurado no plano contratado.</li>
                  <li>Participação nos sorteios vinculados (vide Anexo I).</li>
                  <li>Cumprimento de obrigações legais e regulatórias junto à SUSEP e demais órgãos competentes.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Controladores e Operadores</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Controlador:</strong> SIC Comércio de Produtos Alimentícios e Serviços Ltda, como estipulante do contrato.</li>
                  <li><strong>Operadores:</strong> MBM Seguradora S.A. e APLUB Capitalização S.A., responsáveis pela execução das atividades relacionadas ao seguro e à promoção.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Direitos dos Titulares</h4>
                <p>Os segurados e beneficiários têm direito a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Confirmar a existência de tratamento de seus dados pessoais.</li>
                  <li>Solicitar acesso, correção ou exclusão de seus dados.</li>
                  <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço ou produto.</li>
                  <li>Revogar o consentimento para o tratamento de dados, quando aplicável.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Compartilhamento de Dados</h4>
                <p>Os dados pessoais poderão ser compartilhados com:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Órgãos reguladores e fiscalizadores, como a SUSEP.</li>
                  <li>Parceiros contratados para execução de serviços vinculados ao seguro e à promoção.</li>
                  <li>Autoridades públicas, quando exigido por lei ou decisão judicial.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Segurança da Informação</h4>
                <p>
                  O estipulante, a seguradora e a empresa de capitalização comprometem-se a adotar medidas técnicas e administrativas aptas a proteger os dados pessoais contra acessos não autorizados, perda, alteração ou qualquer forma de tratamento inadequado ou ilícito.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Retenção dos Dados</h4>
                <p>
                  Os dados pessoais serão mantidos pelo período necessário para cumprimento das finalidades descritas neste Anexo, observadas as obrigações legais e regulatórias aplicáveis.
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-6':
        return {
          title: "ANEXO VI – Regras de Divulgação e Publicidade da Promoção",
          subtitle: "Divulgação de Sorteios e Uso de Imagem | Seguro Vida Light R$ 5.000,00",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras de divulgação e publicidade da promoção vinculada ao seguro Vida Light R$ 5.000,00.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Divulgação dos Resultados</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Os resultados dos sorteios serão divulgados no site oficial da Caixa Econômica Federal e no portal da promotora.</li>
                  <li>Os contemplados serão informados por e-mail, telefone e/ou endereço cadastrado no momento da adesão.</li>
                  <li>A divulgação pública do nome dos ganhadores somente ocorrerá mediante autorização expressa do contemplado.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Uso de Imagem e Nome</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado contemplado poderá autorizar o uso de sua imagem e nome em materiais de divulgação da promoção.</li>
                  <li>A autorização será gratuita e não implicará em qualquer obrigação financeira por parte da promotora.</li>
                  <li>O uso da imagem e nome será restrito à divulgação dos resultados e campanhas relacionadas à promoção.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Responsabilidade da Promotora</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>A MBM Seguradora S.A. é responsável pela veracidade das informações divulgadas e pela condução transparente da promoção.</li>
                  <li>A promotora compromete-se a não veicular publicidade enganosa ou abusiva.</li>
                  <li>Todas as peças publicitárias deverão conter informações claras sobre a natureza da promoção, prêmios e condições de participação.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Meios de Divulgação</h4>
                <p>A divulgação poderá ocorrer por meio de:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Internet (sites oficiais, redes sociais, e-mails).</li>
                  <li>Telefone e correspondência direta.</li>
                  <li>Materiais impressos e campanhas publicitárias.</li>
                  <li>A promotora poderá utilizar diferentes canais de comunicação, sempre respeitando a legislação vigente e os direitos dos segurados.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-7':
        return {
          title: "ANEXO VII – Regras de Cancelamento e Exclusão de Participantes",
          subtitle: "Suspensão de Direitos e Exclusão | Seguro Vida Light R$ 5.000,00",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras aplicáveis ao cancelamento da apólice e à exclusão de participantes da promoção vinculada ao seguro Vida Light R$ 5.000,00.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Cancelamento da Apólice</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O cancelamento poderá ocorrer por iniciativa do segurado ou da seguradora, conforme previsto nas condições gerais da apólice.</li>
                  <li>O segurado poderá solicitar o cancelamento a qualquer momento, mediante comunicação formal ao estipulante ou à seguradora.</li>
                  <li>A seguradora poderá cancelar a apólice em caso de inadimplência, fraude ou descumprimento das regras contratuais.</li>
                  <li>O cancelamento implica na perda imediata das coberturas e da participação nos sorteios vinculados.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Exclusão de Participantes</h4>
                <p>Serão excluídos da promoção os segurados que:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prestarem informações falsas ou incorretas no momento da adesão.</li>
                  <li>Tentarem fraudar ou manipular os resultados dos sorteios.</li>
                  <li>Descumprirem as regras estabelecidas nos anexos do Termo de Adesão.</li>
                  <li>Estiverem inadimplentes com suas obrigações financeiras.</li>
                  <li>A exclusão será definitiva e implicará na perda dos direitos de participação e recebimento de prêmios.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Comunicação de Cancelamento ou Exclusão</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado será informado por e-mail, telefone ou endereço cadastrado sobre o cancelamento ou exclusão.</li>
                  <li>A comunicação será feita em até 10 dias úteis após a decisão da seguradora ou do estipulante.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Efeitos do Cancelamento ou Exclusão</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado perde imediatamente o direito às coberturas do seguro e à participação nos sorteios.</li>
                  <li>Caso o cancelamento ou exclusão ocorra após a contemplação em sorteio, o prêmio não será entregue.</li>
                  <li>O segurado poderá solicitar nova adesão, desde que cumpra todas as condições exigidas pela seguradora.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-8':
        return {
          title: "ANEXO VIII – Regras de Comissionamento (MMN)",
          subtitle: "Funcionamento das Comissões por Indicação e Rede",
          body: (
            <div className="space-y-6">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras de comissionamento aplicáveis ao modelo de marketing multinível (MMN) vinculado ao seguro Vida Light R$ 5.000,00.
              </p>
              
              <div className="space-y-3">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Objetivo</h3>
                <p>
                  Definir critérios e condições para o pagamento de comissões aos afiliados que atuarem como indicantes de novos participantes no plano.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Formas de Comissionamento</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    O afiliado (G0) terá direito a comissões sobre:
                    <ul className="list-circle pl-6 mt-1 space-y-1">
                      <li><strong>Seu próprio plano de assinaturas</strong> pagos em seu CPF.</li>
                      <li><strong>G1:</strong> Indicações diretas realizadas pelo afiliado (G0).</li>
                      <li><strong>G2:</strong> Indicações diretas realizadas pelos indicados de G1 e também indicações indiretas de G0.</li>
                    </ul>
                  </li>
                  <li>
                    As comissões incidem sobre os pagamentos realizados no próprio mês (G0), conforme previsto no Termo de Uso.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Pagamento das Comissões</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    O pagamento será realizado semanalmente, mensalmente e anualmente, mediante crédito em conta bancária cadastrada pelo afiliado.
                  </li>
                  <li>
                    O afiliado deverá estar adimplente com suas obrigações financeiras para receber as comissões semanais, mensais e anuais.
                  </li>
                  <li>
                    Em caso de inadimplência ou cancelamento da apólice, o direito às comissões será suspenso.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Regras de Transparência</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    O afiliado terá acesso ao seu extrato de comissões por meio do dashboard digital disponibilizado pela estipulante.
                  </li>
                  <li>
                    O extrato conterá informações detalhadas sobre:
                    <ul className="list-circle pl-6 mt-1 space-y-1">
                      <li>Os valores recebidos referentes ao G0 (produtos e planos adquiridos pelo próprio afiliado em seu CPF).</li>
                      <li>Os valores recebidos referentes às indicações G1 e G2.</li>
                      <li>A situação dos indicados ativos e os níveis de indicação.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Fraudes e Irregularidades</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Qualquer tentativa de fraude ou manipulação das regras de comissionamento implicará na exclusão imediata do afiliado da rede de indicações.
                  </li>
                  <li>
                    A estipulante poderá cancelar o direito às comissões e rescindir a apólice em caso de irregularidades comprovadas.
                  </li>
                </ul>
              </div>
            </div>
          )
        };
      case 'anexo-9':
        return {
          title: "ANEXO IX – Regras de Utilização da Telemedicina",
          subtitle: "Acesso a Consultas Online e Responsabilidades | Seguro Vida Light R$ 5.000,00",
          body: (
            <div className="space-y-6 text-justify">
              <p>
                O presente Anexo integra o Termo de Adesão e estabelece as regras de utilização do serviço de telemedicina disponibilizado aos segurados vinculados ao seguro Vida Light R$ 5.000,00.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Objetivo</h4>
                <p>
                  Garantir acesso dos segurados a consultas médicas e orientações de saúde por meio de plataformas digitais, de forma prática, segura e regulamentada.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Serviços Disponíveis</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Consultas médicas online em diversas especialidades.</li>
                  <li>Atendimento emergencial remoto para triagem inicial.</li>
                  <li>Emissão de prescrições médicas digitais, quando aplicável.</li>
                  <li>Orientações de saúde preventiva e acompanhamento de tratamentos.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Acesso ao Serviço</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado terá acesso ao serviço de telemedicina por meio de login e senha fornecidos pela estipulante.</li>
                  <li>O acesso poderá ser realizado via aplicativo ou portal web.</li>
                  <li>O serviço estará disponível em regime de 24 horas, todos os dias da semana.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Regras de Utilização</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O segurado deverá manter seus dados cadastrais atualizados para garantir o acesso ao serviço.</li>
                  <li>O atendimento será realizado exclusivamente por médicos credenciados e autorizados pela plataforma.</li>
                  <li>O serviço de telemedicina não substitui atendimentos presenciais em casos que exijam exames físicos ou procedimentos clínicos.</li>
                  <li>O uso indevido do serviço poderá implicar na suspensão temporária ou definitiva do acesso.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Confidencialidade e Proteção de Dados</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Todas as informações médicas e pessoais serão tratadas em conformidade com a LGPD (Lei nº 13.709/2018).</li>
                  <li>O histórico de atendimentos será armazenado de forma segura e acessível apenas ao segurado e aos profissionais autorizados.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase border-b border-slate-100 pb-2">Custos e Cobertura</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O serviço de telemedicina está incluído no plano contratado, sem custos adicionais ao segurado.</li>
                  <li>Consultas e procedimentos não previstos poderão ser cobrados à parte, conforme regulamento da seguradora.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-midnight font-sans text-sm uppercase">FORO</h4>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Anexo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
      case 'anexo-10':
        return {
          title: "ANEXO X – Regras de Quantidade de Sorteios por Modalidade de Cobrança",
          subtitle: "Participação nos Sorteios da Loteria Federal",
          body: (
            <div className="space-y-6">
              <p>
                Este Anexo integra o Termo de Adesão e estabelece a quantidade de sorteios a que o segurado terá direito, de acordo com a modalidade de cobrança escolhida:
              </p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Mensal:</strong> participação em <strong>4 sorteios por mês</strong>, durante o período de vigência da apólice.</li>
                <li><strong>Trimestral:</strong> participação em <strong>12 sorteios</strong> no período contratado.</li>
                <li><strong>Semestral:</strong> participação em <strong>24 sorteios</strong> no período contratado.</li>
                <li><strong>Anual:</strong> participação em <strong>48 sorteios</strong> no período contratado.</li>
              </ul>

              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Observações</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Nos meses em que houver 5 domingos, será desconsiderado o primeiro domingo, mantendo-se os sorteios apenas nos 4 últimos domingos de cada mês.
                  </li>
                  <li>
                    Para continuar concorrendo aos sorteios, o segurado deverá realizar a renovação do plano conforme a opção disponível em seu dashboard digital, mantendo a apólice vigente e adimplente.
                  </li>
                </ol>
              </div>
            </div>
          )
        };
      case 'anexo-11':
        return {
          title: "ANEXO XI – Documentos Necessários para Recebimento da Indenização",
          subtitle: "Instrução de Processos de Sinistro por Acidente",
          body: (
            <div className="space-y-6">
              <p>
                Para o recebimento da indenização decorrente das coberturas contratadas, o Segurado ou seus Beneficiários deverão apresentar à Seguradora os seguintes documentos, conforme previsto nas Condições Contratuais:
              </p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Formulário de Aviso de Sinistro devidamente preenchido.</li>
                <li>Certificado Individual ou documento que comprove a inclusão do Segurado na apólice.</li>
                <li>Documento de Identificação do Segurado e dos Beneficiários (RG, CPF ou equivalente).</li>
                <li>Declaração Médica ou Laudo Médico quando se tratar de invalidez permanente ou doença grave, indicando a data e a natureza do evento.</li>
                <li>Folha de Anestesia (quando aplicável), detalhando o procedimento anestésico e cirúrgico.</li>
                <li>Atestado de Óbito em caso de morte acidental.</li>
                <li>Comprovante de vínculo com o Estipulante, quando solicitado.</li>
                <li>Outros documentos que a Seguradora julgar necessários para análise do sinistro, conforme previsto nas Condições Gerais e Especiais.</li>
              </ol>

              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">Observações</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>A Seguradora poderá solicitar documentos complementares para análise do sinistro.</li>
                  <li>O prazo de análise será suspenso até a entrega formal dos documentos faltantes.</li>
                  <li>O pagamento da indenização será limitado ao Capital Segurado vigente na data do evento.</li>
                </ul>
              </div>
            </div>
          )
        };
      default:
        return {
          title: "TERMO DE ADESÃO – SEGURO DE ACIDENTES PESSOAIS",
          subtitle: "PROCESSO SUSEP 10.004808/99-14 – SEGURO VIDA LIGHT R$ 5.000,00",
          body: (
            <div className="space-y-6">
              <p>
                Este Termo de Adesão formaliza a participação no plano Vida Light R$ 5.000,00, promovido pela <strong>SIC Comércio de Produtos Alimentícios e Serviços Ltda</strong> sobre CNPJ/MF nº 54.795.377/0001-03, em parceria com a <strong>MBM Seguradora S.A.</strong> inscrita no CNPJ/MF nº 92.892.256/0001-79 e a <strong>APLUB Capitalização S.A.</strong> inscrita no CNPJ/MF nº 88.076.302-0001/94, conforme regulamentos e condições gerais aprovados pela SUSEP por meio do Processo nº 15414.902121/2019-11.
              </p>
              <p>
                Ao aderir, o segurado declara ciência e concordância com todas as regras descritas nos anexos integrantes deste contrato.
              </p>

              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider border-b border-slate-100 pb-2">ANEXOS INTEGRANTES</h3>
                
                <ul className="space-y-4 list-none pl-0">
                  <li>
                    <strong>• Anexo I – Regulamento da Promoção:</strong> regras de participação nos sorteios e premiações, incluindo detalhamento da apuração do número ganhador (sorteios nos 4 últimos domingos de cada mês).
                  </li>
                  <li>
                    <strong>• Anexo II – Condições Gerais do Seguro de Acidentes Pessoais:</strong> direitos e deveres do segurado em relação às coberturas.
                  </li>
                  <li>
                    <strong>• Anexo III – Tabela de Percentuais de Indenização por Invalidez Permanente:</strong> critérios de cálculo das indenizações (documento oficial MBM/APLUB, sem alterações).
                  </li>
                  <li>
                    <strong>• Anexo IV – Regras de Cobrança, Renovação e Participação nos Sorteios:</strong> formas de pagamento, vigência e renovação da apólice.
                  </li>
                  <li>
                    <strong>• Anexo V – Regras de Proteção de Dados (LGPD):</strong> tratamento e segurança das informações pessoais.
                  </li>
                  <li>
                    <strong>• Anexo VI – Regras de Divulgação e Publicidade da Promoção:</strong> comunicação dos resultados e uso da imagem dos ganhadores.
                  </li>
                  <li>
                    <strong>• Anexo VII – Regras de Cancelamento e Exclusão de Participantes:</strong> hipóteses de perda de direitos por inadimplência, fraude ou descumprimento.
                  </li>
                  <li>
                    <strong>• Anexo VIII – Regras de Comissionamento (MMN):</strong> funcionamento das comissões por indicação e rede.
                  </li>
                  <li>
                    <strong>• Anexo IX – Regras de Utilização da Telemedicina:</strong> acesso ao link de agendamento de consultas no dashboard e responsabilidade pelos pagamentos.
                  </li>
                  <li className="space-y-2">
                    <strong>• Anexo X – Regras de Quantidade de Sorteios por Modalidade de Cobrança:</strong>
                    <ul className="pl-6 list-disc space-y-1">
                      <li>Mensal → 4 sorteios por mês</li>
                      <li>Trimestral → 12 sorteios no período contratado</li>
                      <li>Semestral → 24 sorteios no período contratado</li>
                      <li>Anual → 48 sorteios no período contratado</li>
                    </ul>
                    <p className="text-xs text-slate-500 italic pl-6 mt-1">
                      Observações: nos meses com 5 domingos, desconsidera-se o primeiro; para continuar concorrendo, o segurado deve renovar o plano conforme opção disponível em seu dashboard.
                    </p>
                  </li>
                  <li className="space-y-2">
                    <strong>• Anexo XI – Documentos Necessários para Recebimento da Indenização:</strong> lista de documentos obrigatórios (Aviso de Sinistro, Certificado Individual, RG/CPF, Laudo Médico, Folha de Anestesia, Atestado de Óbito, etc.).
                    <ul className="pl-6 list-disc space-y-1 text-slate-500 text-xs">
                      <li>A Seguradora poderá solicitar documentos complementares.</li>
                      <li>O prazo de análise será suspenso até a entrega formal dos documentos faltantes.</li>
                      <li>O pagamento da indenização será limitado ao Capital Segurado vigência na data do evento.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-midnight font-sans uppercase text-xs tracking-wider">FORO</h3>
                <p>
                  Fica eleito o foro da Comarca de Salvador/BA para dirimir quaisquer questões oriundas deste Termo de Adesão e seus anexos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>
          )
        };
    }
  };

  const currentContent = getContent();

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
            <h2 className="font-bold text-midnight text-xl font-sans uppercase">{currentContent.title}</h2>
            {currentContent.subtitle && (
              <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold">{currentContent.subtitle}</p>
            )}
          </div>

          <div className="space-y-6">
            {currentContent.body}
          </div>

          {/* Assinatura Visual */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-t border-slate-100">
            <div>
              <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold mb-1">Assinatura do Contratado</p>
              <p className="font-bold text-midnight">{profile?.full_name || 'Afiliado Cadastrado'}</p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">E-mail: {user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-sans tracking-widest text-slate-400 font-bold mb-1">Pela Contratante</p>
              <p className="font-bold text-midnight">SIC Comércio de Produtos Alimentícios e Serviços Ltda</p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">CNPJ: 54.795.377/0001-03</p>
            </div>
          </div>

        </div>

      </div>
    </AffiliateLayout>
  );
}
