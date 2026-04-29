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
  Instagram,
  Smartphone,
  Calendar,
  ChevronRight,
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
import Header from '../components/Header';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  main_image?: string;
  cashback: number;
  rating?: number;
  reviews_count?: number;
  sales?: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mmnConfig, setMmnConfig] = useState<any>(null);
  const [g1Value, setG1Value] = useState<number>(3.0); // Default 3% share

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch MMN Config
        const configData = await businessRules.getMMNConfig();
        if (configData) setMmnConfig(configData);

        // Fetch MMN Levels for G1
        const levels = await businessRules.getMMNLevels();
        const g1 = levels.find(l => Number(l.level) === 1);
        if (g1) setG1Value(Number(g1.value));

        console.log('Fetching products from Supabase...');
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image, main_image, cashback, status, sales, product_reviews(rating)')
          .or('status.ilike.Ativo,status.ilike.ativo')
          .limit(4);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Products found:', data?.length || 0);
        
        if (data) {
          setProducts(data.map(p => ({
            ...p,
            price: Number(p.price) || 0,
            cashback: Number(p.cashback) || 5,
            rating: p.product_reviews?.length > 0 
              ? p.product_reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / p.product_reviews.length 
              : 5.0,
            reviews_count: p.product_reviews?.length || 0,
            sales: Number(p.sales) || 0
          })));
        }
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <PWAInstallPrompt />

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
                <div className="flex flex-wrap gap-4">
                  <Link to="/loja" className="bg-accent hover:bg-emerald-500 text-midnight px-10 py-4 rounded-xl text-lg font-bold transition-transform active:scale-95 shadow-xl shadow-accent/30 flex items-center gap-2">
                    Explorar Ofertas <ExternalLink size={20} />
                  </Link>
                  <Link to="/ecossistema" className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all border border-white/10">
                    Saber Mais
                  </Link>
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
                {/* Floating Cashback Cards - Hidden on small mobile for better layout */}
                <div className="absolute top-0 -left-12 hidden sm:flex flex-col gap-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl w-48"
                  >
                    <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cashback Mensal</p>
                      <p className="text-sm font-bold text-white">R$ 450,00</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl w-48 ml-8"
                  >
                    <div className="size-10 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cashback Anual</p>
                      <p className="text-sm font-bold text-white">R$ 2.800,00</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl w-48"
                  >
                    <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cashback Digital</p>
                      <p className="text-sm font-bold text-white">R$ 120,50</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Products Section (Marketplace Preview) */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-black text-midnight mb-2 tracking-tighter uppercase italic border-l-8 border-primary-blue pl-6">
                  Ofertas em <span className="text-primary-blue">Destaque</span>
                </h2>
                <p className="text-slate-500 max-w-lg font-medium">Os produtos mais desejados com o maior cashback da sua região.</p>
              </div>
              <Link to="/loja" className="bg-slate-50 hover:bg-slate-100 text-primary-blue px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all group">
                Ver tudo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? (
                // Skeleton Loading
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-pulse">
                    <div className="size-16 bg-slate-200 rounded-2xl mb-6"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <Link 
                    to={`/produto/${product.id}`}
                    key={product.id} 
                    className="bg-[#f8fafc] p-8 rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="size-20 bg-white rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                      {(product.main_image || product.image) ? (
                        <img 
                          src={product.main_image || product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <h3 className="text-sm font-black text-midnight mb-1 group-hover:text-primary-blue transition-colors uppercase tracking-tight line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mt-1 mb-2">
                      <Star className="text-yellow-400 fill-yellow-400" size={10} />
                      <span className="text-[10px] font-black text-midnight">{product.rating?.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">({product.reviews_count || 0})</span>
                      <span className="text-slate-300 mx-1">|</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sales} vendidos</span>
                    </div>

                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div>
                        <p className="text-xl font-black text-midnight tracking-tighter">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {(() => {
                            const pMensal = Number(mmnConfig?.cashbackMensal || 2.75);
                            const pDigital = Number(mmnConfig?.cashbackDigital || 1.0);
                            const pAnual = Number(mmnConfig?.cashbackAnual || 0.75);
                            const totalRatios = pMensal + pDigital + pAnual || 4.5;
                            
                            // Ganho do usuário (G1) direto sobre o valor do produto
                            const userShare = product.price * (g1Value / 100);
                            
                            const mensal = userShare * (pMensal / totalRatios);
                            const digital = userShare * (pDigital / totalRatios);
                            const anual = userShare * (pAnual / totalRatios);
                            
                            return (
                              <>
                                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                  <TrendingUp size={8} /> Mensal: R$ {mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                  <Smartphone size={8} /> Digital: R$ {digital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                                  <Calendar size={8} /> Anual: R$ {anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-slate-400 font-medium">
                  Nenhum produto em destaque no momento.
                </div>
              )}
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
              {/* Card 1: Shop */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-primary-blue/30 hover:bg-slate-800/60 transition-all group">
                <div className="size-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaShop - Marketplace</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Compre e venda produtos com garantia total. O maior ecossistema de varejo local da sua cidade.
                </p>
                <a
                  href="/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-accent hover:bg-emerald-500 text-midnight font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  Visitar Loja UrbaShop
                </a>
              </div>

              {/* Card 2: Moby */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-accent/30 hover:bg-slate-800/60 transition-all group opacity-75">
                <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                  <Car size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaMoby - Mobilidade</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Corridas mais justas para passageiros e motoristas. Tecnologia de ponta com segurança 24h.
                </p>
                <button disabled className="w-full bg-slate-700 text-slate-400 font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-not-allowed uppercase tracking-widest text-[10px]">
                  EM BREVE!
                </button>
              </div>

              {/* Card 3: Food */}
              <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 hover:border-orange-500/30 hover:bg-slate-800/60 transition-all group opacity-75">
                <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <UtensilsCrossed size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">UrbaFood - Delivery</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                  Peça comida rápida na sua região. Milhares de restaurantes com entrega grátis e cashback exclusivo.
                </p>
                <button disabled className="w-full bg-slate-700 text-slate-400 font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-not-allowed uppercase tracking-widest text-[10px]">
                  EM BREVE!
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
                <li><Link to="/ecossistema" className="hover:text-white transition-colors">Ecossistema</Link></li>
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Seja um parceiro</Link></li>
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
            <div className="flex flex-col items-center md:items-start gap-1">
              <p>© 2026 Serviços Urbanos Tecnologia S.A. Todos os direitos reservados.</p>
              <p className="opacity-50 lowercase font-medium">Desenvolvido por <a href="https://p4dmidia.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">P4D Mídia</a></p>
            </div>
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
