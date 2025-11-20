import * as Icons from 'lucide-react';
import React from 'react';

/**
 * Dynamically render a Lucide icon by name
 * Falls back to Heart icon if not found
 */
export const renderIcon = (
  iconName: string,
  className?: string
): React.ReactElement => {
  const IconComponent = (Icons as any)[iconName] || Icons.Heart;
  return <IconComponent className={className} />;
};

/**
 * Render icon with fill (for filled hearts, etc.)
 */
export const renderIconFilled = (
  iconName: string,
  className?: string
): React.ReactElement => {
  const IconComponent = (Icons as any)[iconName] || Icons.Heart;
  return <IconComponent className={className} fill="currentColor" />;
};
