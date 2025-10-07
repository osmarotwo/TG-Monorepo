import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';
import type { GoogleButtonConfig } from '../vite-env';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  className?: string;
}

// Variable global para evitar múltiples renderizaciones
let isGoogleButtonRendered = false;

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  theme = 'outline',
  size = 'large', 
  text = 'signup_with',
  className = '',
}) => {
  const { signInWithGoogle, loading } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [useCustomButton, setUseCustomButton] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Reset del flag cuando el componente se monta
    return () => {
      isGoogleButtonRendered = false;
    };
  }, []);

  useEffect(() => {
    // Verificar si Google está cargado
    if (window.google && !useCustomButton) {
      // Pequeño delay para asegurar que Google esté completamente inicializado
      const timer = setTimeout(() => {
        const initializeGoogleButton = () => {
          if (window.google && googleButtonRef.current && !disabled && !isGoogleButtonRendered && !isInitializing) {
            setIsInitializing(true);
            
            try {
              const config: GoogleButtonConfig = {
                theme,
                size,
                text,
                shape: 'rectangular',
                logo_alignment: 'left',
                width: '100%',
              };

              // Limpiar el contenedor antes de renderizar
              googleButtonRef.current.innerHTML = '';
              window.google.accounts.id.renderButton(googleButtonRef.current, config);
              
              isGoogleButtonRendered = true;
              setIsGoogleLoaded(true);
              setUseCustomButton(false);
            } catch (error) {
              console.error('Error rendering Google button:', error);
              setUseCustomButton(true);
              if (onError) {
                onError('Error al cargar el botón de Google');
              }
            } finally {
              setIsInitializing(false);
            }
          }
        };
        
        initializeGoogleButton();
      }, 300);

      return () => clearTimeout(timer);
    } else if (!window.google) {
      // Esperar a que se cargue
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          // Reintentar inicialización
          window.location.reload();
        }
      }, 500);

      // Fallback después de 5 segundos
      const fallbackTimer = setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google) {
          console.warn('Google Identity Services not loaded, using custom button');
          setUseCustomButton(true);
        }
      }, 5000);

      return () => {
        clearInterval(checkGoogle);
        clearTimeout(fallbackTimer);
      };
    }
  }, [disabled, theme, size, text, onError, useCustomButton, isInitializing]);

  const handleCustomGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Custom Google sign-in error:', error);
      if (onError) {
        onError('Error en el registro con Google');
      }
    }
  };

  // Si Google no está disponible o hay errores, usar botón personalizado
  if (useCustomButton || !isGoogleLoaded) {
    return (
      <Button
        variant="outline"
        fullWidth
        leftIcon="google"
        onClick={handleCustomGoogleSignIn}
        disabled={disabled || loading}
        loading={loading}
        className={className}
        type="button"
      >
        {loading ? 'Conectando...' : 'Continuar con Google'}
      </Button>
    );
  }

  // Botón oficial de Google
  return (
    <div className={`w-full ${className}`}>
      <div
        ref={googleButtonRef}
        className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ minHeight: '44px' }}
      />
      {(loading || isInitializing) && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* Opción de fallback */}
      <div className="mt-2 text-center">
        <button
          onClick={() => setUseCustomButton(true)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          type="button"
        >
          ¿Problemas? Usar método alternativo
        </button>
      </div>
    </div>
  );
};

export default GoogleSignInButton;