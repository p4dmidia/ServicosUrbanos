import React, { useState } from 'react';
import {
    LayoutGrid,
    Search,
    ShoppingCart,
    Bell,
    User,
    Tag,
    Truck,
    ShieldCheck,
    ArrowRight,
    TrendingUp,
    Package,
    CreditCard,
    ChevronRight,
    Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Marketplace() {
    const [search, setSearch] = useState('');

    const products = [
        {
            id: 1,
            name: "Fone de Ouvido Noise Cancelling Pro",
            price: "199,90",
            installments: "12x R$ 16,65 sem juros",
            image: "🎧", // Fictional placeholder since I don't have images here, will use stylized icons/divs
            rating: 4.8,
            sales: "1.2k vendidos"
        },
        {
            id: 2,
            name: "Smartwatch Urban Fit G2",
            price: "349,00",
            installments: "10x R$ 34,90 sem juros",
            image: "⌚",
            rating: 4.9,
            sales: "800 vendidos"
        },
        {
            id: 3,
            name: "Tênis Street Walker Original",
            price: "279,50",
            installments: "12x R$ 23,29 sem juros",
            image: "👟",
            rating: 4.7,
            sales: "2.5k vendidos"
        },
        {
            id: 4,
            name: "Mochila Tech Pro Impermeável",
            price: "159,00",
            installments: "6x R$ 26,50 sem juros",
            image: "🎒",
            rating: 4.6,
            sales: "500 vendidos"
        }
    ];

    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans flex flex-col">
            {/* Marketplace Custom Header */}
            <header className="bg-midnight py-4 px-6 lg:px-20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center gap-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-white shrink-0">
                        <div className="size-8 bg-primary-blue rounded flex items-center justify-center">
                            <LayoutGrid size={18} />
                        </div>
                        <span className="text-xl font-black tracking-tighter">UrbaShop</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar produtos, marcas e muito mais..."
                            className="w-full bg-white text-midnight py-2.5 pl-5 pr-12 rounded-lg focus:outline-none shadow-lg transition-all"
                        />
                        <button className="absolute right-0 top-0 bottom-0 px-4 text-slate-400 hover:text-primary-blue transition-colors border-l border-slate-100">
                            <Search size={20} />
                        </button>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-6 text-white/80 shrink-0">
                        <button className="hover:text-primary-blue transition-colors relative">
                            <Bell size={22} />
                            <span className="absolute -top-1 -right-1 size-2.5 bg-orange-500 rounded-full border-2 border-midnight"></span>
                        </button>
                        <button className="hover:text-primary-blue transition-colors">
                            <ShoppingCart size={22} />
                        </button>
                        <Link to="/login" className="flex items-center gap-2 hover:text-primary-blue transition-colors group">
                            <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
                                <User size={18} />
                            </div>
                            <span className="text-sm font-bold hidden md:inline">Meu Perfil</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-8">
                {/* Main Banner */}
                <section className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-gradient-to-r from-primary-blue to-midnight rounded-[2rem] p-10 lg:p-16 overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                            {/* Abstract Boxes Illustration placeholder */}
                            <div className="absolute top-10 right-10 size-40 bg-white/10 rounded-3xl rotate-12"></div>
                            <div className="absolute bottom-10 right-40 size-32 bg-white/5 rounded-3xl -rotate-12"></div>
                        </div>

                        <div className="max-w-lg relative z-10">
                            <span className="inline-block bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                                Exclusivo UrbaShop
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-6">
                                Compra Garantida UrbaShop.
                            </h2>
                            <p className="text-slate-300 text-lg mb-8">
                                Receba seu produto ou devolvemos seu dinheiro. Segurança total com cashback CAM em todas as compras.
                            </p>
                            <button className="bg-white text-midnight px-8 py-4 rounded-xl font-black hover:bg-slate-100 transition-all flex items-center gap-2">
                                Ver Promoções <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                </section>

                {/* Action Faixa Dupla */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-500/30 transition-all cursor-pointer">
                        <div>
                            <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Seleção Especial</p>
                            <h3 className="text-2xl font-black text-midnight mb-4">Ver Ofertas do Dia</h3>
                            <p className="text-slate-500 text-sm font-medium">Os melhores preços com cashback dobrado.</p>
                        </div>
                        <div className="size-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <Tag size={32} />
                        </div>
                    </div>

                    <div className="bg-midnight p-8 rounded-[2rem] shadow-xl flex items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary-blue/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white mb-2">Tem produtos? <span className="text-primary-blue">Venda no UrbaShop</span></h3>
                            <p className="text-slate-400 text-sm mb-6 font-medium">Alcance milhares de clientes no nosso ecossistema.</p>
                            <button className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-tighter">
                                Seja um Lojista Parceiro
                            </button>
                        </div>
                    </div>
                </section>

                {/* Recomendados */}
                <section className="mb-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-midnight uppercase tracking-tighter">Recomendados para você</h2>
                        <button className="text-primary-blue font-bold text-sm hover:underline flex items-center gap-1">
                            Ver tudo <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <motion.div
                                key={product.id}
                                whileHover={{ y: -8 }}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col group cursor-pointer"
                            >
                                <div className="aspect-square bg-slate-50 rounded-2xl mb-6 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                                    {product.image}
                                </div>

                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mb-3 inline-block">
                                        Gera Cashback CAM
                                    </span>
                                    <h4 className="text-slate-800 font-bold mb-2 line-clamp-2 min-h-[48px]">{product.name}</h4>
                                    <div className="flex items-center gap-1 mb-4">
                                        <Star className="text-yellow-400 fill-yellow-400" size={12} />
                                        <span className="text-[10px] font-bold text-slate-400">{product.rating} | {product.sales}</span>
                                    </div>
                                    <p className="text-2xl font-black text-midnight leading-none mb-1">R$ {product.price}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold">{product.installments}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Seção de Confiança */}
                <section className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-blue mb-6">
                                <CreditCard size={32} />
                            </div>
                            <h5 className="font-black text-midnight mb-2">Pagamento via PIX ou Cartão</h5>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Pague como quiser, com aprovação instantânea e segurança.</p>
                        </div>

                        <div className="flex flex-col items-center text-center border-x border-slate-100 px-6">
                            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                                <Truck size={32} />
                            </div>
                            <h5 className="font-black text-midnight mb-2">Entrega Rápida por UrbaFood</h5>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Nossa própria malha logística garante que chegue hoje ou amanhã.</p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h5 className="font-black text-midnight mb-2">Segurança em transações</h5>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Todos os seus dados protegidos com criptografia de ponta a ponta.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Simplified Marketplace Footer */}
            <footer className="bg-midnight py-12 px-6 lg:px-20 text-slate-500 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 text-white">
                        <div className="size-6 bg-primary-blue rounded flex items-center justify-center">
                            <LayoutGrid size={14} />
                        </div>
                        <span className="text-lg font-bold">UrbaShop</span>
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest">© 2024 Ecossistema Serviços Urbanos</p>
                    <div className="flex gap-4">
                        <div className="size-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                            <Package size={18} />
                        </div>
                        <div className="size-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
