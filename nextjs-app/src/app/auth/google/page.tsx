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
      console.log('🔵 Iniciando handleGoogleAuth, hasProcessed:', hasProcessed.current);
      
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

      console.log('🔵 Parámetros de URL:', { code: code?.slice(0, 20) + '...', error, state });

      if (error) {
        console.error('❌ Error en URL params:', error);
        alert(`${t('authorizationError', 'callback')} ${error}`);
        router.replace('/');
        return;
      }

      if (code && state === 'google_auth') {
        try {
          console.log('🔵 Intercambiando código por token...');
          // Llama a tu backend para intercambiar el código por el idToken de Google
          const redirectUri = window.location.origin + '/auth/google';
          console.log('🔵 Redirect URI para intercambio:', redirectUri);
          
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
          
          console.log('🔵 Respuesta del backend:', response.status, response.statusText);
          const data = await response.json();
          console.log('🔵 Data recibida:', data);
          
          if (!response.ok || !data.idToken) {
            console.error('❌ Error al obtener idToken:', data.error);
            throw new Error(data.error || 'No se pudo obtener el idToken de Google');
          }
          
          console.log('✅ idToken obtenido, autenticando con contexto...');
          // Autentica globalmente usando el contexto
          await authenticateWithGoogle({ idToken: data.idToken });
          console.log('✅ Autenticación completada');
          
          // La redirección se hará en el siguiente useEffect cuando el user se actualice
          
        } catch (err: any) {
          console.error('❌ Error en handleGoogleAuth:', err);
          alert(t('authorizationError', 'callback') + ': ' + err.message);
          router.replace('/');
        }
      } else {
        console.error('❌ Código o state inválidos');
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