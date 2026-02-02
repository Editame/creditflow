'use client';

import React from 'react';
import { User } from 'lucide-react';

interface VisualIdentifierProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'user' | 'client' | 'route' | 'role';
}

const VisualIdentifier: React.FC<VisualIdentifierProps> = ({
  name,
  size = 'md',
  className = '',
  variant = 'user'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const bgClass = 'bg-purple-500 text-white';
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${bgClass}
        rounded-full 
        flex 
        items-center 
        justify-center 
        shadow-sm
        transition-all
        duration-200
        hover:shadow-md
        ${className}
      `}
    >
      <User className={iconSizes[size]} />
    </div>
  );
};

export default VisualIdentifier;
