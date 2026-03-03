/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutGrid,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  Download,
  ExternalLink,
  TrendingUp,
  Globe,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative w-full bg-midnight overflow-hidden py-20 lg:py-32">
          {/* Background Glows */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-blue rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col gap-8"
              >
                <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                  Tudo o que sua cidade oferece, em um único <span className="text-accent">ecossistema.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed">
                  Mobilidade, Delivery e Compras. Use, indique amigos e ganhe Cashback todos os meses no app mais completo do Brasil.
                </p>
                <div>
                  <button className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-4 rounded-xl text-lg font-bold transition-transform active:scale-95 shadow-xl shadow-accent/30">
                    Explore os Aplicativos
                  </button>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-midnight bg-slate-700 overflow-hidden">
                        <img
                          src={`https://picsum.photos/seed/user${i}/100/100`}
                          alt="User"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium">+50k usuários ativos hoje</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative flex justify-center lg:justify-end"
              >
                {/* Phone Mockup */}
                <div className="relative w-full max-w-[380px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 to-accent/10"></div>

                  {/* Notch */}
                  <div className="absolute top-0 w-full h-8 bg-black/40 flex justify-center items-end pb-1">
                    <div className="w-16 h-4 bg-black rounded-full"></div>
                  </div>

                  {/* App Content UI */}
                  <div className="p-6 pt-12 flex flex-col gap-6">
                    <div className="w-full h-32 bg-slate-800/50 rounded-2xl border border-white/5"></div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-square bg-accent/10 rounded-2xl flex flex-col items-center justify-center p-4 border border-accent/20">
                        <Car className="text-accent" size={32} />
                        <span className="text-[10px] mt-2 font-bold text-white">Moby</span>
                      </div>
                      <div className="aspect-square bg-primary-blue/10 rounded-2xl flex flex-col items-center justify-center p-4 border border-primary-blue/20">
                        <UtensilsCrossed className="text-primary-blue" size={32} />
                        <span className="text-[10px] mt-2 font-bold text-white">Food</span>
                      </div>
                      <div className="aspect-square bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center p-4 border border-white/5">
                        <ShoppingBag className="text-slate-400" size={32} />
                      </div>
                      <div className="aspect-square bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center p-4 border border-white/5">
                        <div className="size-8 rounded-full border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-slate-400 text-xs font-bold">$</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cashback Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -top-6 -left-6 bg-slate-800 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
                >
                  <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cashback Acumulado</p>
                    <p className="text-sm font-bold text-white">R$ 1.240,50</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Grid Section */}
        <section className="py-24 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Baixe ou Acesse Nossos Serviços</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Tudo o que você precisa no dia a dia com a vantagem de ganhar parte do seu dinheiro de volta em todas as transações.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Moby */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-accent/30 hover:bg-slate-800/60 transition-all group">
                <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                  <Car size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaMoby - Mobilidade</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Corridas mais justas para passageiros e motoristas. Tecnologia de ponta com segurança 24h.
                </p>
                <button className="w-full bg-accent hover:bg-emerald-500 text-midnight font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Download size={18} />
                  Baixar App
                </button>
              </div>

              {/* Card 2: Food */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-orange-500/30 hover:bg-slate-800/60 transition-all group">
                <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <UtensilsCrossed size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaFood - Delivery</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Peça comida rápida na sua região. Milhares de restaurantes com entrega grátis e cashback exclusivo.
                </p>
                <button className="w-full bg-accent hover:bg-emerald-500 text-midnight font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Download size={18} />
                  Baixar App
                </button>
              </div>

              {/* Card 3: Shop */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-primary-blue/30 hover:bg-slate-800/60 transition-all group">
                <div className="size-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaShop - Marketplace</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Compre e venda produtos com garantia total. O maior ecossistema de varejo local da sua cidade.
                </p>
                <button className="w-full bg-accent hover:bg-emerald-500 text-midnight font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <ExternalLink size={18} />
                  Acessar Loja Web
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-slate-500 py-16 px-6 lg:px-20 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 text-white mb-6">
                <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                  <LayoutGrid size={14} />
                </div>
                <span className="text-lg font-bold">Serviços Urbanos</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Transformando a vida nas cidades através de tecnologia e economia compartilhada.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-accent transition-colors"><Instagram size={20} /></a>
                <a href="#" className="hover:text-accent transition-colors"><Twitter size={20} /></a>
                <a href="#" className="hover:text-accent transition-colors"><Linkedin size={20} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Plataforma</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ecossistema</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Seja um parceiro</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Suporte</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ouvidoria</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="flex flex-col gap-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
            <p>© 2024 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <span>Brasil</span>
              <span className="flex items-center gap-1">
                <Globe size={12} />
                Português
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
