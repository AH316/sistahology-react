import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface InlineErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ 
  error, 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`bg-red-50/90 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-700 text-sm leading-relaxed">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(InlineError);