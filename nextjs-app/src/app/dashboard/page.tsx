'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import LanguageSelector from '@/components/LanguageSelector'
import { Logo } from '@/components/Logo'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, logout, status } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  // Redirigir si no está autenticado o si el perfil no está completo
  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.replace('/')
      return
    }
    
    if (user && !user.profileCompleted) {
      router.replace('/onboarding')
      return
    }
  }, [status, user, router])

  // Mostrar loading mientras se verifica
  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <h1 className="text-2xl font-bold text-gray-900">
                {t('welcome', 'dashboard')} {user?.firstName}!
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={logout}
                className="text-gray-500 hover:text-[#13a4ec] text-sm font-medium transition-colors"
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
          <div className="bg-white/50 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t('overview', 'dashboard')}
              </h2>
              
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#f6f7f8] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {t('profile', 'navigation')}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>{t('fullName', 'auth')}:</strong> {user?.firstName} {user?.lastName}</p>
                    {user?.phone && <p><strong>{t('phone', 'user')}:</strong> {user.phone}</p>}
                    {user?.birthDate && <p><strong>{t('birthDate', 'user')}:</strong> {user.birthDate}</p>}
                    <div className="flex items-center">
                      <strong className="mr-2">{t('provider', 'dashboard')}:</strong>
                      {user?.provider === 'google' ? (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                          </svg>
                          Email
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#f6f7f8] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {t('accountStatus', 'dashboard')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      {user?.emailVerified ? (
                        <>
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t('emailVerified', 'dashboard')}
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {t('emailNotVerified', 'dashboard')}
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {user?.profileCompleted ? (
                        <>
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t('profileComplete', 'dashboard')}
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {t('profileIncomplete', 'dashboard')}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              {(user?.createdAt || user?.updatedAt) && (
                <div className="mt-6 bg-[#f6f7f8] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {t('sessionInfo', 'dashboard')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {user?.createdAt && (
                      <div>
                        <strong>{t('createdAt', 'dashboard')}:</strong>{' '}
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    {user?.updatedAt && (
                      <div>
                        <strong>{t('lastLogin', 'dashboard')}:</strong>{' '}
                        {new Date(user.updatedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
