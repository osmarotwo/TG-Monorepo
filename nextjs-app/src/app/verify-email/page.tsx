'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useLocale } from '@/contexts/LocaleContext';

// Usando símbolos simples en lugar de heroicons para evitar dependencias adicionales

// Variable global para trackear tokens ya procesados (persiste entre renders en StrictMode)
const processedTokens = new Set<string>();

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const { verifyEmail: verifyEmailAuth, clearError } = useAuth();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('tokenNotFound', 'verification'));
      return;
    }

    // Si este token ya fue procesado, no hacer nada
    if (processedTokens.has(token)) {
      console.log('⚠️ Token ya procesado anteriormente, saltando verificación duplicada...');
      return;
    }

    // Marcar token como procesado ANTES de la llamada async
    processedTokens.add(token);
    console.log('📝 Token marcado como procesado:', token);

    let isMounted = true; // Flag para prevenir actualizaciones después de desmontar

    const verifyEmail = async () => {
      try {
        console.log('🔍 Iniciando verificación de email con token:', token);
        await verifyEmailAuth(token);
        console.log('✅ Verificación completada exitosamente');
        
        // Si llegamos aquí, la verificación fue exitosa
        console.log('✅ Procesando éxito...');
        if (isMounted) {
          setStatus('success');
          setMessage(t('emailVerificationSuccess', 'verification'));
        }
        
        console.log('✅ Verificación exitosa, redirigiendo en 3 segundos...');
        // Redirigir al login después de 3 segundos solo si fue exitoso
        setTimeout(() => {
          if (isMounted) {
            console.log('⏰ Timeout completado, limpiando errores y redirigiendo...');
            // Limpiar cualquier error del AuthContext antes de redirigir
            clearError();
            router.push('/auth/login?verified=true');
          }
        }, 3000);
      } catch (error) {
        console.error('🚨 Excepción capturada en catch:', error);
        console.error('🚨 Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('🚨 Mensaje de error:', error instanceof Error ? error.message : String(error));
        if (isMounted) {
          setStatus('error');
          setMessage(t('connectionError', 'auth'));
        }
        // NO redirigir cuando hay error
      }
    };

    verifyEmail();

    // Cleanup: marcar como desmontado
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Solo depende del token, evita re-ejecuciones por cambios en router o t

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <svg className="w-16 h-16 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return t('verifyingEmail', 'verification');
      case 'success':
        return t('emailVerified', 'verification');
      case 'error':
        return t('verificationFailed', 'verification');
    }
  };

  const getSubtitle = () => {
    switch (status) {
      case 'loading':
        return t('pleaseWait', 'verification');
      case 'success':
        return t('emailVerifiedDescription', 'verification');
      case 'error':
        return t('verificationFailedDescription', 'verification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getTitle()}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-6">
            {getSubtitle()}
          </p>

          {/* Message */}
          <div className={`p-4 rounded-lg mb-6 ${
            status === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : status === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              status === 'success' 
                ? 'text-green-800' 
                : status === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {status === 'success' && (
              <button
                onClick={() => router.push('/auth/login?verified=true')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('goToLogin', 'verification')}
              </button>
            )}
            
            {status === 'error' && (
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('goToLogin', 'verification')}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  {t('tryAgain', 'verification')}
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-gray-100 text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('backToRegister', 'verification')}
                </button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-sm text-gray-500">
                {t('takingSeconds', 'verification')}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {t('verificationProblems', 'verification')}{' '}
            <button 
              onClick={() => router.push('/auth/help')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('contactSupport', 'verification')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}