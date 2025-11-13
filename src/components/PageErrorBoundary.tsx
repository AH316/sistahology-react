import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageErrorFallbackProps {
  error: Error;
  resetError: () => void;
  pageName?: string;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ 
  error, 
  resetError, 
  pageName = 'page' 
}) => {
  return (
    <div className="min-h-screen bg-gerbera-hero flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30 text-center max-w-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
          {pageName} Error
        </h2>
        
        <p className="text-white/90 mb-6 leading-relaxed drop-shadow">
          Something went wrong while loading this {pageName.toLowerCase()}. 
          Your data is safe, and this is likely a temporary issue.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            to="/"
            className="w-full px-4 py-3 text-white border border-white/50 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
        
        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-white/90 hover:text-white">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-200 bg-red-900/30 p-3 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children, pageName }) => {
  return (
    <ErrorBoundary fallback={(props) => <PageErrorFallback {...props} pageName={pageName} />}>
      {children}
    </ErrorBoundary>
  );
};

// Import the base ErrorBoundary
import ErrorBoundary from './ErrorBoundary';

export default PageErrorBoundary;