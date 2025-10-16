'use client'

import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { useLocale } from '@/contexts/LocaleContext'
import { GoogleIcon } from './GoogleIcon'

export function GoogleAuthButton() {
  const { user, isLoaded, signInWithGoogle, signOut } = useGoogleAuth()
  const { t } = useLocale()

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
    <div>
      {/* Usar solo nuestro botón personalizado - Sin warnings de FedCM */}
      {!user && (
        <button
          onClick={signInWithGoogle}
          disabled={!isLoaded}
          className={`w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13a4ec] ${
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
    </div>
  )
}