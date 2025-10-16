'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';
import { useLocale } from '@/contexts/LocaleContext';
import { authService } from '@/services/authService';
import { Logo } from '@/components/Logo';

function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password.length < 6) {
      setError(t('passwordTooShort', 'resetPassword'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch', 'resetPassword'));
      return;
    }

    if (!token) {
      setError(t('tokenMissing', 'resetPassword'));
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/auth/login?message=password-reset-success');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetFailed', 'resetPassword'));
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        
        <div className="max-w-md w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              {t('invalidLink', 'resetPassword')}
            </h1>

            <p className="text-gray-600 text-center mb-6">
              {t('invalidLinkDescription', 'resetPassword')}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors"
              >
                {t('requestNewLink', 'resetPassword')}
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {t('backToLogin', 'resetPassword')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        
        <div className="max-w-md w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              {t('passwordResetSuccess', 'resetPassword')}
            </h1>

            <p className="text-gray-600 text-center mb-6">
              {t('passwordResetSuccessDescription', 'resetPassword')}
            </p>

            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors"
            >
              {t('goToLogin', 'resetPassword')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('resetPassword', 'resetPassword')}
            </h1>
            <p className="text-gray-600">
              {t('enterNewPassword', 'resetPassword')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('newPassword', 'resetPassword')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('passwordPlaceholder', 'auth')}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('passwordMinLength', 'resetPassword')}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword', 'resetPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('confirmPasswordPlaceholder', 'resetPassword')}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('resetting', 'resetPassword')}
                </>
              ) : (
                t('resetPasswordButton', 'resetPassword')
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/login"
              className="text-sm text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
            >
              {t('backToLogin', 'resetPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
