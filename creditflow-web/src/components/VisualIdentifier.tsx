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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  // Diferentes colores según el variant
  const variantClasses = {
    user: 'bg-blue-500 text-white',
    client: 'bg-purple-500 text-white',
    route: 'bg-green-500 text-white',
    role: 'bg-orange-500 text-white'
  };
  
  const bgClass = variantClasses[variant];
  
  // Si hay nombre, mostrar la inicial, sino mostrar icono
  const showInitial = name && name.trim().length > 0;
  const initial = showInitial ? name.trim().charAt(0).toUpperCase() : null;
  
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
        font-semibold
        ${className}
      `}
    >
      {showInitial ? (
        <span>{initial}</span>
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );
};

export default VisualIdentifier;
