import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface FormErrorFallbackProps {
  error: Error;
  resetError: () => void;
  formName?: string;
}

const FormErrorFallback: React.FC<FormErrorFallbackProps> = ({ 
  error, 
  resetError, 
  formName = 'form' 
}) => {
  return (
    <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-red-200/50 bg-red-50/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-800">
            {formName} Error
          </h3>
          <p className="text-sm text-red-600">
            Unable to load this form
          </p>
        </div>
      </div>
      
      <p className="text-red-700 mb-4 text-sm leading-relaxed">
        There was an issue loading the {formName.toLowerCase()}. This might be a temporary problem.
      </p>
      
      <button
        onClick={resetError}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
      
      {import.meta.env.DEV && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-red-500 hover:text-red-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
};

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName?: string;
}

const FormErrorBoundary: React.FC<FormErrorBoundaryProps> = ({ children, formName }) => {
  return (
    <ErrorBoundary fallback={(props) => <FormErrorFallback {...props} formName={formName} />}>
      {children}
    </ErrorBoundary>
  );
};

export default FormErrorBoundary;