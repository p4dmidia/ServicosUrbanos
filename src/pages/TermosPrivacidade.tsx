import React from 'react';
import { Shield, BookOpen, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function TermosPrivacidade() {
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
            Termo de Privacidade
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} className="text-primary-blue" /> Proteção de dados e conformidade com a LGPD
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-100/50 space-y-8 text-sm md:text-base leading-relaxed">
          <p className="font-bold text-slate-700">
            A Plataforma Serviços Urbanos (“PLATAFORMA”) valoriza a privacidade e a proteção dos dados pessoais de seus usuários (“AFILIADOS”). Este Termo de Privacidade estabelece como coletamos, utilizamos, armazenamos e protegemos suas informações. O AFILIADO está ciente de que, ao aceitar digitalmente este Termo, concorda com todas as condições aqui estabelecidas, autorizando o tratamento de seus dados pessoais conforme descrito.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">1</span>
              1.1.1. Coleta de Dados
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Informações fornecidas no cadastro:</strong> nome, CPF, e-mail, telefone, dados bancários.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Dados de navegação e uso da PLATAFORMA:</strong> para fins de segurança, prevenção de fraudes e melhoria da experiência de uso.</span>
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">2</span>
              1.1.2. Finalidade do Tratamento
            </h3>
            <p className="pl-9 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Os dados pessoais são utilizados para:</p>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Identificação e autenticação do AFILIADO.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Processamento de compras e pagamentos.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Apuração e distribuição de benefícios de cashback dentro da rede.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Comunicação de atualizações, notificações de transações, promoções e alterações nos Termos.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Cumprimento de obrigações legais, fiscais e regulatórias.</span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">3</span>
              1.1.3. Compartilhamento de Dados
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Os dados poderão ser compartilhados com parceiros comerciais e prestadores de serviços, exclusivamente para execução e suporte técnico das atividades operacionais da PLATAFORMA.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1.5">•</span>
                <span><strong>Não haverá venda ou cessão de dados</strong> a terceiros para fins publicitários ou alheios ao objeto de atuação da PLATAFORMA.</span>
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">4</span>
              1.1.4. Armazenamento e Segurança
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Os dados são armazenados em ambiente seguro, controlado e criptografado na nuvem.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>São adotadas melhores práticas, medidas técnicas e administrativas robustas para proteger as informações contra acessos não autorizados, perda acidental, alteração ou destruição indevida.</span>
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">5</span>
              1.1.5. Direitos do Usuário (LGPD)
            </h3>
            <p className="pl-9 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">O AFILIADO poderá, a qualquer momento e em conformidade com a Lei Geral de Proteção de Dados:</p>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Solicitar acesso facilitado às suas informações pessoais armazenadas.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Corrigir ou atualizar dados que estejam incompletos ou desatualizados.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Solicitar a exclusão ou anonimização de seus dados, observadas as obrigações legais de manutenção e guarda de registros contratuais.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1.5">•</span>
                <span>Revogar o consentimento para tratamento de dados, ficando ciente de que tal revogação poderá inviabilizar o uso continuado da PLATAFORMA e seus benefícios.</span>
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">6</span>
              1.1.6. Retenção de Dados
            </h3>
            <div className="pl-9">
              <p>Os dados serão mantidos pelo período necessário para cumprimento das finalidades descritas neste Termo, bem como para o cumprimento das exigências legais, fiscais e regulatórias vigentes na legislação brasileira.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">7</span>
              1.1.7. Alterações
            </h3>
            <div className="pl-9">
              <p>A PLATAFORMA poderá modificar este Termo de Privacidade a qualquer tempo, mediante comunicação prévia aos usuários através dos canais de cadastro. O uso continuado da PLATAFORMA após a publicação das alterações implica concordância expressa com as novas condições estabelecidas.</p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">8</span>
              1.1.8. Foro
            </h3>
            <div className="pl-9">
              <p>Este Termo é regido em sua totalidade pela legislação brasileira. Para dirimir quaisquer dúvidas, divergências ou conflitos oriundos deste instrumento, fica eleito como foro exclusivo a comarca de <strong>Salvador/BA</strong>.</p>
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
            <Link to="/termos-uso" className="hover:text-white transition-colors">Termos de Uso</Link>
            <span className="text-slate-700">|</span>
            <Link to="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link>
            <span className="text-slate-700">|</span>
            <Link to="/cadastro" className="hover:text-white transition-colors">Cadastro</Link>
            <span className="text-slate-700">|</span>
            <Link to="/login" className="hover:text-white transition-colors">Fazer Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
