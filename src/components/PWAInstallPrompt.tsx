import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the prompt only on mobile/tablet (or if you want to show it everywhere)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-10 md:bottom-10 md:w-96"
      >
        <div className="bg-midnight/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          {/* Decorative background glow */}
          <div className="absolute -top-10 -right-10 size-32 bg-primary-blue rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <div className="size-14 bg-primary-blue rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-blue/20">
              <Download className="text-white" size={28} />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="text-white font-black text-lg leading-tight mb-1">Instalar App</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Acesse o <span className="text-white font-bold">Serv Urbanos</span> direto da sua tela inicial para uma experiência mais rápida.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-midnight font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-accent transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Instalar Agora
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-6 bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
