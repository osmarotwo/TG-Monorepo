'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { useRouter } from 'next/navigation'

// Componente de Loading
function LoadingScreen() {
  const { t } = useLocale()
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('loading', 'common')}
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal - redirige usuarios no autenticados al login
export default function AuthenticatedApp() {
  const { status, user, isLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  // Manejar redirecciones basadas en el estado de autenticación
  useEffect(() => {
    if (status === 'loading' || isLoading) return

    if (status === 'authenticated' && user) {
      // Si el perfil no está completo, ir a onboarding
      if (!user.profileCompleted) {
        router.replace('/onboarding')
      } else {
        // Si está todo completo, ir al dashboard
        router.replace('/dashboard')
      }
    } else if (status === 'email-pending') {
      // Email no verificado - redirigir a página de verificación pendiente
      router.replace('/email-verification-pending')
    } else if (status === 'profile-pending') {
      // Perfil no completado - redirigir a onboarding
      router.replace('/onboarding')
    } else if (status === 'unauthenticated') {
      // Usuario no autenticado - redirigir a login
      router.replace('/auth/login')
    }
  }, [status, user, isLoading, router])

  // Mostrar loading mientras se verifica la autenticación o redirige
  return <LoadingScreen />
}