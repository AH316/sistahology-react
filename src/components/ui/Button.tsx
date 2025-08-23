import React from 'react';
import type { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-sistah-pink to-sistah-rose text-white hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-sistah-pink',
    secondary: 'bg-white text-sistah-pink border-2 border-sistah-pink hover:bg-sistah-pink hover:text-white focus:ring-sistah-pink',
    outline: 'bg-transparent text-sistah-pink border-2 border-sistah-pink hover:bg-sistah-pink hover:text-white focus:ring-sistah-pink',
    ghost: 'bg-transparent text-sistah-pink hover:bg-sistah-light focus:ring-sistah-pink'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed hover:transform-none' : '';

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
      )}
      {children}
    </button>
  );
};

export default React.memo(Button);