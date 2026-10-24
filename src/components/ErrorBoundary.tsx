import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-midnight text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                Ocorreu um imprevisto
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Não foi possível carregar esta tela no momento. Clique abaixo para tentar novamente ou voltar à página inicial.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left overflow-x-auto">
                <p className="text-[10px] font-mono text-rose-400 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary-blue/20 cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} /> Recarregar
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Home size={14} /> Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
