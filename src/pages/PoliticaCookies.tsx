import React from 'react';
import { Eye, BookOpen, ShieldCheck, ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function PoliticaCookies() {
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
            Política de Cookies
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Cookie size={16} className="text-primary-blue" /> Transparência e controle sobre a sua navegação
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-100/50 space-y-8 text-sm md:text-base leading-relaxed">
          <p className="font-bold text-slate-700">
            A Plataforma Serviços Urbanos (“PLATAFORMA”) utiliza cookies e tecnologias semelhantes para melhorar a experiência do usuário (“AFILIADO”), garantir segurança e personalizar conteúdos. O AFILIADO está ciente de que, ao aceitar digitalmente este Termo, concorda com o uso de cookies conforme descrito abaixo.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">1</span>
              1.1.1. O que são Cookies
            </h3>
            <div className="pl-9 space-y-2">
              <p>Cookies são pequenos arquivos de texto armazenados no dispositivo do usuário (computador, smartphone, tablet) quando acessa a PLATAFORMA. Eles permitem reconhecer o dispositivo do AFILIADO, lembrar suas preferências, configurações anteriores e coletar informações genéricas de navegação para melhorar o desempenho técnico do sistema.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">2</span>
              1.1.2. Tipos de Cookies Utilizados
            </h3>
            <div className="pl-9 space-y-3">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Essenciais:</strong> necessários para a operação básica e funcionamento correto da PLATAFORMA (gerenciamento de login, sessões de autenticação segura e proteção contra fraudes).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Funcionais:</strong> armazenam preferências básicas do usuário para navegação futura (tais como configurações de idioma, tamanho da fonte e preferências visuais).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Analíticos:</strong> coletam dados de navegação anonimizados para análise estatística de tráfego, medição de desempenho técnico e melhoria geral da usabilidade da PLATAFORMA.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span><strong>Marketing:</strong> utilizados para oferecer banners informativos, comunicações personalizadas e promoções mais alinhadas com o perfil de navegação do AFILIADO.</span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">3</span>
              1.1.3. Finalidade
            </h3>
            <p className="pl-9 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Os cookies são operados estritamente para:</p>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Garantir o acesso seguro, estável e contínuo às áreas logadas da PLATAFORMA.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Personalizar de forma ágil a experiência visual do AFILIADO.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Analisar métricas agregadas de uso e relatórios de erros técnicos.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span>Exibir ofertas de cashback e comunicações direcionadas.</span>
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">4</span>
              1.1.4. Gestão de Cookies
            </h3>
            <div className="pl-9">
              <p>O AFILIADO possui a liberdade de gerenciar, bloquear ou desativar o uso de cookies a qualquer momento, configurando as opções diretamente em seu navegador web. Contudo, a desativação de cookies essenciais poderá prejudicar sensivelmente ou inviabilizar o funcionamento correto e seguro dos recursos da PLATAFORMA.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">5</span>
              1.1.5. Alterações
            </h3>
            <div className="pl-9">
              <p>A PLATAFORMA poderá modificar esta Política de Cookies a qualquer tempo, com o objetivo de adaptá-la às atualizações tecnológicas ou regulatórias. Eventuais modificações serão comunicadas previamente em nossos canais de comunicação. O uso continuado do sistema após tais alterações implica aceitação tácita da nova política.</p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">6</span>
              1.1.6. Foro
            </h3>
            <div className="pl-9">
              <p>Esta Política é regida em sua totalidade pela legislação brasileira. Para dirimir quaisquer dúvidas, divergências ou conflitos decorrentes deste documento, fica eleito como foro exclusivo a comarca de <strong>Salvador/BA</strong>.</p>
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
            <Link to="/termos-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <span className="text-slate-700">|</span>
            <Link to="/cadastro" className="hover:text-white transition-colors">Cadastro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
