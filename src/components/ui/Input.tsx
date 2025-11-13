import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sistah-pink';
  
  const variantClasses = {
    default: 'border border-gray-200 bg-white/70 backdrop-blur-sm focus:border-transparent',
    outline: 'border-2 border-sistah-pink bg-transparent focus:border-sistah-rose',
    filled: 'border-0 bg-sistah-light focus:bg-white'
  };

  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
  const iconPadding = icon ? 'pl-10' : '';
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${iconPadding} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-600">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          className={combinedClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-700">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;