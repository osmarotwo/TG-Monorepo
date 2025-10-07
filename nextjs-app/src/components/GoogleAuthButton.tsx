'use client'

import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { useLocale } from '@/contexts/LocaleContext'
import { GoogleIcon } from './GoogleIcon'

export function GoogleAuthButton() {
  const { user, isLoaded, signInWithGoogle, signOut } = useGoogleAuth()
  const { t } = useLocale()

  // NO usar renderButton() de Google para evitar warnings de FedCM
  // Usar solo nuestro botón personalizado que abre popup directamente

  // Función de diagnóstico mejorada
  const testGoogleConfig = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const currentOrigin = window.location.origin
    
    // Limpiar estado de Google
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    
    alert(`🔍 Diagnóstico Google OAuth:

✅ Client ID: ${clientId ? clientId.substring(0, 20) + '...' : 'NO CONFIGURADO'}
✅ Origen actual: ${currentOrigin}
✅ SDK cargado: ${window.google ? 'SÍ' : 'NO'}

💡 Sugerencias:
1. Asegúrate de estar logueado en Google (ve a google.com)
2. Prueba en modo incógnito
3. Ahora usamos solo botón personalizado (sin FedCM warnings)

🧹 Estado de Google limpiado`)
  }

  if (user) {
    return (
      <div className="w-full p-4 border border-green-300 rounded-lg bg-green-50">
        <div className="flex items-center space-x-3 mb-3">
          <div 
            style={{ backgroundImage: `url(${user.picture})` }}
            className="w-10 h-10 rounded-full bg-cover bg-center"
          />
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
        >
          {t('logoutButton', 'auth')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Usar solo nuestro botón personalizado - Sin warnings de FedCM */}
      {!user && (
        <button
          onClick={signInWithGoogle}
          disabled={!isLoaded}
          className={`w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoaded 
              ? 'hover:bg-gray-50 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <GoogleIcon />
          <span className="ml-2">
            {isLoaded ? t('googleButton', 'auth') : t('loadingGoogle', 'auth')}
          </span>
        </button>
      )}
      
      {/* Botón de diagnóstico */}
      <button
        onClick={testGoogleConfig}
        className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs"
      >
        {t('diagnoseConfig', 'auth')}
      </button>
    </div>
  )
}