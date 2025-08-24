import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastProps {
  message: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-remove toast
    const timer = setTimeout(() => {
      handleRemove();
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message.duration]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(message.id), 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div
      className={`
        flex items-center p-4 mb-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 transform
        ${colors[message.type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`flex-shrink-0 ${iconColors[message.type]}`}>
        {icons[message.type]}
      </div>
      
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message.message}</p>
      </div>
      
      <button
        onClick={handleRemove}
        className="flex-shrink-0 ml-4 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const toastContainer = (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full" data-testid="toast-root">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );

  return createPortal(toastContainer, document.body);
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...message, id };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => {
    addToast({ message, type: 'success', duration });
  };

  const showError = (message: string, duration?: number) => {
    addToast({ message, type: 'error', duration });
  };

  const showWarning = (message: string, duration?: number) => {
    addToast({ message, type: 'warning', duration });
  };

  const showInfo = (message: string, duration?: number) => {
    addToast({ message, type: 'info', duration });
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast;