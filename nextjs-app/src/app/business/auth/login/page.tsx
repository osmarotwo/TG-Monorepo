'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { useLocale } from '@/contexts/LocaleContext';
import { Logo } from '@/components/Logo';

export default function BusinessLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempted, setLoginAttempted] = useState(false);
  const router = useRouter();
  const { loginNative, user: authUser } = useAuth();
  const { t } = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginAttempted(true);

    try {
      await loginNative({
        email: formData.email,
        password: formData.password
      });
      
      // loginNative will update authUser, then useEffect will handle redirect
    } catch (err: any) {
      setError(err.message || t('connectionError', 'auth'));
      setLoading(false);
      setLoginAttempted(false);
    }
  };

  // Helper to determine if the authenticated user belongs to a business account
  const isBusinessAccount = (user: typeof authUser) => {
    if (!user) return false;
    if (user.profileType === 'business') return true;
    if (user.role && user.role.includes('business')) return true;
    if (user.businessName || user.businessType) return true;
    return false;
  };

  // Auto-redirect when authenticated
  useEffect(() => {
    if (!authUser || !loginAttempted) return;
    
    if (isBusinessAccount(authUser)) {
      setLoading(false);
      setError('');
      router.push('/business/dashboard');
      return;
    }

    setLoading(false);
    setError(t('business.auth.notBusinessAccount'));
  }, [authUser, loginAttempted, router, t]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="max-w-md w-full">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('business.auth.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('business.auth.accessBusinessPortal')}
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleAuthButton profileType="business" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/50 text-gray-500">
                {t('or', 'auth')}
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email', 'auth')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 focus:ring-offset-white focus:border-transparent transition-colors invalid:border-red-400 invalid:focus:ring-red-200"
                placeholder={t('emailPlaceholder', 'auth')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password', 'auth')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 focus:ring-offset-white focus:border-transparent transition-colors"
                placeholder={t('passwordPlaceholder', 'auth')}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#13a4ec] focus:ring-[#13a4ec]"
                />
                <span className="ml-2 text-gray-600">{t('rememberMe', 'auth')}</span>
              </label>
              <Link
                href="/business/auth/forgot-password"
                className="text-[#13a4ec] hover:text-[#0f8fcd]"
              >
                {t('forgotPassword', 'auth')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#13a4ec] hover:bg-[#0f8fcd] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('loading', 'common') : t('business.auth.signInToBusiness')}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {t('dontHaveBusinessAccount', 'business.auth')}{' '}
            <Link
              href="/business/auth/register"
              className="text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
            >
              {t('signUp', 'auth')}
            </Link>
          </p>

          {/* Back to Customer Portal */}
          <p className="mt-4 text-center text-xs text-gray-500">
            <Link
              href="/auth/login"
              className="hover:text-[#13a4ec]"
            >
              ← Customer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
