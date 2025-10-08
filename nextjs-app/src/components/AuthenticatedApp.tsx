'use client'

import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import LanguageSelector from '../components/LanguageSelector'
import RegistrationForm from '../components/RegistrationForm'
import EmailVerification from '../components/EmailVerification'
import ProfileCompletion from '../components/ProfileCompletion'

// Componente de Dashboard básico
function UserDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLocale()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('welcome', 'dashboard')} {user?.firstName}!
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {t('logout', 'navigation')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t('overview', 'dashboard')}
              </h2>
              
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {t('profile', 'navigation')}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</p>
                    {user?.phone && <p><strong>Teléfono:</strong> {user.phone}</p>}
                    {user?.birthDate && <p><strong>Fecha de nacimiento:</strong> {user.birthDate}</p>}
                    <p><strong>Proveedor:</strong> {user?.provider === 'google' ? 'Google' : 'Email'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Estado de la cuenta
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      {user?.emailVerified ? (
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      Email {user?.emailVerified ? 'verificado' : 'sin verificar'}
                    </div>
                    
                    <div className="flex items-center">
                      {user?.profileCompleted ? (
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      Perfil {user?.profileCompleted ? 'completo' : 'incompleto'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

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

// Componente principal con routing inteligente
export default function AuthenticatedApp() {
  const { 
    status, 
    user, 
    isLoading, 
    requiresEmailVerification, 
    requiresProfileCompletion 
  } = useAuth()
  const { t } = useLocale()

  // Mostrar loading mientras se verifica la autenticación
  if (status === 'loading' || isLoading) {
    return <LoadingScreen />
  }

  // Usuario no autenticado - mostrar formulario de registro
  if (status === 'unauthenticated') {
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

  // Usuario registrado pero email sin verificar
  if (requiresEmailVerification) {
    return (
      <EmailVerification 
        email={user?.email}
        onSuccess={() => window.location.reload()} // Recargar para verificar nuevo estado
      />
    )
  }

  // Usuario con email verificado pero perfil incompleto
  if (requiresProfileCompletion) {
    return (
      <ProfileCompletion 
        onSuccess={() => window.location.reload()} // Recargar para verificar nuevo estado
        onSkip={() => window.location.reload()} // Permitir omitir por ahora
      />
    )
  }

  // Usuario completamente autenticado
  return <UserDashboard />
}