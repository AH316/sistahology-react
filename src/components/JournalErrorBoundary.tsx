import React from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface JournalErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

const JournalErrorFallback: React.FC<JournalErrorFallbackProps> = ({ 
  error, 
  resetError, 
  context = 'journal feature' 
}) => {
  return (
    <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-orange-200/50 bg-orange-50/20">
      <div className="text-center">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-orange-600" />
        </div>
        
        <h3 className="font-semibold text-orange-800 mb-2">
          Journal Loading Error
        </h3>
        
        <p className="text-orange-700 mb-4 text-sm leading-relaxed">
          We couldn't load your {context}. This might be a temporary connection issue.
        </p>
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
        
        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-orange-500 hover:text-orange-700 text-center">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-orange-600 bg-orange-100 p-2 rounded overflow-auto max-h-24">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface JournalErrorBoundaryProps {
  children: React.ReactNode;
  context?: string;
}

const JournalErrorBoundary: React.FC<JournalErrorBoundaryProps> = ({ children, context }) => {
  return (
    <ErrorBoundary fallback={(props) => <JournalErrorFallback {...props} context={context} />}>
      {children}
    </ErrorBoundary>
  );
};

export default JournalErrorBoundary;