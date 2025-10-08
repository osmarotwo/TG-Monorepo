'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'

interface EmailVerificationProps {
  email?: string
  onSuccess?: () => void
  onBackToHome?: () => void
}

export default function EmailVerification({ email, onSuccess, onBackToHome }: EmailVerificationProps) {
  const { verifyEmail, isLoading, error } = useAuth()
  const { t } = useLocale()
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Manejo de verificación con token
  const handleVerifyWithToken = useCallback(async (token: string) => {
    try {
      setVerificationStatus('verifying')
      await verifyEmail(token)
      setVerificationStatus('success')
      
      // Dar tiempo para mostrar el mensaje de éxito antes de redirigir
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
      
    } catch (err) {
      console.error('Email verification failed:', err)
      setVerificationStatus('error')
    }
  }, [verifyEmail, onSuccess])

  // Verificar token desde URL si existe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      handleVerifyWithToken(token)
    }
  }, [handleVerifyWithToken])

  // Cooldown para reenvío
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return

    try {
      // TODO: Implementar endpoint de reenvío en el backend
      // await authService.resendVerificationEmail(email)
      
      setResendCooldown(60) // 60 segundos de cooldown
      
      // Simulación por ahora
      alert('Email de verificación reenviado')
      
    } catch (err) {
      console.error('Failed to resend email:', err)
    }
  }

  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('verifyingEmail', 'verification')}
            </h2>
            <p className="text-gray-600">
              {t('pleaseWait', 'verification')}
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('emailVerified', 'verification')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('emailVerifiedDescription', 'verification')}
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              {t('redirectingToDashboard', 'verification')}
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('verificationFailed', 'verification')}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || t('verificationFailedDescription', 'verification')}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? `${t('resendIn', 'verification')} ${resendCooldown}s`
                  : t('resendEmail', 'verification')
                }
              </button>
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('backToHome', 'verification')}
                </button>
              )}
            </div>
          </div>
        )

      default: // pending
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('verifyYourEmail', 'verification')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {t('verificationEmailSent', 'verification')}
            </p>
            
            {email && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-8">
              {t('checkSpamFolder', 'verification')}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('sending', 'verification')}
                  </div>
                ) : resendCooldown > 0 ? (
                  `${t('resendIn', 'verification')} ${resendCooldown}s`
                ) : (
                  t('resendEmail', 'verification')
                )}
              </button>
              
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('backToHome', 'verification')}
                </button>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderVerificationStatus()}
        </div>
      </div>
    </div>
  )
}