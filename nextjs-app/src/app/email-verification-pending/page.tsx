'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function EmailVerificationPendingPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    setResendError(null);
    
    try {
      // TODO: Implementar endpoint para reenviar email de verificación
      // await authService.resendVerificationEmail(user.email);
      
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResendError(t('resendEmailError', 'verification') || 'Error al reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      {/* Language Selector */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            {t('verifyYourEmail', 'verification') || 'Verifica tu email'}
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            {t('verificationEmailSent', 'verification') || 'Hemos enviado un email de verificación a'}{' '}
            <span className="font-semibold text-gray-900">{user?.email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              {t('checkInbox', 'verification') || 'Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para continuar.'}
            </p>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✓ {t('emailResentSuccess', 'verification') || 'Email de verificación reenviado exitosamente'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                ✗ {resendError}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Resend Email Button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendSuccess}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isResending || resendSuccess
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isResending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('resending', 'verification') || 'Reenviando...'}
                </span>
              ) : resendSuccess ? (
                t('emailResent', 'verification') || '✓ Email reenviado'
              ) : (
                t('resendEmail', 'verification') || 'Reenviar email de verificación'
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {t('logout', 'auth') || 'Cerrar sesión'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('didntReceiveEmail', 'verification') || '¿No recibiste el email?'}
            </p>
            <ul className="mt-2 text-xs text-gray-500 space-y-1">
              <li>• {t('checkSpam', 'verification') || 'Revisa tu carpeta de spam'}</li>
              <li>• {t('checkEmailCorrect', 'verification') || 'Verifica que el email sea correcto'}</li>
              <li>• {t('waitFewMinutes', 'verification') || 'Espera unos minutos e intenta reenviar'}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {t('needHelp', 'verification') || '¿Necesitas ayuda?'}{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800 font-medium">
              {t('contactSupport', 'verification') || 'Contacta soporte'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
