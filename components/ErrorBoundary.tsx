import React from 'react';
import { getUserMessage, ErrorType, getErrorType } from '../lib/errorMessages';

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, errorInfo: any, reset: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details in development
    if ((import.meta as any).env?.DEV) {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    } else {
      // In production, log to monitoring service (e.g., Sentry)
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: any) {
    // TODO: Implement error logging service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
    
    // For now, just log to console in production too
    console.error('Production Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.resetError);
      }

      // Default error UI
      const errorType = getErrorType(error);
      const userMessage = getUserMessage(error);
      
      return (
        <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#23272f] rounded-lg shadow-xl p-8 border border-gray-700">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-4">
              Algo deu errado
            </h1>

            {/* User-friendly message */}
            <p className="text-gray-300 text-center mb-6">
              {userMessage}
            </p>

            {/* Error type badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                Tipo: {errorType}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.resetError}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Recarregar Página
              </button>
            </div>

            {/* Technical details (only in dev mode) */}
            {(import.meta as any).env?.DEV && error && (
              <details className="mt-8 p-4 bg-[#1a1d23] rounded-lg border border-gray-700">
                <summary className="cursor-pointer text-gray-400 hover:text-white font-medium mb-2">
                  Detalhes Técnicos (Dev Only)
                </summary>
                <div className="mt-4 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Error Message:</p>
                    <p className="text-sm text-red-400 font-mono break-all">
                      {error.message}
                    </p>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <p className="text-sm font-medium text-gray-400 mt-3">Stack Trace:</p>
                      <pre className="text-xs text-gray-500 overflow-auto max-h-48 mt-1 p-2 bg-black/30 rounded">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-sm font-medium text-gray-400 mt-3">Component Stack:</p>
                      <pre className="text-xs text-gray-500 overflow-auto max-h-48 mt-1 p-2 bg-black/30 rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
