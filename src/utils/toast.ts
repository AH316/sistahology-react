// Simple toast utility for use outside React components
// For component usage, use the useToast hook from components/ui/Toast.tsx

let toastCallback: ((message: string, type: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

export const registerToastCallback = (callback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) => {
  toastCallback = callback;
};

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    // Fallback to console if no callback registered
    console.log(`[${type.toUpperCase()}]`, message);
  }
};
