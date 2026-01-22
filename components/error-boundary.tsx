'use client';

import { Component, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar erros de renderização
 * Previne que crashes quebrem toda a aplicação
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Custom callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const Sentry = require('@sentry/nextjs');
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      } catch (e) {
        // Sentry not available, silent fail
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-[32px]">
                  error
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Algo deu errado
            </h2>

            {/* Description */}
            <p className="text-slate-600 mb-6">
              Desculpe, encontramos um erro inesperado. Nossa equipe foi notificada e
              estamos trabalhando para resolver o problema.
            </p>

            {/* Error details (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Recarregar página
              </button>
            </div>

            {/* Support link */}
            <p className="mt-6 text-sm text-slate-500">
              Precisa de ajuda?{' '}
              <a
                href="/support"
                className="text-primary font-semibold hover:underline"
              >
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary de forma programática
 */
export function useErrorHandler() {
  const handleError = (error: Error) => {
    // Força o Error Boundary a capturar o erro
    throw error;
  };

  return { handleError };
}
