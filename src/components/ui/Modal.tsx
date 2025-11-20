import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore - focus-trap-react doesn't have proper TypeScript types
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import type { ModalProps } from '../../types';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const modalContent = (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: true,
        allowOutsideClick: true
      }}
    >
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`relative w-full ${sizeClasses[size]} glass rounded-3xl border border-white/30 backdrop-blur-lg shadow-2xl transform transition-all ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-800">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-800" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;