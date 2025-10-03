import React, { forwardRef, useState } from 'react';
import Icon from './Icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  showLabel = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  const baseClasses = `
    w-full rounded-lg border border-gray-300 dark:border-gray-700 
    bg-background-light dark:bg-background-dark 
    text-gray-900 dark:text-white 
    placeholder-gray-500 dark:placeholder-gray-400
    focus:ring-2 focus:ring-primary focus:border-primary
    transition-colors duration-200
    ${leftIcon ? 'pl-12' : 'pl-4'}
    ${rightIcon || isPassword ? 'pr-12' : 'pr-4'}
    py-3
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
  `;

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      {showLabel && label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Icon name={leftIcon} size="sm" className="text-gray-400" />
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          className={`${baseClasses} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${props.id}-error` : 
            helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        />
        
        {/* Right Icon or Password Toggle */}
        {(rightIcon || isPassword) && (
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            onClick={isPassword ? handlePasswordToggle : onRightIconClick}
            tabIndex={-1}
          >
            {isPassword ? (
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size="sm" />
            ) : (
              <Icon name={rightIcon!} size="sm" />
            )}
          </button>
        )}
      </div>
      
      {/* Helper Text or Error */}
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;