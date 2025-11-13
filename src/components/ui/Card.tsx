import React from 'react';
import type { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg transition-all duration-300';
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`.trim();

  return (
    <div className={combinedClasses} {...props}>
      {(title || subtitle) && (
        <div className="p-6 border-b border-pink-100">
          {title && (
            <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
          )}
          {subtitle && (
            <p className="text-gray-800 text-sm">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = React.memo(({ 
  children, 
  className = '' 
}) => (
  <div className={`p-6 border-b border-pink-100 ${className}`}>
    {children}
  </div>
));

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = React.memo(({ 
  children, 
  className = '' 
}) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
));

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = React.memo(({ 
  children, 
  className = '' 
}) => (
  <div className={`p-6 border-t border-pink-100 ${className}`}>
    {children}
  </div>
));

export default React.memo(Card);