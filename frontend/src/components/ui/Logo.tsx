import React from 'react';
import { useBrandConfig } from '../../utils/brandConfig';
import Icon from './Icon';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const logoSizes = {
  sm: {
    container: 'h-8 w-8',
    icon: 'sm',
    text: 'text-lg',
  },
  md: {
    container: 'h-12 w-12',
    icon: 'lg',
    text: 'text-xl',
  },
  lg: {
    container: 'h-16 w-16',
    icon: 'xl',
    text: 'text-2xl',
  },
  xl: {
    container: 'h-20 w-20',
    icon: 'xl',
    text: 'text-3xl',
  },
} as const;

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false 
}) => {
  const { branding, platform } = useBrandConfig();
  const sizeConfig = logoSizes[size];

  const renderLogo = () => {
    switch (branding.logoType) {
      case 'icon':
        return (
          <div className={`${sizeConfig.container} bg-primary rounded-full flex items-center justify-center ${className}`}>
            <Icon 
              name={branding.logoConfig.icon || 'user'} 
              size={sizeConfig.icon as any}
              className="text-white"
            />
          </div>
        );
      
      case 'image':
        return (
          <div className={`${sizeConfig.container} ${className}`}>
            <img 
              src={branding.logoConfig.image} 
              alt={`${platform.name} logo`}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        );
      
      case 'text':
        return (
          <div className={`${sizeConfig.container} bg-primary rounded-full flex items-center justify-center ${className}`}>
            <span className={`${sizeConfig.text} font-bold text-white`}>
              {branding.logoConfig.text || platform.name.charAt(0)}
            </span>
          </div>
        );
      
      default:
        return (
          <div className={`${sizeConfig.container} bg-primary rounded-full flex items-center justify-center ${className}`}>
            <Icon 
              name="user" 
              size={sizeConfig.icon as any}
              className="text-white"
            />
          </div>
        );
    }
  };

  if (showText) {
    return (
      <div className="flex items-center space-x-3">
        {renderLogo()}
        <span className={`font-bold text-gray-900 dark:text-white ${sizeConfig.text}`}>
          {platform.name}
        </span>
      </div>
    );
  }

  return renderLogo();
};

export default Logo;