'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { useRouter } from 'next/navigation'
import LanguageSelector from '../components/LanguageSelector'
import RegistrationForm from '../components/RegistrationForm'

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

// Componente principal - ahora solo muestra login/registro o redirige a las páginas apropiadas
export default function AuthenticatedApp() {
  const { status, user, isLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  // Redirigir usuarios autenticados a la página apropiada
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
    }
  }, [status, user, isLoading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (status === 'loading' || isLoading) {
    return <LoadingScreen />
  }

  // Si está autenticado, mostrar loading mientras redirige
  if (status === 'authenticated') {
    return <LoadingScreen />
  }

  // Usuario no autenticado - mostrar formulario de registro/login
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Language Selector en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('title', 'auth')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('description', 'auth')}
          </p>
        </div>

        {/* Divider */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">{t('orSignUpWith', 'auth')}</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <RegistrationForm />
      </div>
    </div>
  )
}