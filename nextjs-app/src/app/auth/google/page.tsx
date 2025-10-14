'use client'

import { useEffect, useState, useRef } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function GoogleCallback() {
  const { t } = useLocale();
  const { authenticateWithGoogle, user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false); // Prevenir ejecución múltiple

  useEffect(() => {
    const handleGoogleAuth = async () => {
      // Prevenir ejecución múltiple (React Strict Mode ejecuta efectos dos veces)
      if (hasProcessed.current) {
        console.log('⏭️ Ya procesado, saltando...');
        return;
      }
      hasProcessed.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      if (error) {
        alert(`${t('authorizationError', 'callback')} ${error}`);
        router.replace('/');
        return;
      }

      if (code && state === 'google_auth') {
        try {
          // Llama a tu backend para intercambiar el código por el idToken de Google
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          const data = await response.json();
          if (!response.ok || !data.idToken) {
            throw new Error(data.error || 'No se pudo obtener el idToken de Google');
          }
          // Autentica globalmente usando el contexto
          await authenticateWithGoogle({ idToken: data.idToken });
          
          // La redirección se hará en el siguiente useEffect cuando el user se actualice
          
        } catch (err) {
          alert(t('authorizationError', 'callback'));
          router.replace('/');
        }
      } else {
        alert(t('error', 'callback'));
        router.replace('/');
      }
    };
    handleGoogleAuth();
  }, [t, authenticateWithGoogle, router]);

  // Segundo useEffect para redirigir cuando el user se actualice después de la autenticación
  useEffect(() => {
    if (user && isProcessing) {
      console.log('🔄 Usuario autenticado, redirigiendo...', user);
      setIsProcessing(false);
      
      // Si el perfil no está completo, redirigir a onboarding
      if (!user.profileCompleted) {
        console.log('➡️ Redirigiendo a onboarding');
        router.replace('/onboarding');
      } else {
        console.log('➡️ Redirigiendo a dashboard');
        router.replace('/dashboard');
      }
    }
  }, [user, isProcessing, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('processing', 'callback')}
        </h2>
        <p className="text-gray-600">
          {t('redirecting', 'callback')}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          {t('closeWindow', 'callback')}
        </p>
      </div>
    </div>
  )
}