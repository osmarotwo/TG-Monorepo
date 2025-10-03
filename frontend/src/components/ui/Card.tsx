import React from 'react';
import { useBrandConfig } from '../../utils/brandConfig';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  glassmorphism?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glassmorphism,
  padding = 'lg',
}) => {
  const { theme } = useBrandConfig();
  
  // Usar glassmorphism de la configuración si no se especifica
  const useGlassmorphism = glassmorphism !== undefined ? glassmorphism : theme.glassmorphism;

  const baseClasses = `
    rounded-xl shadow-2xl backdrop-blur-sm
    ${paddingClasses[padding]}
    ${useGlassmorphism 
      ? 'bg-card-light dark:bg-card-dark' 
      : 'bg-white dark:bg-gray-800'
    }
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;