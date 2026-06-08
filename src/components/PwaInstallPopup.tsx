import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share, PlusSquare, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';

export default function PwaInstallPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    return localStorage.getItem('pwa-admin-installed') === 'true';
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('utm_source=pwa_admin')) {
      localStorage.setItem('pwa-admin-installed', 'true');
      setIsInstalled(true);
    }
  }, []);
  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', '/manifest-admin.json');
    }
    return () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.setAttribute('href', '/manifest.json');
      }
    };
  }, []);

  useEffect(() => {
    // Detect environment
    const userAgent = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(userAgent);
    setIsIOS(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Check if dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem('pwa-admin-install-dismissed');
    const isDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000);

    const mobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
    setIsMobileOrTablet(mobileOrTablet);

    // Initial check for deferredPrompt
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // Set listener for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPopup(false);
      localStorage.setItem('pwa-admin-installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show popup if mobile/tablet, not in standalone mode, not recently dismissed, and not installed
    const shouldShow = mobileOrTablet && !standalone && !isDismissed && !isInstalled;
    
    // For iOS, show it after a small timeout
    if (shouldShow && ios) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    // For Android, only show if deferredPrompt is already available
    if (shouldShow && !ios && ((window as any).deferredPrompt || deferredPrompt)) {
      setShowPopup(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  // Handle beforeinstallprompt update (show Android banner immediately when the event fires)
  useEffect(() => {
    if (deferredPrompt && !isStandalone && isMobileOrTablet && !isIOS) {
      const dismissedTime = localStorage.getItem('pwa-admin-install-dismissed');
      const isDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000);
      if (!isDismissed) {
        setShowPopup(true);
      }
    }
  }, [deferredPrompt, isStandalone, isMobileOrTablet, isIOS]);

  const handleInstallClick = async () => {
    const promptToUse = deferredPrompt || (window as any).deferredPrompt;

    if (promptToUse) {
      try {
        promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
          setShowPopup(false);
        }
      } catch (err) {
        console.error('Error running install prompt:', err);
      }
    }
  };

  const handleDismiss = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('pwa-admin-install-dismissed', Date.now().toString());
    }
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-96 bg-[#0a0e17]/95 border border-white/10 rounded-[1.5rem] overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] z-50 p-5 backdrop-blur-md"
        >
          {/* Top border accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

          {/* Close button */}
          <button
            onClick={() => handleDismiss(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>

          {/* Header Row */}
          <div className="flex items-center gap-3 pr-6">
            <div className="size-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Smartphone size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Serviços Urbanos Admin
              </h3>
              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                Instale o App na tela inicial
              </p>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-[11px] text-slate-400 leading-normal font-medium mt-3">
            Acesse o painel direto da sua tela inicial de forma rápida, segura e offline.
          </p>

          {/* Content area: iOS Instructions (if expanded) */}
          {isIOS && showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 bg-white/5 border border-white/5 rounded-xl p-3 space-y-2.5 overflow-hidden"
            >
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                Como instalar no Safari:
              </p>
              <ol className="space-y-2 text-[10px] text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center size-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 shrink-0">1</span>
                  <span>
                    Toque em Compartilhar <Share size={10} className="inline text-indigo-400 mx-0.5 align-middle" /> na barra inferior.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center size-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 shrink-0">2</span>
                  <span>
                    Selecione Adicionar à Tela de Início <PlusSquare size={10} className="inline text-indigo-400 mx-0.5 align-middle" />.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center size-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 shrink-0">3</span>
                  <span>
                    Toque em Adicionar no canto superior direito.
                  </span>
                </li>
              </ol>
            </motion.div>
          )}

          {/* Action Row */}
          <div className="flex flex-col gap-2 mt-4">
            {isIOS ? (
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-indigo-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                {showInstructions ? (
                  <>
                    Esconder Instruções
                    <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    Como Baixar o App
                    <ChevronDown size={12} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-indigo-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Download size={12} className="shrink-0" />
                Baixar Aplicativo
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all"
              >
                Depois
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="flex-1 bg-transparent hover:text-red-400 border border-transparent text-slate-500 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all"
              >
                Não perguntar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
