import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [waitlistForm, setWaitlistForm] = useState({ fullName: '', email: '', phone: '', businessName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistForm.fullName || !waitlistForm.email || !waitlistForm.phone) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('merchant_waitlist').insert({
        full_name: waitlistForm.fullName,
        email: waitlistForm.email,
        phone: waitlistForm.phone,
        business_name: waitlistForm.businessName
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao entrar na lista de espera. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setWaitlistForm({ fullName: '', email: '', phone: '', businessName: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-midnight/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-8">
              <button 
                onClick={handleClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full"
              >
                <X size={20} />
              </button>

              {success ? (
                <div className="text-center py-12">
                  <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-midnight mb-2 tracking-tighter uppercase italic">Tudo Certo!</h3>
                  <p className="text-slate-500 mb-8 font-medium">Você está na nossa lista VIP. Avisaremos via WhatsApp ou E-mail assim que as vagas para novos lojistas abrirem.</p>
                  <button 
                    onClick={handleClose}
                    className="bg-midnight text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-midnight/10"
                  >
                    Fechar Janela
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-midnight mb-2 tracking-tighter uppercase italic"><span className="text-primary-blue">Lista de Espera:</span> Venda aqui</h3>
                    <p className="text-slate-500 text-sm font-medium">Cadastre-se para ser um dos primeiros lojistas e vender para milhares de usuários ativos no nosso ecossistema.</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome Completo *</label>
                      <input 
                        type="text" 
                        required
                        value={waitlistForm.fullName}
                        onChange={e => setWaitlistForm({...waitlistForm, fullName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">E-mail *</label>
                        <input 
                          type="email" 
                          required
                          value={waitlistForm.email}
                          onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">WhatsApp *</label>
                        <input 
                          type="tel" 
                          required
                          value={waitlistForm.phone}
                          onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome da Loja/Negócio</label>
                      <input 
                        type="text" 
                        value={waitlistForm.businessName}
                        onChange={e => setWaitlistForm({...waitlistForm, businessName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-midnight focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
                        placeholder="Sua loja (opcional)"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-blue hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black transition-all text-xs uppercase tracking-widest shadow-xl shadow-primary-blue/20 mt-4 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Entrar na Lista VIP'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
