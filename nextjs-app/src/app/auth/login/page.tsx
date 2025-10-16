'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { useLocale } from '@/contexts/LocaleContext';
import { Logo } from '@/components/Logo';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const { loginNative, isLoading, error: authError, status, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  useEffect(() => {
    // Check for success messages from URL params
    const message = searchParams.get('message');
    const verified = searchParams.get('verified');

    if (message === 'registration-success') {
      setSuccessMessage(t('registrationSuccessNotice', 'auth'));
    } else if (message === 'password-reset-success') {
      setSuccessMessage(t('passwordResetSuccess', 'auth'));
    } else if (verified === 'true') {
      setSuccessMessage(t('emailVerifiedNotice', 'auth'));
    }
  }, [searchParams, t]);

  // Redirect based on auth status after login
  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (!user.profileCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } else if (status === 'email-pending') {
      router.push('/email-verification-pending');
    } else if (status === 'profile-pending') {
      router.push('/onboarding');
    }
  }, [status, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear success message when user starts typing
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await loginNative({
        email: formData.email,
        password: formData.password
      });
      
      // AuthContext will handle the redirection based on user status
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4 py-8">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white/50 backdrop-blur-sm shadow-2xl p-8">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-6">
            <Logo size="lg" className="mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('signIn', 'auth')}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('accessYourAccount', 'auth')}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm text-red-800">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                {t('email', 'auth')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] p-3"
                placeholder={t('email', 'auth')}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                {t('password', 'auth')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] p-3"
                placeholder={t('password', 'auth')}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-[#13a4ec] hover:text-[#13a4ec]/90 font-medium"
              >
                {t('forgotPassword', 'auth')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13a4ec] hover:bg-[#13a4ec]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13a4ec] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('signingIn', 'auth')}
                </div>
              ) : (
                t('signIn', 'auth')
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('or', 'auth')}</span>
              </div>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="mt-6">
            <GoogleAuthButton />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600">
            {t('dontHaveAccount', 'auth')}{' '}
            <Link href="/auth/register" className="font-medium text-[#13a4ec] hover:text-[#13a4ec]/90">
              {t('signUp', 'auth')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}