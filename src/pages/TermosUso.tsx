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
            Ao se cadastrar e utilizar a Plataforma Serviços Urbanos (“PLATAFORMA”), o usuário (“AFILIADO”) declara ter lido, compreendido e aceitado integralmente os presentes Termos de Uso. O aceite se dá de forma digital, mediante seleção da opção “Li e concordo” ou ação equivalente no site/aplicativo. O AFILIADO está ciente de que, ao aceitar digitalmente, concorda com todas as condições aqui estabelecidas, assumindo integral responsabilidade pelo cumprimento destes Termos.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">1</span>
              1.1.1. Objeto
            </h3>
            <div className="pl-9">
              <p>A PLATAFORMA disponibiliza benefícios de cashback mensal, digital e anual vinculados ao consumo de produtos e serviços pelo AFILIADO e por seus indicados até a 5ª geração.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">2</span>
              1.1.2. Cadastro e Conta
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>O AFILIADO deve fornecer informações verdadeiras e atualizadas.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>O acesso é pessoal e intransferível.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>O tratamento de dados pessoais seguirá a Lei nº 13.709/2018 (LGPD).</span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">3</span>
              1.1.3. Compras e Pagamentos
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Todas as compras devem ser realizadas via PIX no site oficial.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Apenas compras concluídas e pagas por este meio geram direito a cashback.</span>
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">4</span>
              1.1.4. Cashback
            </h3>
            <div className="pl-9 space-y-3">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span><strong>Mensal:</strong> 1,35% sobre compras da Geração 0 a 5, pago no dia 10 do mês seguinte.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span><strong>Digital:</strong> 0,20% para uso exclusivo dentro da PLATAFORMA, liberado <strong>APÓS ESTAR ELEGÍVEL MENSALMENTE</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-1.5">•</span>
                <span><strong>Anual:</strong> 0,20% sobre compras da Geração 0 a 5, pago em 10 de dezembro.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-1.5">•</span>
                <span><strong>Condição:</strong> o AFILIADO deve realizar ao menos uma compra mensal e confirmar retirada ou prestação de serviço.</span>
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">5</span>
              1.1.5. Penalidades por Inatividade
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1.5">•</span>
                <span><strong>Ausência de consumo mínimo mensal:</strong> perda de 50% do cashback acumulado.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1.5">•</span>
                <span><strong>Inatividade superior a 90 dias:</strong> bloqueio da conta e perda integral dos valores.</span>
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">6</span>
              1.1.6. Taxa Administrativa e Impostos
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Incide taxa administrativa de 10% sobre todos os cashbacks.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Retenção de IRRF quando aplicável.</span>
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">7</span>
              1.1.7. Sistema de Indicação
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Indicações válidas até a 5ª geração.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1.5">•</span>
                <span>É proibida fraude, simulação de compras ou criação de contas falsas.</span>
              </p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">8</span>
              1.1.8. Pagamentos e Resgates
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Cashback mensal e anual: creditado em conta bancária do titular.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Cashback digital: uso exclusivo dentro da PLATAFORMA.</span>
              </p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">9</span>
              1.1.9. Direitos e Deveres do Usuário
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Utilizar a PLATAFORMA de forma lícita e ética.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Manter dados cadastrais atualizados.</span>
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">10</span>
              1.1.10. Direitos e Deveres da Plataforma
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Garantir funcionamento, salvo manutenção ou falhas técnicas.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Alterar percentuais e condições de cashback mediante aviso prévio.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>Suspender ou excluir contas em caso de descumprimento dos presentes Termos.</span>
              </p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">11</span>
              1.1.11. Limitação de Responsabilidade
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>A PLATAFORMA não se responsabiliza por falhas externas, como problemas bancários ou de conexão.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>O cashback constitui benefício promocional e não representa investimento financeiro ou promessa de rendimento.</span>
              </p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">12</span>
              1.1.12. Alterações
            </h3>
            <div className="pl-9 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>A PLATAFORMA poderá modificar estes Termos a qualquer tempo, mediante comunicação prévia.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-blue font-bold mt-1.5">•</span>
                <span>O uso continuado da PLATAFORMA após alterações implica concordância com os novos termos.</span>
              </p>
            </div>
          </div>

          {/* Section 13 */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-black text-midnight uppercase tracking-tight flex items-center gap-3">
              <span className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">13</span>
              1.1.13. Foro
            </h3>
            <div className="pl-9">
              <p>Este Termo é regido pela legislação brasileira. Para dirimir conflitos, fica eleito o foro da comarca de <strong>Salvador/BA</strong>.</p>
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
