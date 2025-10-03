import React from 'react';
import Icon from './Icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  fullWidth?: boolean;
}

const buttonVariants = {
  primary: `
    bg-primary text-white border border-transparent
    hover:bg-primary/90 focus:ring-primary
    disabled:bg-primary/50
  `,
  secondary: `
    bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600
    hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500
    disabled:bg-gray-50 dark:disabled:bg-gray-800
  `,
  outline: `
    bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600
    hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500
    disabled:bg-transparent disabled:border-gray-200 dark:disabled:border-gray-700
  `,
  ghost: `
    bg-transparent text-gray-700 dark:text-gray-300 border border-transparent
    hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500
    disabled:bg-transparent
  `,
};

const buttonSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    ${fullWidth ? 'w-full' : ''}
    ${buttonSizes[size]}
    ${buttonVariants[variant]}
  `;

  return (
    <button
      className={`${baseClasses} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {/* Left Icon */}
      {leftIcon && !loading && (
        <Icon name={leftIcon} size="sm" className="mr-2" />
      )}
      
      {/* Button Content */}
      <span>{children}</span>
      
      {/* Right Icon */}
      {rightIcon && !loading && (
        <Icon name={rightIcon} size="sm" className="ml-2" />
      )}
    </button>
  );
};

export default Button;